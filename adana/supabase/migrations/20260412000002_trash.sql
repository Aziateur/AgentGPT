-- Soft-delete support for tasks and projects.
-- Sets deleted_at to a timestamp when an item is trashed; NULL means "not trashed".
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks (deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects (deleted_at);
