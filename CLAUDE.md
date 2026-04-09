# Adana - Clone Asana (Gestion de Projet)

## Description
Reconstruction complète d'Asana (asana.com) en tant qu'application web de gestion de projet appelée **Adana**.
Tech stack: Next.js 14 (App Router, static export) + TypeScript + Tailwind CSS + Zustand + Supabase (Postgres).
Deployed as a fully static site on Cloudflare Pages via the `main` branch.

---

## FONCTIONNALITES A IMPLEMENTER (checklist)

### 1. SYSTEME DE BASE
- [x] Structure du projet Next.js 14 (App Router)
- [x] Configuration Tailwind CSS + theme Asana-like
- [x] Base de données Prisma + SQLite
- [x] Layout principal (sidebar + header + contenu)
- [x] Système d'authentification (simple, email-based)
- [x] Navigation sidebar (Home, My Tasks, Inbox, Projects, Portfolios, Goals, Reporting)

### 2. PROJETS (source: asana.com/product/projects)
- [x] Création de projet (nom, description, couleur, icône)
- [x] Vue Liste (list view) - tableau de tâches triable
- [x] Vue Board/Kanban - colonnes drag & drop
- [x] Vue Timeline/Gantt - visualisation chronologique
- [x] Vue Calendrier - tâches sur calendrier mensuel
- [x] Sections dans les projets (grouper les tâches)
- [x] Project Overview/Brief (description, membres, statut)
- [x] Project Status Updates (on track, at risk, off track)
- [x] Templates de projets
- [x] Archivage de projets
- [x] Projets favoris (étoile)

### 3. TACHES (source: asana.com/product/tasks)
- [x] Création de tâche (titre, description, assignee, due date)
- [x] Description riche (markdown/rich text)
- [x] Sous-tâches (subtasks) - hiérarchie illimitée
- [x] Sections (regroupement de tâches dans un projet)
- [x] Custom Fields (texte, nombre, dropdown, date, checkbox)
- [x] Assignee (assigner à un membre)
- [x] Due date + Due time
- [x] Priorité (High, Medium, Low)
- [x] Tags/Labels
- [x] Pièces jointes (attachments) - upload fichiers
- [x] Commentaires sur les tâches
- [x] Likes/J'aime sur les tâches et commentaires
- [x] Followers (suivre une tâche)
- [x] Multi-homing (tâche dans plusieurs projets)
- [x] Milestones (jalons)
- [x] Approvals (approbation: approuver, demander changements, rejeter)
- [x] Task Templates
- [x] Dupliquer une tâche
- [x] Déplacer une tâche entre sections/projets
- [x] Compléter/Décompléter une tâche (checkbox)
- [x] Tri et filtrage avancé

### 4. DEPENDANCES (source: asana.com/product/dependencies)
- [x] Dépendance "Blocked by" (bloqué par)
- [x] Dépendance "Blocking" (bloque)
- [x] Visualisation des dépendances sur Timeline
- [x] Notification quand une tâche bloquante est complétée
- [x] Marquage visuel des tâches bloquées

### 5. AUTOMATISATIONS / RULES (source: asana.com/product/rules)
- [x] Système trigger → action
- [x] Triggers: tâche créée, tâche complétée, tâche déplacée, date approche, assignee changé, custom field changé
- [x] Actions: assigner, déplacer section, changer custom field, ajouter commentaire, marquer complète, changer priorité
- [x] Templates de règles préconfigurées
- [x] Règles personnalisées (créer ses propres combinaisons)
- [x] Historique d'exécution des règles
- [x] Activer/Désactiver une règle

### 6. PORTFOLIOS (source: asana.com/product/portfolios)
- [x] Créer un portfolio (collection de projets)
- [x] Vue d'ensemble des statuts de tous les projets
- [x] Progress tracking (% complétion)
- [x] Filtrage par statut, propriétaire, date
- [x] Vue liste et vue timeline des portfolios

### 7. GOALS / OBJECTIFS (source: asana.com/product/goals)
- [x] Création d'objectifs (OKRs)
- [x] Sous-objectifs (hiérarchie)
- [x] Lier des projets/portfolios aux objectifs
- [x] Tracking de progression (%, milestones)
- [x] Périodes (Q1, Q2, annuel, custom)
- [x] Statut des objectifs (on track, at risk, off track)

