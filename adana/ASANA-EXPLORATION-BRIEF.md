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

---

## You are a web agent — use that

Unlike the previous scouting pass (which worked from static screenshots), you can actually click, type, and observe the result. Use that capability aggressively. A description written without clicking is not accepted.

**Setup before you start:**
1. Sign up for Asana's free 30-day Advanced trial at asana.com. Use a throwaway email.
2. Once inside, create a second user in the same workspace (invite a second throwaway email) — you need this to observe multi-user behavior (assignment, comments, mentions, permissions).
3. Install the Asana browser extension if available — sometimes surfaces different UI paths.

**Operating loop for every feature:**

1. **Navigate** to the feature's primary page.
2. **Screenshot** the empty state before doing anything.
3. **Open every menu** — right-click, chevron dropdowns, "...", gear icons, "Customize", avatar menus. Record the full item list from each.
4. **Click every item** that doesn't delete/destroy. For destructive items, read the label + confirmation and record what it says without confirming.
5. **Create entities of each kind** the feature supports. Fill every field. Try invalid inputs (empty strings, past dates, absurd numbers, very long text). Record validation messages.
6. **Edit a field, refresh the page, confirm persistence.** If it doesn't persist, that's a finding.
7. **Resize / zoom / change viewport** to mobile width. Record responsive changes.
8. **Open the browser devtools Network tab**. Perform one mutation. Screenshot the API call (endpoint, request body, response) — this reveals the underlying data model.
9. **Open devtools DOM inspector** and inspect element IDs/classes — Asana's CSS hints at component names (e.g., `PortfolioList-row` tells you it's a row component of a PortfolioList).
10. **Use the browser URL bar** as a canary — Asana encodes a lot in URLs (e.g., `?a=list&c=1234` reveals view + filter state). Change URL params to discover view modes.
11. **Repeat in two-user mode.** Have user A assign something to user B, then switch accounts to see what B sees in their Inbox / My Tasks / notification counter.
12. **Use the keyboard only** for a full minute in each view — record every shortcut that does something.

**Things that are ONLY visible when you click:**
- Column chooser (hidden behind "Options" or right-click column header)
- Per-project saved views (stored as tabs, but you need to create one to find the "+" that creates it)
- Rule condition branches (you have to add a rule to see the "Add condition" affordance)
- Form field conditional logic (hidden inside per-field settings dialog)
- Recurring task cadence editor (opens only when you click "Set recurrence" inside task detail)
- Multi-homing section selector (only appears when you add a task to a 2nd project)
- Goal metric types (only visible when creating a goal — the type selector disappears after save)
- Portfolio-level settings (behind the chevron ≡ of the portfolio header)

If you describe a feature without having clicked these, you don't know what you're describing.

**Confirmation questions to record for every feature (answer yes/no with evidence):**
- Can the user rename it? Where?
- Can the user change its icon/color? Where?
- Can the user reorder multiple of these? By drag? By keyboard?
- Can the user archive it? Does it disappear from the main list? How do you un-archive?
- Can the user duplicate it? What copies, what resets?
- Can the user delete it? Is it hard-delete or soft-delete (trash)? How long is trash kept?
- Can the user export it? What formats? What does the CSV header row look like?
- Can the user import it? What format? Does it map to fields or just raw text?
- Can the user share it via public link? What scopes (view-only / comment / edit)?
- Can the user create a template from it? Where does the template live?
- Can AI generate one of these? What's the prompt scaffold Asana shows?

---

## Use-case catalog — scenarios to actually set up in Asana

Each scenario stresses a different combination of features. For **every** scenario: set it up end-to-end in Asana, then describe what features you had to configure, what surprised you, and what was modular vs fixed.

Do not skip scenarios. Each one reveals different behavior. When a scenario overlaps with another, note the overlap — but still set it up and click through it.

---

