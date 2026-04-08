// Central mock data for static export (replaces Prisma/server actions)

export const mockUser = {
  id: "demo-user",
  name: "Demo User",
  email: "demo@adana.dev",
  avatar: null,
};

export const mockProjects = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX",
    color: "#6366f1",
    icon: "globe",
    status: "on_track" as const,
    archived: false,
    favorite: true,
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-04-05T14:30:00Z",
    ownerId: "demo-user",
    owner: { id: "demo-user", name: "Demo User", avatar: null },
    _count: { tasks: 8, members: 3 },
  },
  {
    id: "proj-2",
    name: "Mobile App v2",
    description: "Second major version of the mobile application",
    color: "#10b981",
    icon: "smartphone",
    status: "at_risk" as const,
    archived: false,
    favorite: false,
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-04-04T11:20:00Z",
    ownerId: "user-2",
    owner: { id: "user-2", name: "Sarah Chen", avatar: null },
    _count: { tasks: 12, members: 5 },
  },
  {
    id: "proj-3",
    name: "Q1 Marketing Campaign",
    description: "Marketing campaign for Q1 product launch",
    color: "#f59e0b",
    icon: "megaphone",
    status: "complete" as const,
    archived: false,
    favorite: true,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-03-31T16:00:00Z",
    ownerId: "user-3",
    owner: { id: "user-3", name: "Alex Rivera", avatar: null },
    _count: { tasks: 6, members: 4 },
  },
];

export const mockSections: Record<string, Array<{ id: string; name: string; position: number; projectId: string }>> = {
  "proj-1": [
    { id: "sec-1", name: "To Do", position: 0, projectId: "proj-1" },
    { id: "sec-2", name: "In Progress", position: 1, projectId: "proj-1" },
    { id: "sec-3", name: "Review", position: 2, projectId: "proj-1" },
    { id: "sec-4", name: "Done", position: 3, projectId: "proj-1" },
  ],
  "proj-2": [
    { id: "sec-5", name: "Backlog", position: 0, projectId: "proj-2" },
    { id: "sec-6", name: "Sprint", position: 1, projectId: "proj-2" },
    { id: "sec-7", name: "In Progress", position: 2, projectId: "proj-2" },
    { id: "sec-8", name: "Done", position: 3, projectId: "proj-2" },
  ],
  "proj-3": [
    { id: "sec-9", name: "Planning", position: 0, projectId: "proj-3" },
    { id: "sec-10", name: "Execution", position: 1, projectId: "proj-3" },
    { id: "sec-11", name: "Completed", position: 2, projectId: "proj-3" },
  ],
};

