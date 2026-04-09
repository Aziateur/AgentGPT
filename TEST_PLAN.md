# Adana Feature Testing Plan

We will systematically test the entire application function by function directly via the browser visually. 

## Phase 1: Authentication & Core Navigation
- [x] Render the homepage and redirect logic (`/` -> `/home`)
- [x] Collapse/Expand sidebar navigation.
- [x] Navigate to `/my-tasks` and check tabs.
- [x] Theme toggle (Dark Mode / Light Mode).
- [x] Check inbox and notifications UI.

## Phase 2: Project Management & Routing
This evaluates our recent query parameter (`/project/.../?id=xyz`) routing refactor.
- [x] Create a new project dynamically from the sidebar or `/projects` directory.
- [x] Verify that clicking the project redirects correctly to `/project/list?id=...`
- [x] Navigate through the Project Views: List -> Board -> Timeline -> Calendar -> Overview.
- [x] Check Breadcrumb paths up top.
- [x] Go back to `/projects` grid to view thumbnail.

## Phase 3: Task Interactions
- [x] Within Project List View: Create a New Task.
- [x] Inline edit the task name.
- [x] Click the task to open the side panel detail view.
- [x] Verify Fields map correctly: Due Date, Assignee, Priority, Status.
- [x] Board View: Drag and drop a task across status columns.

## Phase 4: Portfolios, Goals & Search
- [x] Verify `/portfolios` view correctly renders.
- [x] Verify `/goals` OKR tree.
- [x] Global Search: type the name of the newly created task/project and verify search results populate and links resolve properly.

---
**Status**: Executing test passes...