### UC-01 — Marketing campaign launch
**Persona:** Marketing manager launching a product.
**Goal:** Plan a 6-week campaign across 4 channels (email, social, paid, PR).
**Setup:**
1. Create a project named "Q2 Product Launch" from the Marketing template.
2. List every section the template seeded — are they user-editable or template-locked?
3. Add 30 tasks spanning the 6 weeks. Assign a due date to each.
4. Create a custom field "Channel" (single-select: Email / Social / Paid / PR).
5. Group List view by Channel. Switch to Timeline and record how grouping translates.
6. Create a rule: "When a task tagged #creative is completed, assign to the copywriter for review."
7. Post a status update: "At risk" with a note.
8. Create a Form for "Creative request intake" that auto-files new submissions into the "Backlog" section.
**What to record:** template gallery structure, form→task field mapping, how custom fields appear as columns, rule-trigger UI, status update history.

---

### UC-02 — Engineering sprint
**Persona:** Tech lead running a 2-week sprint.
**Goal:** Break epics into tickets, track velocity.
**Setup:**
1. Create project "Sprint 42", Kanban view, sections: Backlog / Todo / In Progress / Review / Done.
2. Add 3 epics as milestones. Add 15 tasks, each linked to an epic (how? subtask? reference?).
3. Custom fields: "Story Points" (number), "Component" (single-select: Backend / Frontend / Infra).
4. Timeline view — drag a task's bar to resize. Record what happens to sub-task dates.
5. Dependency: Task B is blocked by Task A. Complete A and observe what happens to B (notification? auto-unblock? visual change?).
6. Workload view — set weekly capacity per user to 40h. Assign tasks summing to 60h and observe the overflow visualization.
**What to record:** dependency types offered, milestone vs task distinction, Story Points rollup math (do parent/epic totals auto-compute?).

---

### UC-03 — Hiring pipeline
**Persona:** Recruiter running 3 open roles.
**Goal:** Track candidates through stages.
**Setup:**
1. Create project "Engineering Hiring — Senior Backend" from the Hiring template.
2. Sections are likely stages (Applied / Screen / Interview / Offer / Rejected). Note the exact names.
3. Add 25 candidates as tasks. Use Board view.
4. Custom fields: "Source" (single-select), "Resume" (attachment), "Rating" (number), "Interviewer" (people).
5. Move a candidate from Screen to Interview. Does Asana prompt any automation or template?
6. Create a rule: "When candidate reaches Offer stage, create subtasks: draft letter / get salary approval / send." Record how multi-action is configured.
7. Add a note (the per-project rich-text document) summarizing hiring criteria.
**What to record:** how stages (sections) are treated as pipeline columns vs normal sections, template-vs-user-configurable stage names.

---

### UC-04 — Content calendar (editorial)
**Persona:** Content lead running a blog.
**Goal:** Plan 30 articles across Q2, track draft → review → publish.
**Setup:**
1. Create project "Blog Q2 2026" using Calendar as the default view.
2. Custom fields: "Author" (people), "Word count" (number), "Publish date" (date — may overlap with due_date — which takes precedence in Calendar view?).
3. Recurring task: "Weekly editorial sync" every Monday. Record the recurrence editor UI (every N days? specific weekdays? monthly-Nth-weekday?).
4. Drag an article in Calendar view to a new date. Does the due date update? Does the publish_date custom field update? (reveals whether Calendar binds to due_date only or any date field).
5. Filter by Author to create a per-writer view. Save it. Rename the saved view. Share the saved view with a teammate — does it appear for them?
**What to record:** recurrence options, Calendar binding logic, saved-view sharing scope (private / project-wide / per-user).

---

### UC-05 — Product roadmap (PM)
**Persona:** Product manager with 5 engineering teams' features.
**Goal:** Quarterly roadmap across teams.
**Setup:**
1. Create portfolio "2026 Roadmap". Add 8 projects (one per team).
2. For each project, set a status (on_track / at_risk / off_track) and due date.
3. Open Portfolio → Timeline tab. Drag a project bar. Does it reschedule the project's due date? Its underlying tasks?
4. Portfolio → Progress tab. Screenshot the status summary cards. Click "Generate portfolio summary" — record the AI prompt shape and output.
5. Create a sub-portfolio "Engineering only" that contains 5 of the 8 projects. Does Asana support nested portfolios? Record findings.
6. Link a Goal ("Ship 10 features in Q2") to this portfolio. Observe progress rollup. Complete tasks in underlying projects and watch goal progress recompute (if it does).
**What to record:** portfolio vs project vs goal hierarchy, whether portfolio drag-reschedule cascades to tasks, nested portfolio UI.

