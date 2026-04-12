-- ==========================================================================
-- Adana schema — adds project_notes table (one markdown note per project).
-- Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
-- Apply with:  cd adana && npx supabase db push
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.project_notes (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  content_md TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissive RLS (demo mode) — allow all
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_project_notes" ON public.project_notes;
CREATE POLICY "allow_all_project_notes" ON public.project_notes
  FOR ALL USING (true) WITH CHECK (true);