export const mockTasks = [
  {
    id: "task-1",
    title: "Design homepage wireframes",
    description: "Create wireframes for the new homepage layout",
    completed: false,
    priority: "high",
    dueDate: "2026-04-09T00:00:00Z",
    projectId: "proj-1",
    sectionId: "sec-2",
    assigneeId: "demo-user",
    assignee: { id: "demo-user", name: "Demo User", avatar: null },
    tags: [{ id: "tag-1", name: "design", color: "#8b5cf6" }],
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-05T14:30:00Z",
    _count: { subtasks: 3, comments: 2 },
  },
  {
    id: "task-2",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated deployments",
    completed: false,
    priority: "medium",
    dueDate: "2026-04-10T00:00:00Z",
    projectId: "proj-1",
    sectionId: "sec-1",
    assigneeId: "demo-user",
    assignee: { id: "demo-user", name: "Demo User", avatar: null },
    tags: [{ id: "tag-2", name: "devops", color: "#06b6d4" }],
    createdAt: "2026-04-02T09:00:00Z",
    updatedAt: "2026-04-06T11:00:00Z",
    _count: { subtasks: 2, comments: 1 },
  },
  {
    id: "task-3",
    title: "Review pull requests",
    description: "Review and merge pending PRs for the sprint",
    completed: false,
    priority: "medium",
    dueDate: "2026-04-11T00:00:00Z",
    projectId: "proj-1",
    sectionId: "sec-1",
    assigneeId: "user-2",
    assignee: { id: "user-2", name: "Sarah Chen", avatar: null },
    tags: [],
    createdAt: "2026-04-03T08:00:00Z",
    updatedAt: "2026-04-06T10:00:00Z",
    _count: { subtasks: 0, comments: 3 },
  },
  {
    id: "task-4",
    title: "Write API documentation",
    description: "Document all REST API endpoints",
    completed: false,
    priority: "low",
    dueDate: "2026-04-15T00:00:00Z",
    projectId: "proj-1",
    sectionId: "sec-1",
    assigneeId: "demo-user",
    assignee: { id: "demo-user", name: "Demo User", avatar: null },
    tags: [{ id: "tag-3", name: "docs", color: "#f97316" }],
    createdAt: "2026-04-04T11:00:00Z",
    updatedAt: "2026-04-06T15:00:00Z",
    _count: { subtasks: 5, comments: 0 },
  },
  {
    id: "task-5",
    title: "Implement user authentication",
    description: "Add OAuth2 login with Google and GitHub",
    completed: true,
    priority: "high",
    dueDate: "2026-04-05T00:00:00Z",
    projectId: "proj-1",
    sectionId: "sec-4",
    assigneeId: "demo-user",
    assignee: { id: "demo-user", name: "Demo User", avatar: null },
    tags: [{ id: "tag-4", name: "backend", color: "#ec4899" }],
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-04-05T16:00:00Z",
    _count: { subtasks: 4, comments: 5 },
  },
  {
    id: "task-6",
    title: "Design mobile navigation",
    description: "Create responsive navigation for mobile views",
    completed: false,
    priority: "high",
    dueDate: "2026-04-12T00:00:00Z",
    projectId: "proj-2",
    sectionId: "sec-7",
    assigneeId: "user-2",
    assignee: { id: "user-2", name: "Sarah Chen", avatar: null },
    tags: [{ id: "tag-1", name: "design", color: "#8b5cf6" }],
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-06T09:00:00Z",
    _count: { subtasks: 2, comments: 1 },
  },
  {
    id: "task-7",
    title: "Push notification system",
    description: "Implement push notifications for mobile",
    completed: false,
    priority: "medium",
    dueDate: "2026-04-18T00:00:00Z",
    projectId: "proj-2",
    sectionId: "sec-6",
    assigneeId: "user-3",
    assignee: { id: "user-3", name: "Alex Rivera", avatar: null },
    tags: [],
    createdAt: "2026-04-02T14:00:00Z",
    updatedAt: "2026-04-06T10:00:00Z",
    _count: { subtasks: 3, comments: 0 },
  },
  {
    id: "task-8",
    title: "Social media content calendar",
    description: "Plan social media posts for Q2",
    completed: true,
    priority: "medium",
    dueDate: "2026-03-28T00:00:00Z",
    projectId: "proj-3",
    sectionId: "sec-11",
    assigneeId: "user-3",
    assignee: { id: "user-3", name: "Alex Rivera", avatar: null },
    tags: [{ id: "tag-5", name: "marketing", color: "#14b8a6" }],
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-28T15:00:00Z",
    _count: { subtasks: 6, comments: 4 },
  },
  {
    id: "task-9",
    title: "Launch email campaign",
    description: "Send launch announcement to subscriber list",
    completed: true,
    priority: "high",
    dueDate: "2026-03-25T00:00:00Z",
    projectId: "proj-3",
    sectionId: "sec-11",
    assigneeId: "demo-user",
    assignee: { id: "demo-user", name: "Demo User", avatar: null },
    tags: [{ id: "tag-5", name: "marketing", color: "#14b8a6" }],
    createdAt: "2026-03-10T09:00:00Z",
    updatedAt: "2026-03-25T11:00:00Z",
    _count: { subtasks: 3, comments: 2 },
  },
];

export const mockNotifications = [
  {
    id: "notif-1",
    type: "assigned",
    title: "New task assigned",
    message: "Sarah assigned you \"Design homepage wireframes\"",
    read: false,
    archived: false,
    linkUrl: "/projects/proj-1/list",
    createdAt: "2026-04-08T12:00:00Z",
  },
  {
    id: "notif-2",
    type: "commented",
    title: "New comment",
    message: "Alex commented on \"Set up CI/CD pipeline\"",
    read: false,
    archived: false,
    linkUrl: "/projects/proj-1/list",
    createdAt: "2026-04-08T10:30:00Z",
  },
  {
    id: "notif-3",
    type: "completed",
    title: "Task completed",
    message: "Jordan completed \"Implement user authentication\"",
    read: true,
    archived: false,
    linkUrl: "/projects/proj-1/list",
    createdAt: "2026-04-07T16:00:00Z",
  },
  {
    id: "notif-4",
    type: "mentioned",
    title: "You were mentioned",
    message: "Taylor mentioned you in \"API Integration\" comments",
    read: false,
    archived: false,
    linkUrl: "/projects/proj-2/list",
    createdAt: "2026-04-07T14:00:00Z",
  },
  {
    id: "notif-5",
    type: "due_date_approaching",
    title: "Due date approaching",
    message: "\"Design homepage wireframes\" is due tomorrow",
    read: true,
    archived: false,
    linkUrl: "/projects/proj-1/list",
    createdAt: "2026-04-07T09:00:00Z",
  },
];