---

### UC-06 — OKR planning
**Persona:** Exec running company OKRs.
**Goal:** Set 3 company objectives, each with 3 key results, link to team objectives.
**Setup:**
1. Goals page → "+ New goal". Record every field on the creation form (metric type, target, current, weight, time period options, owner, parent).
2. Create parent "2026 Company Goals", children "Q1 / Q2 / Q3 / Q4 Objectives", sub-children for team goals. Go 4 levels deep. Note any depth limit.
3. Metric types — create one percentage goal, one numeric goal, one milestone goal. Screenshot each creation dialog.
4. Link a child goal to a project. Complete tasks in the project and watch the parent goal progress update (does it? how is weighting applied?).
5. Set a goal to "off track". Does Asana notify the owner automatically? Check Inbox as a different user.
6. Tabs: "My goals" vs "Team goals" — what's the filter logic? Does "Team" mean "my team's" or "all teams I belong to"?
**What to record:** every metric type, progress rollup math, goal nesting depth, notification triggers, team-goals filter logic.

---

### UC-07 — Creative agency client delivery
**Persona:** Agency PM with 5 active client projects.
**Goal:** Proof rounds on deliverables, client sign-off.
**Setup:**
1. Create 5 projects (one per client). Upload a mockup to one task.
2. On the attachment, try proofing (annotations). Record whether Asana supports image/PDF annotations, how reviewer markup works, how comments thread.
3. Use the Approvals task type: convert a task to an approval, add 2 approvers. Click Approve / Request changes / Reject as each approver.
4. Create a shared "Client portal" — can external guests comment without seeing other clients? (Record guest role limitations precisely.)
5. Switch a project's visibility: public / team / private. Record what each role can see.
**What to record:** proofing feature capabilities, approval workflow (sequential vs parallel? who's notified?), guest role scope.

---

### UC-08 — Bug triage / incident response
**Persona:** Engineering manager handling support bugs.
**Goal:** Route incoming bugs to the right engineer automatically.
**Setup:**
1. Create a Form "Report a bug" with fields: Severity (single-select), Steps (paragraph), Screenshot (attachment), Component (single-select).
2. Submit the form as an anonymous user (log out or incognito). Confirm task is created. Observe what the form → task field mapping does.
3. Add a rule: "When a task is created with Severity=Critical, assign to on-call, set priority=High, add to #oncall project (multi-homing)." Test the rule end-to-end.
4. Add rule conditional logic if supported: "If Component=Backend, assign to team-backend; if Frontend, assign team-frontend." Describe the UI for branching.
5. Completion: mark a bug as duplicate. Does Asana have a "Merge tasks" feature? Where is it?
**What to record:** form anonymous submission flow, rule multi-action + conditional logic UI, merge-tasks capability (likely no, but confirm).

---

### UC-09 — Personal productivity / GTD
**Persona:** Individual user using only My Tasks.
**Goal:** Run a personal GTD system entirely in My Tasks.
**Setup:**
1. Go to My Tasks. Rename "Recently assigned" / "Do today" / "Do next week" / "Do later" if possible. Record what's renamable.
2. Add a new personal section "Waiting on". Are personal sections possible? Where's the affordance?
3. Assign a task to yourself with no project. Does My Tasks show "no project" assignments?
4. Create a personal rule: "When I mark a task complete, move it to 'Done' section." Can personal rules exist? Where's the UI?
5. Install a weekly recurring task "Plan my week". Test it firing for 3 weeks.
**What to record:** personal-section support, personal-rule support, no-project task behavior.

---

### UC-10 — Customer Success onboarding
**Persona:** CSM onboarding new customers with a standard 30-day playbook.
**Goal:** Use templates so every new customer gets the same steps.
**Setup:**
1. Create a project template "Customer Onboarding" with 4 sections and 15 tasks with relative due dates (e.g., "Day 1: kickoff call", "Day 7: training session").
2. Save as template. Record where the template lives — workspace? team? personal?
3. Create 3 real customer projects from the template. Record whether relative dates recalculate from each project's start date (that's the magic of templates). Do custom fields / rules / members carry over?
4. Update the template — do existing projects inherit the update? (Probably no — confirm.)
**What to record:** template mechanics, relative date math, inheritance semantics.

