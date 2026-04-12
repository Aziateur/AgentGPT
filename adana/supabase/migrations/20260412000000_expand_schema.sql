-- ==========================================================================
-- Adana schema expansion — adds support for the broader Asana feature set.
-- Idempotent: uses IF NOT EXISTS everywhere so re-running is safe.
-- Apply with:  cd adana && npx supabase db push
-- ==========================================================================

-- ----------------------------------
-- Extend existing tables
-- ----------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours NUMERIC(6,2);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brief_md   TEXT,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS team_id    TEXT;

ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS wip_limit INTEGER,
  ADD COLUMN IF NOT EXISTS collapsed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence        JSONB,
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS actual_minutes    INTEGER,
  ADD COLUMN IF NOT EXISTS effort_hours      NUMERIC(6,2);

-- ----------------------------------
-- Teams
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.teams (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id    TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Multi-homing (task can live in multiple projects)
CREATE TABLE IF NOT EXISTS public.task_projects (
  task_id    TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES public.sections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, project_id)
);

-- ----------------------------------
-- Tags
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#4c6ef5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_tags (
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES public.tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ----------------------------------
-- Custom Fields
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.custom_field_defs (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  field_type  TEXT NOT NULL, -- text, number, date, single_select, multi_select, people, checkbox, formula
  options     JSONB,         -- array of {id, label, color} for selects OR { formula: string } for formula
  required    BOOLEAN DEFAULT FALSE,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  field_id         TEXT NOT NULL REFERENCES public.custom_field_defs(id) ON DELETE CASCADE,
  value_text       TEXT,
  value_number     NUMERIC,
  value_date       TIMESTAMPTZ,
  value_user_id    TEXT,
  value_select_ids JSONB, -- array of option ids (supports multi-select)
  value_bool       BOOLEAN,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, field_id)
);

-- ----------------------------------
-- Dependencies
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id               TEXT PRIMARY KEY,
  blocker_task_id  TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  blocked_task_id  TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dep_type         TEXT DEFAULT 'finish_to_start',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_task_id, blocked_task_id)
);

-- ----------------------------------
-- Attachments (Supabase Storage)
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.attachments (
  id            TEXT PRIMARY KEY,
  task_id       TEXT REFERENCES public.tasks(id)    ON DELETE CASCADE,
  project_id    TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  uploader_id   TEXT REFERENCES public.users(id)    ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT,
  storage_path  TEXT NOT NULL,  -- relative path inside "attachments" bucket
  public_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Attempt to create storage bucket (idempotent)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('attachments', 'attachments', TRUE)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;

-- ----------------------------------
-- Notifications
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id       TEXT REFERENCES public.users(id)    ON DELETE SET NULL,
  type           TEXT NOT NULL,
  task_id        TEXT REFERENCES public.tasks(id)    ON DELETE CASCADE,
  project_id     TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  message        TEXT,
  link_url       TEXT,
  read           BOOLEAN DEFAULT FALSE,
  archived       BOOLEAN DEFAULT FALSE,
  snoozed_until  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id) WHERE read = FALSE AND archived = FALSE;

-- ----------------------------------
-- Automation Rules
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  enabled         BOOLEAN DEFAULT TRUE,
  trigger_type    TEXT NOT NULL,
  trigger_config  JSONB DEFAULT '{}'::jsonb,
  actions         JSONB DEFAULT '[]'::jsonb, -- array of {type, config, condition?}
  scope           TEXT DEFAULT 'project',    -- project | workspace | my_tasks
  user_id         TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rule_executions (
  id          TEXT PRIMARY KEY,
  rule_id     TEXT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  task_id     TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
  status      TEXT NOT NULL, -- success | failed | skipped
  log         TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Forms
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.forms (
  id            TEXT PRIMARY KEY,
  project_id    TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  public_slug   TEXT UNIQUE,
  settings      JSONB DEFAULT '{}'::jsonb, -- { coverImage, mapping, thankYouMessage }
  enabled       BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.form_fields (
  id         TEXT PRIMARY KEY,
  form_id    TEXT NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  field_type TEXT NOT NULL,     -- text, paragraph, number, date, single_select, multi_select
  options    JSONB,             -- { choices: [{id,label}], branching: [...] }
  required   BOOLEAN DEFAULT FALSE,
  position   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id           TEXT PRIMARY KEY,
  form_id      TEXT NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  task_id      TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
  payload      JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Goals
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.goals (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  owner_id        TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  parent_id       TEXT REFERENCES public.goals(id) ON DELETE CASCADE,
  time_period     TEXT,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  metric_type     TEXT DEFAULT 'percentage',
  metric_target   NUMERIC,
  metric_current  NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'on_track',
  weight          NUMERIC DEFAULT 1,
  progress        NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id            TEXT PRIMARY KEY,
  goal_id       TEXT NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  project_id    TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  portfolio_id  TEXT,
  task_id       TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Portfolios
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.portfolios (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#4c6ef5',
  owner_id    TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  parent_id   TEXT REFERENCES public.portfolios(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  project_id   TEXT NOT NULL REFERENCES public.projects(id)   ON DELETE CASCADE,
  position     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (portfolio_id, project_id)
);

-- ----------------------------------
-- Project Status Updates
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.project_status_updates (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id  TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  status     TEXT NOT NULL,
  text       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Time Entries
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.time_entries (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Saved Views / Searches
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.saved_views (
  id           TEXT PRIMARY KEY,
  project_id   TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id      TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  view_type    TEXT NOT NULL, -- list | board | timeline | calendar
  filters      JSONB DEFAULT '[]'::jsonb,
  sort         JSONB DEFAULT '[]'::jsonb,
  group_by     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  filters    JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Dashboards (Reporting)
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.dashboards (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  scope_id   TEXT, -- project/team/portfolio id, or null for personal
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id            TEXT PRIMARY KEY,
  dashboard_id  TEXT NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  type          TEXT NOT NULL, -- counter | bar | line | pie | burnup | list
  config        JSONB NOT NULL,
  position      JSONB DEFAULT '{"x":0,"y":0,"w":6,"h":4}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Webhooks
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  target_url  TEXT NOT NULL,
  secret      TEXT,
  enabled     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- My Tasks (personal sections)
-- ----------------------------------

CREATE TABLE IF NOT EXISTS public.my_task_sections (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------
-- Permissive RLS (demo mode) — allow all
-- ----------------------------------

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'teams','team_members','project_members','task_projects',
    'tags','task_tags',
    'custom_field_defs','custom_field_values',
    'task_dependencies','attachments','notifications',
    'automation_rules','rule_executions',
    'forms','form_fields','form_submissions',
    'goals','goal_contributions',
    'portfolios','portfolio_projects',
    'project_status_updates','time_entries',
    'saved_views','saved_searches',
    'dashboards','dashboard_widgets',
    'webhook_subscriptions','my_task_sections'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Storage bucket policy for attachments (public demo)
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "attachments_public_read" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "attachments_public_write" ON storage.objects';
  EXECUTE $p$CREATE POLICY "attachments_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'attachments')$p$;
  EXECUTE $p$CREATE POLICY "attachments_public_write" ON storage.objects FOR ALL USING (bucket_id = 'attachments') WITH CHECK (bucket_id = 'attachments')$p$;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;