export const mockTeams = [
  {
    id: "team-1",
    name: "Engineering",
    description: "Product engineering team",
    _count: { members: 5, projects: 2 },
    members: [
      { id: "mem-1", userId: "demo-user", role: "admin", user: { id: "demo-user", name: "Demo User", avatar: null } },
      { id: "mem-2", userId: "user-2", role: "member", user: { id: "user-2", name: "Sarah Chen", avatar: null } },
      { id: "mem-3", userId: "user-4", role: "member", user: { id: "user-4", name: "Jordan Park", avatar: null } },
    ],
  },
  {
    id: "team-2",
    name: "Design",
    description: "UX/UI design team",
    _count: { members: 3, projects: 1 },
    members: [
      { id: "mem-4", userId: "user-2", role: "admin", user: { id: "user-2", name: "Sarah Chen", avatar: null } },
      { id: "mem-5", userId: "user-5", role: "member", user: { id: "user-5", name: "Taylor Kim", avatar: null } },
    ],
  },
  {
    id: "team-3",
    name: "Marketing",
    description: "Growth and marketing team",
    _count: { members: 4, projects: 1 },
    members: [
      { id: "mem-6", userId: "user-3", role: "admin", user: { id: "user-3", name: "Alex Rivera", avatar: null } },
    ],
  },
];

export const mockGoals = [
  {
    id: "goal-1",
    name: "Increase user engagement by 40%",
    description: "Boost DAU/MAU ratio through improved UX",
    status: "on_track",
    progress: 65,
    period: "Q2 2026",
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-06-30T00:00:00Z",
    ownerId: "demo-user",
    owner: { id: "demo-user", name: "Demo User", avatar: null },
    parentId: null,
    subGoals: [
      {
        id: "goal-1a",
        name: "Redesign onboarding flow",
        description: null,
        status: "on_track",
        progress: 80,
        period: "Q2 2026",
        startDate: null,
        endDate: null,
        ownerId: "user-2",
        owner: { id: "user-2", name: "Sarah Chen", avatar: null },
        parentId: "goal-1",
        _count: { projects: 1, subGoals: 0 },
      },
    ],
    _count: { projects: 2, subGoals: 1 },
  },
  {
    id: "goal-2",
    name: "Launch mobile app v2",
    description: "Ship major update with new features",
    status: "at_risk",
    progress: 35,
    period: "Q2 2026",
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-06-30T00:00:00Z",
    ownerId: "user-2",
    owner: { id: "user-2", name: "Sarah Chen", avatar: null },
    parentId: null,
    subGoals: [],
    _count: { projects: 1, subGoals: 0 },
  },
  {
    id: "goal-3",
    name: "Improve infrastructure reliability",
    description: "Achieve 99.9% uptime SLA",
    status: "on_track",
    progress: 90,
    period: "Q1 2026",
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-03-31T00:00:00Z",
    ownerId: "demo-user",
    owner: { id: "demo-user", name: "Demo User", avatar: null },
    parentId: null,
    subGoals: [],
    _count: { projects: 1, subGoals: 0 },
  },
];

export const mockPortfolios = [
  {
    id: "portfolio-1",
    name: "Product Development",
    description: "All product-related projects",
    color: "#6366f1",
    projects: mockProjects.slice(0, 2).map((p) => ({
      id: `pp-${p.id}`,
      projectId: p.id,
      project: p,
    })),
    _count: { projects: 2 },
  },
  {
    id: "portfolio-2",
    name: "Marketing Initiatives",
    description: "Marketing and growth projects",
    color: "#f59e0b",
    projects: mockProjects.slice(2).map((p) => ({
      id: `pp-${p.id}`,
      projectId: p.id,
      project: p,
    })),
    _count: { projects: 1 },
  },
];

// Helpers for pages
export function getProjectById(id: string) {
  return mockProjects.find((p) => p.id === id) || null;
}

export function getTasksForProject(projectId: string) {
  return mockTasks.filter((t) => t.projectId === projectId);
}

export function getSectionsForProject(projectId: string) {
  return mockSections[projectId] || [];
}

export function getMyTasks() {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const userTasks = mockTasks.filter((t) => t.assigneeId === "demo-user" && !t.completed);

  return {
    today: userTasks.filter((t) => t.dueDate && new Date(t.dueDate) < todayEnd),
    upcoming: userTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= todayEnd && new Date(t.dueDate) < weekEnd
    ),
    later: userTasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= weekEnd),
  };
}

export const PROJECT_IDS = mockProjects.map((p) => p.id);