---

### UC-11 — Budget tracking / finance
**Persona:** Finance analyst tracking spend across departments.
**Goal:** Use Asana's Reporting to build dashboards.
**Setup:**
1. Create 3 projects (marketing / product / sales) with custom field "Amount" (number).
2. Reporting → "+ Create dashboard". Name it "2026 Spend". Add widgets: "Total amount by project" (bar), "Spend over time" (line), "Top 5 biggest tasks" (list).
3. Each widget has a config. Screenshot every option in the widget config dialog (data source, aggregation, filter, chart type, colors).
4. Can a widget pull from multiple projects? How do you select sources?
5. Share the dashboard with a colleague. Do they see live data or a snapshot? What role is required to see it?
**What to record:** widget types list, cross-project data source, sharing scope.

---

### UC-12 — Remote-first meeting notes
**Persona:** Team lead running weekly all-hands.
**Goal:** Use the Note tab per project for meeting notes.
**Setup:**
1. Open a project → Note tab.
2. Type a heading, bullets, a checkbox list. Record which markdown-like syntax works.
3. @mention a teammate in a note. Do they get notified?
4. Link a task in a note. Does it render as a live link with current status?
5. Create multiple notes per project? Or is it one note per project (like a single doc)? Confirm.
6. Export the note — PDF? Markdown? Copy link?
**What to record:** Note editor feature matrix, whether multiple notes are supported per project.

---

### UC-13 — Event planning
**Persona:** Event coordinator planning a 500-person conference.
**Goal:** Coordinate 6 vendors, 40 sessions, 10 sponsors across 6 months.
**Setup:**
1. Create project "Conference 2026" from event template. List template sections + template tasks.
2. Multi-home 5 tasks into a "Vendor coordination" sub-project. Each task keeps its primary project but also appears in the sub-project. Test that completing from one surface marks it complete everywhere.
3. Create a shared portfolio with 3 sub-projects (logistics, content, marketing). Cross-project dependencies (session speaker confirmation blocks marketing announcement).
4. Use Gantt view specifically (if distinct from Timeline) — does it show critical path, slack, baselines?
**What to record:** multi-homing semantics (does delete-from-one delete-from-all or just unlink?), Gantt-vs-Timeline distinction, cross-project dependency support.

---

### UC-14 — IT / employee onboarding
**Persona:** People ops onboarding 5 new hires at once.
**Goal:** Standard 2-week onboarding per hire, parallel execution.
**Setup:**
1. Template: "New Hire Onboarding" with tasks "Order laptop", "Grant Slack access", "Book welcome lunch", etc.
2. Create 5 projects from this template in one batch. Is there a bulk-create flow? Or strictly one at a time?
3. For each new hire, use task templates (not project templates) — e.g., add a "Set up Okta" task template into an existing IT Queue project, filling in the hire's name.
4. Record the difference between project templates and task templates. How do you define a task template?
**What to record:** bulk-create flows, task-template vs project-template distinction.

---

### UC-15 — Cross-functional launch with external stakeholders
**Persona:** PM with engineering, marketing, legal, and external PR agency.
**Goal:** Coordinate across teams with different permission levels.
**Setup:**
1. Create project "Launch X", invite internal users as editors, external PR contacts as guests.
2. Create a task assigned to an external guest. What can they see? Just the task? Full project? Record precisely.
3. Add a private section only internal users can see. Does Asana support task-level or section-level visibility? Or only project-level?
4. Convert a project to public (anyone with link). What URL structure does a public project use?
**What to record:** permission granularity, guest scope, public-share URL structure.

---