### 8. MY TASKS (source: asana.com - vue personnelle)
- [x] Vue "Récemment assignées"
- [x] Vue "Aujourd'hui"
- [x] Vue "À venir" (upcoming)
- [x] Vue "Plus tard" (later)
- [x] Organisation par date d'échéance
- [x] Organisation par projet

### 9. INBOX / NOTIFICATIONS
- [x] Fil d'activité (activity feed)
- [x] Notifications: assignation, commentaire, mention, tâche complétée
- [x] Marquer comme lu/non-lu
- [x] Archiver les notifications
- [x] Filtrage par type de notification

### 10. REPORTING / DASHBOARDS (source: asana.com/product/reporting)
- [x] Dashboard personnalisable
- [x] Graphiques: burnup, tasks by status, tasks by assignee
- [x] Widgets: compteurs, graphiques, listes
- [x] Filtrage par projet, équipe, période
- [x] Export des rapports

### 11. EQUIPES & WORKSPACE
- [x] Création d'équipes
- [x] Membres d'équipe (invite, rôles: admin, membre)
- [x] Page d'équipe (projets de l'équipe)
- [x] Workspace settings

### 12. RECHERCHE
- [x] Recherche globale (tâches, projets, personnes)
- [x] Recherche avancée (filtres multiples)
- [x] Recherches sauvegardées

### 13. FORMULAIRES (source: asana.com/product/forms)
- [x] Créer des formulaires liés à un projet
- [x] Champs de formulaire (texte, choix, date, etc.)
- [x] Soumission crée automatiquement une tâche
- [x] Lien partageable du formulaire

