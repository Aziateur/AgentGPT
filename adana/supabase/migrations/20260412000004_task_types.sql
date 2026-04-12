CREATE TABLE IF NOT EXISTS public.task_types (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4c6ef5',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_task_types" ON public.task_types FOR ALL USING (true) WITH CHECK (true);
