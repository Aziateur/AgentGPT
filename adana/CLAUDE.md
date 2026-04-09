# AI Collaboration Constitution (Adana Project)

## 1. Project Overview
Adana is an Asana-like project management app built with Next.js 14. It is deployed as a **fully static site** (`output: "export"`) on **Cloudflare Pages** at `https://adana-aim.pages.dev`. The Cloudflare project name is `adana` (not `adana-aim`).

## 2. Architecture & Build Rules
- **Static Export ONLY.** `next.config.mjs` has `output: "export"`. The build outputs to `/out`.
- **NO `"use server"`** — Server Actions will break the static build. Everything runs client-side.
- **NO Prisma at runtime** — Prisma is still in `package.json` but is NOT used. All data access goes through `@supabase/supabase-js`.
- **Build validation:** Always run `npx next build` before considering work complete.
- **Deploy command:** `npx wrangler pages deploy out --project-name adana --branch main`
- **Direct to production:** All pushes go to `main` branch. No staging.

## 3. Supabase Backend (LIVE)
The app connects to Supabase project **"Wings Of God" (wog)**.

### Connection Details
- **Project Ref:** `qrksglxemydjzvpnyzzs`
- **URL:** `https://qrksglxemydjzvpnyzzs.supabase.co`
- **Anon Key:** Set in `.env` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Client singleton:** `src/lib/supabase.ts` (uses `@supabase/supabase-js`)

### Database Schema (LIVE — already pushed)
All tables use **snake_case** column names. The frontend TypeScript types use **camelCase**. You must map between them.

**`public.users`**
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. `demo-user` |
| name | TEXT NOT NULL | |
| email | TEXT UNIQUE NOT NULL | |
| avatar | TEXT | nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**`public.projects`**
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT NOT NULL | |
| description | TEXT | nullable |
| color | TEXT | DEFAULT `#4c6ef5` |
| icon | TEXT | DEFAULT `folder` |
| status | TEXT | DEFAULT `on_track` |
| archived | BOOLEAN | DEFAULT false |
| favorite | BOOLEAN | DEFAULT false |
| default_view | TEXT | DEFAULT `list` |
| owner_id | TEXT FK → users(id) | ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**`public.sections`**
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT NOT NULL | |
| position | INTEGER | DEFAULT 0 |
| project_id | TEXT FK → projects(id) | ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**`public.tasks`**
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| title | TEXT NOT NULL | |
| description | TEXT | nullable |
| completed | BOOLEAN | DEFAULT false |
| completed_at | TIMESTAMPTZ | nullable |
| due_date | TIMESTAMPTZ | nullable |
| due_time | TEXT | nullable |
| start_date | TIMESTAMPTZ | nullable |
| priority | TEXT | nullable (high/medium/low) |
| task_type | TEXT | DEFAULT `task` |
| approval_status | TEXT | nullable |
| position | INTEGER | DEFAULT 0 |
| is_template | BOOLEAN | DEFAULT false |
| assignee_id | TEXT FK → users(id) | ON DELETE SET NULL |
| creator_id | TEXT FK → users(id) | ON DELETE CASCADE |
| project_id | TEXT FK → projects(id) | ON DELETE CASCADE |
| section_id | TEXT FK → sections(id) | ON DELETE SET NULL |
| parent_id | TEXT FK → tasks(id) | ON DELETE CASCADE (subtasks) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### RLS Policies
All tables have RLS enabled with permissive "allow all" policies (no auth yet).

### Seeded Data
- `demo-user` / Demo User / demo@adana.dev
- `user-2` / Sarah Chen / sarah@adana.dev
- `user-3` / Alex Rivera / alex@adana.dev
- Projects, sections, and tasks tables are **empty** — seed on first client load.

## 4. Current Data Layer (NEEDS MIGRATION)
The app currently uses hardcoded mock data from `src/lib/mock-data.ts`. The following 16 files import from it:

```
src/app/(dashboard)/home/page.tsx
src/app/(dashboard)/my-tasks/page.tsx
src/app/(dashboard)/inbox/page.tsx
src/app/(dashboard)/goals/page.tsx
src/app/(dashboard)/projects/[id]/calendar/page.tsx
src/app/(dashboard)/projects/[id]/board/page.tsx
src/app/(dashboard)/projects/[id]/list/page.tsx
src/app/(dashboard)/projects/[id]/layout.tsx
src/app/(dashboard)/projects/[id]/overview/page.tsx
src/app/(dashboard)/projects/[id]/page.tsx
src/app/(dashboard)/projects/[id]/timeline/page.tsx
src/app/(dashboard)/projects/page.tsx
src/app/(dashboard)/portfolios/page.tsx
src/app/(dashboard)/search/page.tsx
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/teams/page.tsx
```

### The Problem
Each page creates its own local `useState` copy of the mock data. When you create a task in List view, it vanishes when you switch to Board view. The "Create Project" button in `projects-client.tsx` just closes the modal without saving anything.

