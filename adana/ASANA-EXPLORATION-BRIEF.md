# Asana Exploration Brief — for the scouting AI

## Why this brief exists

A previous pass at documenting Asana produced a feature list that described **what the AI saw in one instance of the UI**, not **what the feature actually is**. Example of the failure mode:

> "Portfolios show a list of project rows with status + progress + owner. Each row has an icon and name."

That's a description of *this user's portfolio, right now, with this data*. The real feature is:

> "A Portfolio is a modular container that groups projects and/or sub-portfolios. Users can add/remove projects, reorder them, pick which columns to display, post status updates, and switch between List / Timeline / Dashboard / Progress / Workload views. Portfolios can nest under other portfolios. Each Portfolio has its own permissions, brief, and status history."

The second description drives a *real implementation*. The first drives a hard-coded mock. We need the second kind for every feature.

---

## Your job

Explore Asana deeply enough to produce a **capability spec** for each feature, not a screenshot description. For every feature, answer:

1. **What is the underlying entity?** (table + key fields)
2. **What can the user do with it?** (every action: create, edit, delete, reorder, duplicate, share, archive, export, rename, change-icon, change-color, etc.)
3. **What configurations does it support?** (default view, filters saved in this entity, per-entity settings, hidden columns, grouping, etc.)
4. **How does it nest / compose?** (can it contain other entities? be contained? linked to?)
5. **What are the edge states?** (empty, overflow, permission-denied, archived, deleted, template-only, etc.)
6. **What is modular vs fixed?** (which labels/columns/sections are user-configurable vs part of the product?)

---

## Exploration method — do all of these for each feature

### A. Visit the empty state
- Log in as a brand-new user (or delete all your data first).
- What does the feature show when there's nothing in it?
- What creation affordances exist? (buttons, templates, imports, AI create?)
- Screenshot and describe the empty state precisely.

### B. Create the entity in every way possible
- Find every button/menu that creates one of these entities.
- Create one manually from scratch. Note every field you can fill.
- Create one from a template — list all template categories and template names.
- Create one by importing (if supported). List supported import formats.
- Create one via AI (if supported). Note the prompt + what it generates.
- Create one by duplicating an existing entity. Note what gets copied vs reset.

### C. Fill it with many shapes of data
- Create 0, 1, 2, 10, 50 items. Note any count-dependent behavior (pagination, "and 47 more", collapsed sections).
- Mix completed + incomplete + overdue + archived items.
- Try every combination of due date (none / past / today / future / in-progress milestone).
- Add subtasks 3-levels deep.
- Add the same item to multiple parents (multi-homing).
- Delete an item and watch the trash/restore flow.
- Archive an item and see how it appears in lists.

### D. Click every edit affordance
- Every "..." menu → list every option in it.
- Every chevron dropdown → list every option.
- Every settings cog → list every sub-setting.
- Every "Customize" / "Options" / "View options" panel → list every toggle.
- Every column header → is it sortable? resizable? hideable? renamable?
- Every tab on an entity → does it have a "+" to add custom tabs?
- Every badge / chip / label → is it clickable? editable? filterable?

### E. Explore every view mode
- Switch between List / Board / Timeline / Calendar / Gantt / Dashboard / Workload / Files / Messages / Note / Overview / any others.
- For each view, describe: what's modular, what's fixed, how grouping/filtering/sorting work, what drag-drop does, what keyboard shortcuts work.

### F. Test the sharing/permissions model
- Share with a teammate with different roles (owner / admin / editor / commenter / viewer / guest).
- Note which actions each role can take.
- Try public sharing (link sharing).
- Test guest access (external collaborators).

### G. Probe the search / filter / sort model
- Click the filter builder. List every field you can filter on, every operator, every way to combine (AND/OR).
- Click sort. Can you multi-sort? How many levels?
- Type in global search. What entities surface? What pre-built saved searches exist?
- Save a view / filter / search. Note where it persists (per-project? per-user? per-workspace?).

### H. Walk the automation surface
- Open the rules / automation builder.
- List every trigger type.
- List every action type.
- List every condition operator.
- List every pre-built template and note its trigger+actions.
- Does AI generate rules from natural language?