### UC-16 — Sales pipeline (CRM-lite)
**Persona:** Sales ops using Asana as a lightweight CRM.
**Goal:** Track 50 deals through 5 stages with forecasted revenue.
**Setup:**
1. Create project "2026 Pipeline" with sections as stages (Lead / Qualified / Proposal / Negotiation / Closed-Won / Closed-Lost).
2. Custom fields: "Deal size" (number, $), "Probability" (number %, 0-100), "Close date" (date), "Account" (text).
3. Build a formula custom field: "Weighted value" = Deal size × Probability. Does Asana support formula fields? What syntax?
4. Report: "Total weighted pipeline by stage" bar chart. Configure it and note every step.
5. Forecast: can you see aggregate projected revenue? Is there a "Sum" roll-up on custom fields?
**What to record:** formula field support + syntax, number-field roll-ups (sum/avg/max/min), aggregate visualizations.

---

### UC-17 — Recurring ops / standups
**Persona:** Team lead running daily standups and weekly retros.
**Goal:** Automate recurring meetings with task lists that reset weekly.
**Setup:**
1. Task "Daily standup — $DATE" recurring every weekday. Does Asana let the title template in a date? Record the placeholder syntax if any.
2. Subtasks under each standup: "Blockers from yesterday", "Today's plan". When the parent recurs, do subtasks recur too? Do they reset to incomplete or duplicate?
3. Retro: a task template with 4 subtasks (What went well / What didn't / Action items / Owners). Apply the template weekly.
**What to record:** recurrence of parent task with subtasks — does it duplicate whole tree or just parent?

---

### UC-18 — Workflow with approvals + handoffs
**Persona:** Editorial team with draft → editor → legal → publish workflow.
**Goal:** Gate progress through explicit approvals.
**Setup:**
1. Create 10 approval-type tasks. Each has 2 approvers (editor, legal). Approvers must be sequential (legal can't approve until editor does). Does Asana support sequential vs parallel?
2. Record the exact button labels and decisions offered: Approve / Request changes / Reject / any 4th option?
3. When someone requests changes, what happens? Does the task stay with them or bounce back to the author?
4. Record the approval history panel — is there a visible audit trail?
**What to record:** approval workflow sequential/parallel support, exact decision vocabulary, audit trail.

---

### UC-19 — Workload planning with capacity
**Persona:** Engineering manager balancing 6 engineers across 20 tasks.
**Goal:** Prevent over-allocation.
**Setup:**
1. Set weekly capacity hours per user (find where: user profile? workspace admin?).
2. Assign tasks with "Effort" (does Asana have a first-class Effort field or is it a custom field?). Total over-capacity.
3. Workload view — screenshot the overflow visualization. Does it color-code? Warn? Block assignment?
4. Drag a task from over-allocated user to under-allocated in Workload view. Record what changes (assignee only? date? effort stays?).
**What to record:** capacity field source, Effort field first-class vs custom, Workload drag-reassign semantics.

---

### UC-20 — Time tracking
**Persona:** Agency PM billing clients by time spent per task.
**Goal:** Track actual hours per task, export for invoicing.
**Setup:**
1. On a task, start a timer. Pause / resume / stop. Record button labels and behavior.
2. Manually add a 2-hour entry for a past date. Record the manual-entry UI.
3. View aggregate time for a project. Where is it shown?
4. Export: CSV? PDF? Does the export respect filters (e.g., only billable tasks)?
**What to record:** time tracking UI, manual entry mechanics, export formats & filters.

---

### UC-21 — Multi-workspace / multi-org user
**Persona:** Consultant in 3 different client workspaces.
**Goal:** Switch between workspaces, see only the active one's data.
**Setup:**
1. Create or join a second workspace. Switch between them via account switcher.
2. Does My Tasks aggregate across workspaces or only show current-workspace tasks?
3. Does Inbox aggregate notifications across workspaces?
4. Can you move a project from one workspace to another?
**What to record:** workspace data scoping, cross-workspace aggregations, project-transfer capability.

---

### UC-22 — Admin / compliance
**Persona:** Workspace admin enforcing policy.
**Goal:** Audit user activity, enforce password policy, export workspace data.
**Setup:**
1. Open Admin Console. List every section/tab.
2. Find audit log. What events are logged? Can you filter by user / date / event type?
3. SSO / SAML settings. SCIM provisioning. Record what's there (even if your plan doesn't include it, the settings pages usually appear disabled).
4. Data export — can you export the entire workspace as a backup? Format?
5. User deletion flow. What happens to tasks/projects owned by a deleted user?
**What to record:** full admin-console inventory, audit log fields, data-export options, user-deletion downstream behavior.

---

### UC-23 — AI-first power user
**Persona:** Power user who relies heavily on Asana Intelligence.
**Goal:** Use AI at every surface where it exists.
**Setup:**
1. Find every sparkle/magic-wand icon in the app. Map the 10+ surfaces (project creation, status update, summary, rule creator, task suggestions, inbox digest, search, etc.).
2. Click each and record:
   - What context does it have? (current project only? whole workspace?)
   - What prompts does it suggest?
   - Does it have chat history / memory?
   - Does it stream or return all at once?
3. Try asking AI to do something destructive ("Delete all overdue tasks"). Record guardrails.
4. AI-generate a whole project from a prompt — record the prompt + what gets generated (sections / tasks / custom fields / rules).
**What to record:** full AI-surface map, guardrails behavior, project-generation-from-prompt output structure.

---

### UC-24 — Integration-heavy workflow
**Persona:** Team using Asana + Slack + Google Drive + GitHub together.
**Goal:** Explore app integrations (listed under "Apps" in Customize panel).
**Setup:**
1. Open Customize → Apps. List every available integration.
2. For 3 popular ones (Slack, Google Drive, GitHub), add them. Record what new UI appears inside Asana as a result (new field type? new task source? bot comments?).
3. Disconnect an integration. Does old data remain or disappear?
**What to record:** full apps directory, integration-induced UI surfaces.

---

### UC-25 — Legacy / data migration
**Persona:** Team migrating from Trello / Jira / Monday.
**Goal:** Import existing data.
**Setup:**
1. Find the import flow. Which sources are supported?
2. For CSV import: upload a sample. Record the column mapper UI — how are columns matched to fields? Can you create new custom fields during import?
3. For a Trello import: what's preserved (cards / checklists / members / labels / attachments)?
**What to record:** full import source list, mapping UI, Trello-equivalent field retention.

---

## Master verification matrix

After each use case, fill in this matrix (yes/no/limited) for the features touched:

| Capability | Supported? | Evidence |
|---|---|---|
| Rename | | |
| Duplicate | | |
| Archive | | |
| Delete (soft) | | |
| Delete (hard) | | |
| Restore from trash | | |
| Reorder via drag | | |
| Reorder via keyboard | | |
| Share public link | | |
| Share with role scope | | |
| Export (CSV) | | |
| Export (PDF) | | |
| Import | | |
| Template creation | | |
| AI generation | | |
| Multi-select bulk action | | |
| Nesting (parent/child) | | |
| Cross-entity link (e.g., goal↔project) | | |
| Custom fields attach | | |
| Rules attach | | |
| Saved views attach | | |

Once all 25 use cases are done, you'll have clicked through the major surfaces of Asana under realistic loads and configurations. The resulting `ASANA-FEATURE-SPEC.md` should be derived from *actual clicks*, not screenshots.

---

## Final output requirements

1. **`ASANA-FEATURE-SPEC.md`** — the per-feature capability spec (required).
2. **`ASANA-USE-CASE-FINDINGS.md`** — per use-case log: what you set up, what worked, what surprised you, what you couldn't configure.
3. **`ASANA-VERIFICATION-MATRIX.csv`** — the yes/no/limited matrix filled in for the top 20 entities.
4. **`ASANA-TOP-20-GAPS.md`** — ordered list of the 20 largest divergences between Asana's real feature model and a naive implementation (like Adana's). For each: feature, Asana's actual model, naive model, impact of the gap, suggested fix direction.

If you cannot complete a use case (gated behind a paid tier, hits a bug in Asana, requires more than 2 users), write "SKIPPED: <reason>" and move on. Partial is better than hallucinated.