## 5. CURRENT TASK: Wire Frontend to Supabase via Zustand

### Phase 1: Create Zustand Store (`src/store/app-store.ts`)
Zustand v5.0.1 is already installed. Create a global store that:
- Holds arrays for `projects`, `tasks`, `sections`, `users`
- On `init()`, fetches from Supabase using `src/lib/supabase.ts`
- If Supabase is empty or fails, falls back to `src/lib/mock-data.ts`
- If projects table is empty, auto-seeds it with mock data by inserting into Supabase
- Provides mutation methods that update BOTH Zustand state AND Supabase:
  - `createProject(data)`, `updateProject(id, updates)`, `deleteProject(id)`
  - `createTask(data)`, `updateTask(id, updates)`, `deleteTask(id)`, `toggleTaskComplete(id)`
  - `createSection(data)`, `fetchProjectData(projectId)`
- Generates IDs client-side with `crypto.randomUUID()`

### Phase 2: Refactor Pages
Replace all `mock-data.ts` imports with Zustand store hooks. Priority files:
1. `projects-client.tsx` — wire `handleCreateProject` to `store.createProject`
2. `list-client.tsx` — read tasks/sections from store, mutations go to store
3. `board/page.tsx` — same
4. `home/page.tsx`, `my-tasks/page.tsx` — read from store
5. All `projects/[id]/*` pages — read from store

### Phase 3: Verify
- `npx next build` must succeed
- Creating a project or task should persist across page navigation
- Data should survive a full page refresh (it's in Supabase now)

## 6. Key Files Reference
| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/mock-data.ts` | Fallback mock data (DO NOT DELETE) |
| `src/types/index.ts` | All TypeScript interfaces (camelCase) |
| `src/app/(dashboard)/projects/projects-client.tsx` | Projects grid + create modal |
| `src/app/(dashboard)/projects/[id]/list/list-client.tsx` | List view + task CRUD |
| `src/components/tasks/create-task-modal.tsx` | Create task form |
| `.env` | Supabase URL + anon key |
| `next.config.mjs` | Static export config |
| `wrangler.toml` | Cloudflare Pages config |
| `supabase/migrations/20260408154545_init_schema.sql` | DB schema (already pushed) |

## 7. Agent Roles
- **Antigravity:** Database, schema, Supabase config, migrations, env vars, deployment
- **Claude Code:** Frontend rewiring, Zustand store, component refactoring, UI logic
- **Handoff:** If leaving work incomplete, update this file or create `.agent-handoff.md`

## 8. Tech Stack
- Next.js 14.2.18 (static export)
- React 18
- TypeScript 5.6
- Tailwind CSS 3.4
- Zustand 5.0.1 (state management)
- @supabase/supabase-js (data layer)
- Framer Motion (animations)
- Radix UI (component primitives)
- Lucide React (icons)
- Recharts (charts)
- date-fns (date utilities)
- Cloudflare Pages (hosting)

## 9. Operational Tools & CLI Commands

### Supabase CLI
- **Installed:** `npx supabase` (v2.75.0, local — no global install)
- **Linked project:** `wog` (ref: `qrksglxemydjzvpnyzzs`)
- **Auth token:** Stored locally via `npx supabase login` (PAT starting with `sbp_4274...`)
- **Push migrations:** `npx supabase db push` (from project root, will prompt Y/n)
- **Create new migration:** `npx supabase migration new <name>` → writes to `supabase/migrations/`
- **Pull remote schema:** `npx supabase db pull`
- **NOTE:** This CLI version does NOT support `db execute` remotely. To run ad-hoc SQL, use the Supabase Dashboard SQL Editor or curl the REST API.

### Cloudflare / Wrangler CLI
- **Installed:** `npx wrangler` (v4.65.0)
- **Cloudflare project name:** `adana` (the live URL is `adana-aim.pages.dev` but the internal project name is just `adana`)
- **Build:** `npx next build` (outputs static files to `/out`)
- **Deploy to production:** `npx wrangler pages deploy out --project-name adana --branch main`
- **NOTE:** Do NOT use `--project-name adana-aim` — that will try to create a new project. The correct name is `adana`.

### Git
- **Remote:** GitHub (push to `main` for production)
- **Push command:** `git add -A && git commit -m "message" && git push origin main`
- **Branch strategy:** Single branch (`main`), direct to production. No PRs, no staging. **CRITICAL INSTRUCTION: DO NOT CREATE NEW BRANCHES.** There is exactly ONE allowed branch (`main`). You are strictly forbidden from running `git checkout -b` or pushing to any branch other than `main`. All changes must be pushed directly to `main`.

### Verifying the Live Database via API (no CLI needed)
```bash
curl -s "https://qrksglxemydjzvpnyzzs.supabase.co/rest/v1/TABLE_NAME?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
Replace `TABLE_NAME` with `users`, `projects`, `sections`, or `tasks`.