### I. Check AI integration
- Find every sparkle / magic-wand icon in the app.
- For each, click it and describe: prompt input? contextual suggestions? history? embeds in other surfaces?
- Note when AI is proactive (e.g., weekly status auto-generation) vs reactive (user asks).

### J. Account / workspace / org
- Multi-workspace switcher — how does it work?
- Invite flow — what gets sent, what roles are offered?
- Admin console — what can an admin do vs a regular user?
- Out-of-office / vacation mode — where does it show, what does it hide?

---

## Deliverable shape — one spec per feature

For each feature below, produce a markdown block like:

```
## <Feature name>

### Entity model
- Primary table: <name>
- Key fields: <list of columns with types>
- Relations: <foreign keys + join tables>

### Capabilities (what the user can do)
- Create: <every path>
- Read: <every view mode and what's shown>
- Update: <every editable field and how it's triggered>
- Delete: <soft vs hard, restore flow>
- Reorder: <drag-drop? position field?>
- Share / permissions: <role matrix>
- Archive: <yes/no, where archived items appear>
- Duplicate: <what gets copied vs reset>
- Export: <formats>
- Import: <formats>

### Configuration (what's modular)
- Views available: <list>
- Settings per instance: <list every configurable option>
- Fields user can add: <custom fields, rules, forms, etc.>
- Things the user CAN'T change: <hardcoded parts — colors? icons? tab names?>

### Nesting / composition
- Can contain: <what sub-entities>
- Can be contained by: <what parent entities>
- Can be linked to: <other entities via many-to-many>

### Edge states
- Empty state: <what's shown + primary CTA>
- Archived state: <what's shown>
- Permission-denied state: <what's shown>
- Overflow / pagination: <how large lists are handled>

### AI surface
- AI affordances on this feature: <list>

### Keyboard shortcuts
- <list specific to this feature>

### Integration points
- Other features this one references: <list>
- Features that reference this one: <list>
```

---

## Features to deeply explore (in priority order)

1. **Workspace / Organization** — the root container. What can it hold?
2. **Team** — list members, settings, which projects roll up here
3. **Project** — EVERY view, EVERY chevron menu item, EVERY tab, EVERY customize panel. This is the biggest surface.
4. **Portfolio** — especially: is nesting supported? what views? what columns are modular in List view? what does the "Progress" tab look like when there are 0 vs 10 vs 50 projects? What does the AI Portfolio Summary actually generate?
5. **Goal** — hierarchy (parent/sub-goals), metrics, link types (project? portfolio? task? another goal?), status automation, time periods, progress rollup formula
6. **Task** — every field, every tab inside task detail, subtask tree depth, multi-homing, dependencies (types: FS/SS/FF/SF?), recurring (all frequencies + custom), task templates (per-project vs workspace?), task TYPES (custom types?)
7. **Section** — is it a real entity or just grouping? can it have its own WIP limit? color? swimlane?
8. **Custom fields** — all field types (especially formula fields — what expressions?), scopes (project / workspace / library), how they appear in filters and grouping
9. **Rules / Automation** — triggers, actions, conditions, branching, multi-action, templates, gallery
10. **Forms** — field types, conditional logic, public submission, mapping form fields → task fields
11. **My Tasks** — personal sections, personal rules, all 5 view tabs
12. **Home** — widget types, customize flow, private notepad mechanics
13. **Inbox** — notification types (list every trigger), bookmarks, archive, follow-up requests, sort/filter
14. **Reporting / Dashboards** — widget types, config per widget, data sources, scopes (cross-project?)
15. **Search** — full-screen overlay behavior, tabs, pre-built saved searches, advanced filter builder
16. **Messages** — project / team / DM — threading, reactions, file attachments
17. **AI / "Asana Intelligence"** — every prompt surface, every embedded module, smart rule creator, smart status, smart summary
18. **Tags / Labels** — scope, color palette, usage across entities
19. **Templates** (project & task) — gallery categories, preview illustrations, AI generation
20. **Attachments / Files** — aggregation per project, proofing annotations, versioning
21. **Time tracking** — if enabled, timer UI + manual entry + capacity
22. **Workload** — capacity model (hours? points? effort field?), overflow rendering
23. **Timeline / Gantt** — dependencies visualization, critical path, auto-reschedule, baselines
24. **Approvals** — workflow states, approver rotation, decisions + comments
25. **Comments / Activity log** — @mentions, reactions, threading, edit history

