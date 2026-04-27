-- Comments, likes, followers, activity events, and recurring tasks
-- support for the Asana-parity push (Adana feature buckets B/D/I).

-- ----------------------------------------------------------------------------
-- comments
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.comments (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_all" ON public.comments;
CREATE POLICY "comments_all" ON public.comments FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- comment_likes
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id          TEXT PRIMARY KEY,
  comment_id  TEXT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comment_likes_all" ON public.comment_likes;
CREATE POLICY "comment_likes_all" ON public.comment_likes FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- task_likes
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.task_likes (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_task_likes_task_id ON public.task_likes(task_id);

ALTER TABLE public.task_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_likes_all" ON public.task_likes;
CREATE POLICY "task_likes_all" ON public.task_likes FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- task_followers
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.task_followers (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_task_followers_task_id ON public.task_followers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_followers_user_id ON public.task_followers(user_id);

ALTER TABLE public.task_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_followers_all" ON public.task_followers;
CREATE POLICY "task_followers_all" ON public.task_followers FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- activity_events
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.activity_events (
  id          TEXT PRIMARY KEY,
  task_id     TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id  TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id    TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_events_task_id ON public.activity_events(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_project_id ON public.activity_events(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_events_all" ON public.activity_events;
CREATE POLICY "activity_events_all" ON public.activity_events FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- tasks: recurrence + is_private + deleted_at columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence  JSONB;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_private  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;