### 14. VUES ADDITIONNELLES
- [x] Vue Workload (charge de travail par personne)
- [x] Vue Files (tous les fichiers attachés)
- [x] Vue Messages (discussions d'équipe dans un projet)

### 15. UX/UI
- [x] Design moderne inspiré d'Asana
- [x] Dark mode / Light mode
- [x] Drag & drop (réorganiser tâches, colonnes)
- [x] Raccourcis clavier
- [x] Responsive design
- [x] Animations fluides (Framer Motion)

---

## ARCHITECTURE TECHNIQUE

```
adana/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Layout racine
│   │   ├── page.tsx            # Page d'accueil / redirect
│   │   ├── (auth)/             # Routes auth
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # Routes protégées
│   │   │   ├── layout.tsx      # Layout dashboard (sidebar)
│   │   │   ├── home/
│   │   │   ├── my-tasks/
│   │   │   ├── inbox/
│   │   │   ├── projects/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── list/
│   │   │   │   │   ├── board/
│   │   │   │   │   ├── timeline/
│   │   │   │   │   ├── calendar/
│   │   │   │   │   └── overview/
│   │   │   ├── portfolios/
│   │   │   ├── goals/
│   │   │   ├── reporting/
│   │   │   ├── teams/
│   │   │   └── search/
│   │   └── api/                # API Routes
│   ├── components/
│   │   ├── ui/                 # Composants UI réutilisables
│   │   ├── layout/             # Sidebar, Header, etc.
│   │   ├── tasks/              # Composants liés aux tâches
│   │   ├── projects/           # Composants liés aux projets
│   │   ├── board/              # Vue Kanban
│   │   ├── timeline/           # Vue Timeline
│   │   ├── calendar/           # Vue Calendrier
│   │   └── forms/              # Formulaires
│   ├── lib/
│   │   ├── prisma.ts           # Client Prisma
│   │   ├── auth.ts             # Utilitaires auth
│   │   └── utils.ts            # Utilitaires généraux
│   ├── hooks/                  # Custom hooks
│   ├── stores/                 # Zustand stores
│   ├── types/                  # Types TypeScript
│   └── styles/                 # Styles globaux
├── prisma/
│   └── schema.prisma           # Schéma de base de données
├── public/                     # Assets statiques
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## PROGRESSION

| Phase | Statut |
|-------|--------|
| Phase 1: Setup & Base | FAIT |
| Phase 2: Projets & Tâches | FAIT |
| Phase 3: Dépendances & Automatisations | FAIT |
| Phase 4: Portfolios, Goals, Reporting | FAIT |
| Phase 5: UX/UI Polish | FAIT |

---

## FICHIERS CREES (81 fichiers source)

### Pages (20 routes)
- `/` - Redirect vers /home
- `/home` - Dashboard principal (stats, tâches à venir, projets récents, activité)
- `/my-tasks` - Mes tâches (Today, Upcoming, Later)
- `/inbox` - Notifications (filtres, mark as read, archive)
- `/projects` - Liste des projets (grid, filtres, création)
- `/projects/[id]` - Redirect vers vue par défaut
- `/projects/[id]/list` - Vue liste avec sections, tri, filtres
- `/projects/[id]/board` - Vue Kanban drag & drop
- `/projects/[id]/timeline` - Vue Gantt/Timeline avec dépendances
- `/projects/[id]/calendar` - Vue calendrier mensuel
- `/projects/[id]/overview` - Aperçu projet (statut, membres, stats)
- `/portfolios` - Portfolios (collection de projets, progress)
- `/goals` - Objectifs OKR (arbre, progress, statuts)
- `/reporting` - Dashboard rapports (charts recharts)
- `/search` - Recherche globale + avancée
- `/teams` - Équipes (membres, projets)
- `/login` - Connexion
- `/register` - Inscription

### Server Actions (16 fichiers)
- auth, project, task, section, comment, dependency
- automation, portfolio, goal, notification, search
- team, form, tag, custom-field, reporting

### Composants (40+ composants)
- UI: button, input, badge, modal, dropdown, avatar, tooltip, progress-bar, checkbox, select, tabs, separator
- Layout: sidebar (dark, collapsible), header (search, view switcher), dashboard-layout
- Tasks: task-row, task-list, task-detail-panel, task-filters, create-task-modal, subtask-list
- Board: board-view, board-column, board-card (dnd-kit drag & drop)
- Timeline: timeline-view (Gantt avec dépendances SVG)
- Calendar: calendar-view (grille mensuelle)
- Projects: project-header (view tabs), project-overview
- Automation: rules-panel (trigger → action, templates)
- Portfolios: portfolio-view
- Goals: goals-tree (hiérarchie)
- Reporting: dashboard-widgets (recharts charts)
- Forms: form-builder, form-submit
- Inbox: notification-list
- Search: search-results
- Teams: team-card
- Workload: workload-view

### Base de données (Prisma + SQLite)
- 28 modèles: User, Team, TeamMember, Project, ProjectMember, ProjectStatus, ProjectTemplate, ProjectMessage, Section, Task, TaskProject, TaskTag, Tag, Dependency, CustomFieldDef, CustomFieldValue, Comment, TaskLike, CommentLike, TaskFollower, Attachment, Notification, AutomationRule, RuleExecution, Portfolio, PortfolioProject, Goal, GoalProject, Form, FormField, FormSubmission, SavedSearch
- Seed avec données démo (3 users, 3 projets, 9 tâches, 1 équipe, tags, dépendances, notifications, goals, portfolio, automation rules)

---

## FEATURES ASANA NON ENCORE IMPLEMENTEES (à faire dans le futur)
Source: recherche exhaustive sur asana.com (avril 2026)

- [ ] Tâches récurrentes (daily, weekly, monthly, custom interval)
- [ ] Proofing (annotations image/PDF avec feedback)
- [ ] Multi-select custom fields (multi-enum)
- [ ] Formula custom fields (champs calculés)
- [ ] Conditional branching dans les formulaires
- [ ] Critical path sur Timeline
- [ ] Auto-rescheduling des dépendances
- [ ] Cross-project dependencies
- [ ] Nested portfolios
- [ ] Portfolio timeline
- [ ] Workload avec capacité en heures/points
- [ ] Time tracking (timer intégré + saisie manuelle)
- [ ] Project Messages (discussion threads dans projet)
- [ ] Team Messages et Direct Messages
- [ ] @-mentions dans les commentaires
- [ ] Likes sur les commentaires
- [ ] Multi-action rules (1 trigger → N actions)
- [ ] Conditional logic dans les rules
- [ ] Cross-project rules
- [ ] Script actions (JavaScript custom dans les rules)
- [ ] AI features (résumé, smart status, task creation NLP)
- [ ] Image proofing (annotations visuelles)
- [ ] Saved views / tabs personnalisés par projet
- [ ] Task recurring schedules
- [ ] Merge duplicate tasks
- [ ] Desktop/mobile offline mode
- [ ] Keyboard shortcuts complets (Tab+Q, Tab+A, etc.)
- [ ] Guest access (collaborateurs externes limités)
- [ ] SAML SSO, SCIM provisioning
- [ ] Admin console (gestion users, sécurité, audit log)
- [ ] API REST publique + Webhooks
- [ ] 200+ integrations (Slack, Teams, Jira, Google, etc.)

---

## DATA ARCHITECTURE (Supabase + Zustand)

The app is a fully static Next.js export with all data and mutations going through Supabase directly from the browser (no server actions, no Prisma).

### Supabase
- Project ref: `qrksglxemydjzvpnyzzs`
- Client singleton: `adana/src/lib/supabase.ts`
- Tables (snake_case columns): `users`, `projects`, `sections`, `tasks`
- RLS enabled with permissive "allow all" policies (demo mode)
- Env vars required for runtime:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Zustand Store (`adana/src/store/app-store.ts`)
Central store that is the single source of truth for the UI:
- On `init()`, fetches `users`, `projects`, `sections`, `tasks` from Supabase in parallel
- If `projects` table is empty on first load, auto-seeds with mock data from `adana/src/lib/mock-data.ts`
- If Supabase fails, sets `error` state and shows empty UI (NO mock fallback)
- Mutations (`createProject`, `updateProject`, `deleteProject`, `toggleFavorite`, `createTask`, `updateTask`, `deleteTask`, `toggleTaskComplete`, `createSection`, etc.) optimistically update local state AND persist to Supabase
- Maps snake_case DB columns to camelCase TypeScript types via `dbToProject` / `projectToDb` helpers
- IDs are generated client-side with `crypto.randomUUID()`

### Mock Data (`adana/src/lib/mock-data.ts`)
- Used ONLY for auto-seeding an empty Supabase database on first load
- Not a runtime fallback — if Supabase is unreachable, the UI shows an empty/error state

### Pages
All pages are client components (`"use client"`) that read from and write to the Zustand store. Dynamic project routes (`projects/[id]/...`) are split into thin server wrappers with `generateStaticParams` + client view components to satisfy static export requirements.

---

## DEPLOYMENT (Cloudflare Pages)

- Cloudflare Pages builds and deploys directly from the `main` branch (Production).
- Next.js is configured with `output: "export"` so `npm run build` produces `adana/out/` with static HTML/JS only.
- **To deploy**: just commit and push to `main` (`git add . && git commit -m "..." && git push origin main`).
- The `gh-pages` and `production` branches are NOT used. We use only 1 branch: `main`.
- Cloudflare Pages will automatically trigger a build when you push to `main` (using root directory strategy).

---

## NOTES
- App appelée "Adana" (inspirée d'Asana)
- Stack: Next.js 14 (static export) + TypeScript + Tailwind + Zustand + Supabase
- Tout en un seul dossier `adana/` à la racine du repo
- Build réussi (`cd adana && npm run build` passe, output dans `adana/out/`)
- Le CLAUDE.md est mis à jour au fur et à mesure de l'avancement
- Pour lancer en local: `cd adana && npm install && npm run dev`
- Recherche Asana complète effectuée (22 catégories, 500+ features identifiées)
- Features majeures implémentées, features avancées/enterprise listées ci-dessus pour le futur

---

## DEPLOYMENT
- ALWAYS deploy to production after making changes by pushing to `main`.
- Hosting: Cloudflare Pages (project name: `adana`, domain: `adana-aim.pages.dev`)
- Just commit and push source to GitHub: `git add . && git commit -m "..." && git push origin main`
- Cloudflare Pages will automatically handle the build and deploy. Do not use wrangler CLI manually unless troubleshooting.
- We use ONLY 1 branch (`main`)! Do not create or use other branches like `gh-pages`.