---

## Known-buggy features in OUR clone (Adana) — give these extra attention

When you explore Asana, **compare against what Adana's behavior should be** for each of these:

1. **Sub-goals don't create properly.** In Adana, clicking "+ Add sub-goal" on a goal doesn't properly set `parentId`. Need clear Asana spec for: how sub-goals are created, nested display, weight-based rollup, whether a goal can be a sub-goal of multiple parents.

2. **Portfolios were hard-coded as a "list of projects with status columns"**, but Asana portfolios are much more — they have their own views, can nest, have status updates, etc. Need the REAL portfolio model.

3. **Custom fields in Adana are project-scoped only.** Asana supports workspace-scoped ("Field library") fields shared across projects. Confirm + describe.

4. **Task type** in Adana has Task / Milestone / Approval. Asana supports custom task types per project. How are they defined? Do they carry custom fields?

5. **Project templates** in Adana have 6 hard-coded ones. Asana has a full template gallery with categories + user-saved templates + AI-generated. Describe the actual gallery structure.

6. **Recurring tasks** in Adana only daily/weekly/monthly/yearly. Asana supports: periodic (every N days), weekly (specific weekdays), monthly (day N vs Nth weekday), custom. Describe all.

7. **Dependencies** in Adana are only `blocker → blocked`. Asana may support finish-to-start, start-to-start, finish-to-finish, start-to-finish. Confirm.

8. **Multi-homing** in Adana lets a task be in N projects. Asana lets you also specify a section per project. Confirm the mechanics — does updating in one project propagate? Can you remove from one without removing from all?

9. **Rules** in Adana: 1 trigger → N actions. Asana supports conditional branches within a rule. Confirm.

10. **My Tasks** in Adana has 5 tabs (List/Board/Cal/Files/Dash). Asana's is similar. But Asana's sections ("Recently assigned", "Do today", etc.) are auto-populated. How? Are they user-configurable? Can users add personal sections?

11. **Inbox** in Adana: notifications flat list + bookmarks. Asana has: activity, bookmarks, archive, AND "follow-up" requests (someone asking you to follow up). What triggers a follow-up?

12. **Goals progress** in Adana is a manual 0-100 number. Asana goals can be metric-based (auto-progress from linked tasks/projects), or milestone-based, or percent-based. Describe which modes exist.

13. **AI in Adana** has smart summary, smart status, smart rules. Asana's AI is embedded in way more places (project overview, portfolio progress, inbox summaries, task suggestions). List every surface.

14. **Teams** in Adana is basically just a user grouping. Asana teams have their own projects, members with roles, team settings page, team-level goals. Confirm.

15. **Reporting** in Adana is a single page with charts. Asana has a full "Dashboards" feature — named dashboards, cross-project sources, shared, configurable widgets with filters. Describe.

---

## Anti-patterns to avoid in your writeup

❌ "The portfolio page shows X, Y, Z" → describe what the feature *is*, not what you happen to see.
❌ "There are 6 template cards" → describe the template *gallery system* (categories, search, user-saved, AI-generated), which happens to have 6 Asana-provided templates.
❌ "The status dropdown has On Track, At Risk, Off Track" → describe whether statuses are hardcoded or user-configurable, whether new ones can be added.
❌ "Each task row has a checkbox, title, assignee, due date" → describe the *column chooser* that lets users show/hide columns, and the fact that custom fields appear as additional columns.
❌ Listing only buttons you clicked — you need to *try* each button and describe what happens, including empty states and error states.

## Output format

Write your findings to `ASANA-FEATURE-SPEC.md`. Organize by feature, one H2 per feature, following the deliverable template above. Include:

- A "Modular vs fixed" subsection for EVERY feature (the biggest failure mode last time).
- A "Implementation hints" subsection with the likely underlying schema (tables, key columns, join tables, indexes).
- A "Gotchas" subsection with edge cases that would catch out a naive re-implementer.

When you finish, summarize the **top 20 highest-leverage features to reimplement** — the ones where our current clone diverges most from Asana's actual capability model.
