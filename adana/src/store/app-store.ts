import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import {
  mockProjects,
  mockSections,
  mockTasks,
} from "@/lib/mock-data";
import { createTagsSlice, createCustomFieldsSlice } from "./slices/tags-fields";
import { createDepsSlice, createAttachmentsSlice } from "./slices/deps-attachments";
import { createRulesSlice, createTimeSlice } from "./slices/rules-time";
import { createFormsSlice, createNotificationsSlice } from "./slices/forms-notifications";
import { createGoalsSlice, createPortfoliosSlice, createTeamsSlice } from "./slices/goals-portfolios-teams";
import {
  createSavedViewsSlice,
  createDashboardsSlice,
  createMultiHomingSlice,
  createRecurrenceSlice,
} from "./slices/views-misc";
import type {
  User,
  Project,
  Section,
  Task,
  Notification,
  Goal,
  Portfolio,
  TagExt,
  TaskDependencyEdge,
  CustomFieldDefExt,
  CustomFieldValueExt,
  AttachmentFile,
  NotificationItem,
  AutomationRuleExt,
  RuleExecutionExt,
  FormExt,
  FormFieldExt,
  FormSubmissionExt,
  GoalExt,
  PortfolioExt,
  TeamExt,
  TeamMemberExt,
  ProjectMemberExt,
  TimeEntry,
  SavedView,
  SavedSearch,
  Dashboard,
  DashboardWidget,
  ProjectStatusUpdateExt,
  TaskProjectLink,
  MyTaskSection,
} from "@/types";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mappers
// ---------------------------------------------------------------------------

function dbToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    color: (r.color as string) ?? "#6366f1",
    icon: (r.icon as string) ?? "folder",
    archived: (r.archived as boolean) ?? false,
    favorite: (r.favorite as boolean) ?? false,
    defaultView: (r.default_view as string) ?? "list",
    creatorId: (r.owner_id as string) ?? "",
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
    updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
  };
}

function projectToDb(p: Partial<Project>) {
  const row: Record<string, unknown> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.color !== undefined) row.color = p.color;
  if (p.icon !== undefined) row.icon = p.icon;
  if (p.archived !== undefined) row.archived = p.archived;
  if (p.favorite !== undefined) row.favorite = p.favorite;
  if (p.defaultView !== undefined) row.default_view = p.defaultView;
  if (p.creatorId !== undefined) row.owner_id = p.creatorId;
  return row;
}

function dbToSection(r: Record<string, unknown>): Section {
  return {
    id: r.id as string,
    name: r.name as string,
    position: (r.position as number) ?? 0,
    projectId: (r.project_id as string) ?? "",
  };
}

function sectionToDb(s: Partial<Section>) {
  const row: Record<string, unknown> = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.name !== undefined) row.name = s.name;
  if (s.position !== undefined) row.position = s.position;
  if (s.projectId !== undefined) row.project_id = s.projectId;
  return row;
}

function dbToTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? null,
    completed: (r.completed as boolean) ?? false,
    completedAt: (r.completed_at as string) ?? null,
    dueDate: (r.due_date as string) ?? null,
    dueTime: (r.due_time as string) ?? null,
    startDate: (r.start_date as string) ?? null,
    priority: (r.priority as string) ?? null,
    taskType: (r.task_type as string) ?? "task",
    approvalStatus: (r.approval_status as string) ?? null,
    position: (r.position as number) ?? 0,
    isTemplate: (r.is_template as boolean) ?? false,
    assigneeId: (r.assignee_id as string) ?? null,
    creatorId: (r.creator_id as string) ?? "",
    projectId: (r.project_id as string) ?? null,
    sectionId: (r.section_id as string) ?? null,
    parentId: (r.parent_id as string) ?? null,
  };
}

function taskToDb(t: Partial<Task>) {
  const row: Record<string, unknown> = {};
  if (t.id !== undefined) row.id = t.id;
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.completed !== undefined) row.completed = t.completed;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt;
  if (t.dueDate !== undefined) row.due_date = t.dueDate;
  if (t.dueTime !== undefined) row.due_time = t.dueTime;
  if (t.startDate !== undefined) row.start_date = t.startDate;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.taskType !== undefined) row.task_type = t.taskType;
  if (t.approvalStatus !== undefined) row.approval_status = t.approvalStatus;
  if (t.position !== undefined) row.position = t.position;
  if (t.isTemplate !== undefined) row.is_template = t.isTemplate;
  if (t.assigneeId !== undefined) row.assignee_id = t.assigneeId;
  if (t.creatorId !== undefined) row.creator_id = t.creatorId;
  if (t.projectId !== undefined) row.project_id = t.projectId;
  if (t.sectionId !== undefined) row.section_id = t.sectionId;
  if (t.parentId !== undefined) row.parent_id = t.parentId;
  return row;
}

function dbToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    avatar: (r.avatar as string) ?? null,
  };
}

// ---------- Extended schema mappers ----------

function dbToTag(r: any): TagExt {
  return {
    id: r.id,
    name: r.name,
    color: r.color ?? "#4c6ef5",
    createdAt: r.created_at,
  };
}

function dbToDep(r: any): TaskDependencyEdge {
  return {
    id: r.id,
    blockerTaskId: r.blocker_task_id,
    blockedTaskId: r.blocked_task_id,
    depType: (r.dep_type ?? "finish_to_start"),
    createdAt: r.created_at,
  };
}

function dbToCustomFieldDef(r: any): CustomFieldDefExt {
  return {
    id: r.id,
    projectId: r.project_id ?? null,
    name: r.name,
    fieldType: r.field_type,
    options: r.options ?? null,
    required: !!r.required,
    position: r.position ?? 0,
    createdAt: r.created_at,
  };
}

function dbToCustomFieldValue(r: any): CustomFieldValueExt {
  return {
    id: r.id,
    taskId: r.task_id,
    fieldId: r.field_id,
    valueText: r.value_text ?? null,
    valueNumber: r.value_number ?? null,
    valueDate: r.value_date ?? null,
    valueUserId: r.value_user_id ?? null,
    valueSelectIds: r.value_select_ids ?? null,
    valueBool: r.value_bool ?? null,
    updatedAt: r.updated_at,
  };
}

function dbToAttachment(r: any): AttachmentFile {
  return {
    id: r.id,
    taskId: r.task_id ?? null,
    projectId: r.project_id ?? null,
    uploaderId: r.uploader_id ?? null,
    filename: r.filename,
    mimeType: r.mime_type ?? null,
    sizeBytes: r.size_bytes ?? null,
    storagePath: r.storage_path,
    publicUrl: r.public_url ?? null,
    createdAt: r.created_at,
  };
}

function dbToNotification(r: any): NotificationItem {
  return {
    id: r.id,
    userId: r.user_id,
    actorId: r.actor_id ?? null,
    type: r.type,
    taskId: r.task_id ?? null,
    projectId: r.project_id ?? null,
    title: r.title,
    message: r.message ?? null,
    linkUrl: r.link_url ?? null,
    read: !!r.read,
    archived: !!r.archived,
    snoozedUntil: r.snoozed_until ?? null,
    createdAt: r.created_at,
  };
}

function dbToRule(r: any): AutomationRuleExt {
  return {
    id: r.id,
    projectId: r.project_id ?? null,
    name: r.name,
    enabled: !!r.enabled,
    triggerType: r.trigger_type,
    triggerConfig: r.trigger_config ?? {},
    actions: Array.isArray(r.actions) ? r.actions : [],
    scope: (r.scope ?? "project"),
    userId: r.user_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function dbToRuleExec(r: any): RuleExecutionExt {
  return {
    id: r.id,
    ruleId: r.rule_id,
    taskId: r.task_id ?? null,
    status: r.status,
    log: r.log ?? null,
    executedAt: r.executed_at,
  };
}

function dbToForm(r: any): FormExt {
  return {
    id: r.id,
    projectId: r.project_id ?? null,
    title: r.title,
    description: r.description ?? null,
    publicSlug: r.public_slug ?? null,
    settings: r.settings ?? {},
    enabled: !!r.enabled,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function dbToFormField(r: any): FormFieldExt {
  return {
    id: r.id,
    formId: r.form_id,
    label: r.label,
    fieldType: r.field_type,
    options: r.options ?? null,
    required: !!r.required,
    position: r.position ?? 0,
  };
}

function dbToFormSubmission(r: any): FormSubmissionExt {
  return {
    id: r.id,
    formId: r.form_id,
    taskId: r.task_id ?? null,
    payload: r.payload ?? {},
    submittedAt: r.submitted_at,
  };
}

function dbToGoal(r: any): GoalExt {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    ownerId: r.owner_id ?? null,
    parentId: r.parent_id ?? null,
    timePeriod: r.time_period ?? null,
    startDate: r.start_date ?? null,
    endDate: r.end_date ?? null,
    metricType: r.metric_type ?? "percentage",
    metricTarget: r.metric_target ?? null,
    metricCurrent: r.metric_current ?? 0,
    status: r.status ?? "on_track",
    weight: r.weight ?? 1,
    progress: r.progress ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function dbToPortfolio(r: any): PortfolioExt {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    color: r.color ?? "#4c6ef5",
    ownerId: r.owner_id ?? null,
    parentId: r.parent_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function dbToTeam(r: any): TeamExt {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    ownerId: r.owner_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function dbToStatusUpdate(r: any): ProjectStatusUpdateExt {
  return {
    id: r.id,
    projectId: r.project_id,
    authorId: r.author_id ?? null,
    status: r.status,
    text: r.text ?? null,
    createdAt: r.created_at,
  };
}

function dbToTimeEntry(r: any): TimeEntry {
  return {
    id: r.id,
    taskId: r.task_id,
    userId: r.user_id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? null,
    durationMinutes: r.duration_minutes ?? null,
    note: r.note ?? null,
    createdAt: r.created_at,
  };
}

function dbToSavedView(r: any): SavedView {
  return {
    id: r.id,
    projectId: r.project_id ?? null,
    userId: r.user_id ?? null,
    name: r.name,
    viewType: r.view_type,
    filters: Array.isArray(r.filters) ? r.filters : [],
    sort: Array.isArray(r.sort) ? r.sort : [],
    groupBy: r.group_by ?? null,
    createdAt: r.created_at,
  };
}

function dbToSavedSearch(r: any): SavedSearch {
  return {
    id: r.id,
    name: r.name,
    query: r.query ?? "",
    filters: JSON.stringify(r.filters ?? []),
    userId: r.user_id,
    createdAt: r.created_at,
  };
}

function dbToDashboard(r: any): Dashboard {
  return {
    id: r.id,
    ownerId: r.owner_id ?? null,
    scopeId: r.scope_id ?? null,
    name: r.name,
    createdAt: r.created_at,
  };
}

function dbToWidget(r: any): DashboardWidget {
  return {
    id: r.id,
    dashboardId: r.dashboard_id,
    type: r.type,
    config: r.config ?? {},
    position: r.position ?? { x: 0, y: 0, w: 6, h: 4 },
    createdAt: r.created_at,
  };
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

const EMPTY_USER: User = { id: "", name: "Guest", email: "", avatar: null };

interface AppState {
  // Data
  users: User[];
  projects: Project[];
  sections: Section[];
  tasks: Task[];
  notifications: Notification[];
  currentUser: User;

  localGoals: any[];        // Using any here temporarily to avoid complex Goal imports for now
  localPortfolios: any[];   // Using any to store the UI portfolios

  // Extended schema data (fetched per-table with graceful fallback)
  tags: TagExt[];
  taskTags: { taskId: string; tagId: string }[];
  taskDeps: TaskDependencyEdge[];
  taskProjects: TaskProjectLink[];
  customFieldDefs: CustomFieldDefExt[];
  customFieldValues: CustomFieldValueExt[];
  attachments: AttachmentFile[];
  notificationsExt: NotificationItem[];
  rules: AutomationRuleExt[];
  ruleExecutions: RuleExecutionExt[];
  forms: FormExt[];
  formFields: FormFieldExt[];
  formSubmissions: FormSubmissionExt[];
  goalsExt: GoalExt[];
  portfoliosExt: PortfolioExt[];
  portfolioProjects: { portfolioId: string; projectId: string; position: number }[];
  teams: TeamExt[];
  teamMembers: TeamMemberExt[];
  projectMembers: ProjectMemberExt[];
  projectStatusUpdates: ProjectStatusUpdateExt[];
  timeEntries: TimeEntry[];
  savedViews: SavedView[];
  savedSearches: SavedSearch[];
  dashboards: Dashboard[];
  dashboardWidgets: DashboardWidget[];
  myTaskSections: MyTaskSection[];

  // State flags
  initialized: boolean;
  loading: boolean;
  error: string | null;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Auth
  setCurrentUser: (user: User) => void;
  logout: () => void;

  // Init
  init: () => Promise<void>;

  // Project mutations
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  // Task mutations
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;

  // Section mutations
  createSection: (data: Partial<Section>) => Promise<Section>;
  updateSection: (id: string, name: string) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  // Notification mutations
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  archiveNotification: (id: string) => void;

  // Helpers
  getProjectTasks: (projectId: string) => Task[];
  getProjectSections: (projectId: string) => Section[];
  getMyTasks: () => { today: Task[]; upcoming: Task[]; later: Task[]; recurring: Task[] };

  // Per-user visibility selectors
  visibleProjectIds: () => string[];
  getVisibleProjects: () => Project[];
  getMyGoals: () => GoalExt[];
  getMyPortfolios: () => PortfolioExt[];
  getMyTeams: () => TeamExt[];
  getMyNotifications: () => NotificationItem[];

  // Local state mutations
  setLocalGoals: (goals: any[]) => void;
  setLocalPortfolios: (portfolios: any[]) => void;

  // -- Tags --
  createTag: (name: string, color?: string) => Promise<TagExt>;
  deleteTag: (id: string) => Promise<void>;
  addTagToTask: (taskId: string, tagId: string) => Promise<void>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>;
  getTaskTags: (taskId: string) => TagExt[];

  // -- Dependencies --
  addDependency: (blockerTaskId: string, blockedTaskId: string) => Promise<void>;
  removeDependency: (id: string) => Promise<void>;
  getBlockers: (taskId: string) => Task[];     // tasks blocking this task
  getBlocked: (taskId: string) => Task[];      // tasks this task blocks
  isTaskBlocked: (taskId: string) => boolean;  // true if any blocker is incomplete

  // -- Custom Fields --
  createCustomFieldDef: (data: Partial<CustomFieldDefExt>) => Promise<CustomFieldDefExt>;
  updateCustomFieldDef: (id: string, updates: Partial<CustomFieldDefExt>) => Promise<void>;
  deleteCustomFieldDef: (id: string) => Promise<void>;
  setCustomFieldValue: (taskId: string, fieldId: string, value: Partial<CustomFieldValueExt>) => Promise<void>;
  getCustomFieldValues: (taskId: string) => CustomFieldValueExt[];
  getProjectCustomFields: (projectId: string) => CustomFieldDefExt[];

  // -- Attachments --
  addAttachment: (data: Partial<AttachmentFile> & { filename: string; storagePath: string }) => Promise<AttachmentFile>;
  deleteAttachment: (id: string) => Promise<void>;
  getTaskAttachments: (taskId: string) => AttachmentFile[];

  // -- Notifications (DB-backed) --
  createNotification: (n: Partial<NotificationItem> & { userId: string; type: string; title: string }) => Promise<void>;
  markNotificationExtRead: (id: string) => Promise<void>;
  markAllNotificationsExtRead: () => Promise<void>;
  archiveNotificationExt: (id: string) => Promise<void>;
  snoozeNotification: (id: string, until: string) => Promise<void>;

  // -- Automation Rules --
  createRule: (data: Partial<AutomationRuleExt> & { name: string; triggerType: string }) => Promise<AutomationRuleExt>;
  updateRule: (id: string, updates: Partial<AutomationRuleExt>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  logRuleExecution: (ruleId: string, taskId: string | null, status: "success" | "failed" | "skipped", log?: string) => Promise<void>;

  // -- Forms --
  createForm: (data: Partial<FormExt> & { title: string }) => Promise<FormExt>;
  updateForm: (id: string, updates: Partial<FormExt>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  createFormField: (data: Partial<FormFieldExt> & { formId: string; label: string; fieldType: string }) => Promise<FormFieldExt>;
  updateFormField: (id: string, updates: Partial<FormFieldExt>) => Promise<void>;
  deleteFormField: (id: string) => Promise<void>;
  submitForm: (formId: string, payload: Record<string, unknown>) => Promise<FormSubmissionExt>;

  // -- Goals (Supabase-backed) --
  createGoal: (data: Partial<GoalExt> & { name: string }) => Promise<GoalExt>;
  updateGoal: (id: string, updates: Partial<GoalExt>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  linkGoalToProject: (goalId: string, projectId: string) => Promise<void>;
  unlinkGoalFromProject: (goalId: string, projectId: string) => Promise<void>;

  // -- Portfolios (Supabase-backed) --
  createPortfolio: (data: Partial<PortfolioExt> & { name: string }) => Promise<PortfolioExt>;
  updatePortfolio: (id: string, updates: Partial<PortfolioExt>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  addProjectToPortfolio: (portfolioId: string, projectId: string) => Promise<void>;
  removeProjectFromPortfolio: (portfolioId: string, projectId: string) => Promise<void>;

  // -- Teams --
  createTeam: (data: Partial<TeamExt> & { name: string }) => Promise<TeamExt>;
  updateTeam: (id: string, updates: Partial<TeamExt>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string, role?: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;

  // -- Project Members --
  addProjectMember: (projectId: string, userId: string, role?: string) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;

  // -- Project Status Updates --
  postProjectStatus: (projectId: string, status: string, text?: string) => Promise<void>;

  // -- Time Entries --
  startTimer: (taskId: string) => Promise<TimeEntry>;
  stopTimer: (entryId: string, note?: string) => Promise<void>;
  addTimeEntry: (taskId: string, minutes: number, note?: string) => Promise<TimeEntry>;
  deleteTimeEntry: (id: string) => Promise<void>;
  getTaskTimeEntries: (taskId: string) => TimeEntry[];
  getTaskActualMinutes: (taskId: string) => number;

  // -- Saved Views --
  createSavedView: (data: Partial<SavedView> & { name: string; viewType: SavedView["viewType"] }) => Promise<SavedView>;
  updateSavedView: (id: string, updates: Partial<SavedView>) => Promise<void>;
  deleteSavedView: (id: string) => Promise<void>;

  // -- Dashboards --
  createDashboard: (name: string, scopeId?: string) => Promise<Dashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  addWidget: (dashboardId: string, type: DashboardWidget["type"], config: Record<string, unknown>) => Promise<DashboardWidget>;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => Promise<void>;
  deleteWidget: (id: string) => Promise<void>;

  // -- Task multi-homing --
  addTaskToProject: (taskId: string, projectId: string, sectionId?: string | null) => Promise<void>;
  removeTaskFromProject: (taskId: string, projectId: string) => Promise<void>;
  getTaskProjects: (taskId: string) => string[];

  // -- Recurring tasks helper (called on complete) --
  spawnRecurrence: (taskId: string) => Promise<Task | null>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [],
      projects: [],
      sections: [],
      tasks: [],
      notifications: [],
      currentUser: EMPTY_USER,
      localGoals: [],
      localPortfolios: [],

      tags: [],
      taskTags: [],
      taskDeps: [],
      taskProjects: [],
      customFieldDefs: [],
      customFieldValues: [],
      attachments: [],
      notificationsExt: [],
      rules: [],
      ruleExecutions: [],
      forms: [],
      formFields: [],
      formSubmissions: [],
      goalsExt: [],
      portfoliosExt: [],
      portfolioProjects: [],
      teams: [],
      teamMembers: [],
      projectMembers: [],
      projectStatusUpdates: [],
      timeEntries: [],
      savedViews: [],
      savedSearches: [],
      dashboards: [],
      dashboardWidgets: [],
      myTaskSections: [],

      initialized: false,
      loading: false,
      error: null,

      theme: "light",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: EMPTY_USER }),

      init: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });

    try {
      // Fetch all data from Supabase in parallel
      const [usersRes, projectsRes, sectionsRes, tasksRes] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("sections").select("*").order("position", { ascending: true }),
        supabase.from("tasks").select("*").order("position", { ascending: true }),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const users = (usersRes.data || []).map(dbToUser);
      let projects = (projectsRes.data || []).map(dbToProject);
      let sections = (sectionsRes.data || []).map(dbToSection);
      let tasks = (tasksRes.data || []).map(dbToTask);

      // Keep the current user if logged in, otherwise default to EMPTY_USER
      // Do not randomly assign "demo-user" anymore
      const currentId = get().currentUser.id;
      let nextUser = get().currentUser;
      
      if (currentId && currentId !== "") {
        const found = users.find((u) => u.id === currentId);
        if (found) nextUser = found;
      }

      // Fetch extended tables in parallel. Each is wrapped so that a missing
      // table (migration not yet applied) does not break the app.
      const safe = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
        try { return await fn(); } catch { return []; }
      };
      const [
        tagsD, taskTagsD, depsD, taskProjectsD,
        cfdD, cfvD, attachD, notifD,
        rulesD, ruleExecD,
        formsD, formFieldsD, formSubD,
        goalsD, portD, portProjD,
        teamsD, teamMembD, projMembD,
        psuD, timeD,
        savedViewsD, savedSearchD,
        dashD, widgetD, myTaskSecD,
      ] = await Promise.all([
        safe(async () => ((await supabase.from("tags").select("*")).data || [])),
        safe(async () => ((await supabase.from("task_tags").select("*")).data || [])),
        safe(async () => ((await supabase.from("task_dependencies").select("*")).data || [])),
        safe(async () => ((await supabase.from("task_projects").select("*")).data || [])),
        safe(async () => ((await supabase.from("custom_field_defs").select("*")).data || [])),
        safe(async () => ((await supabase.from("custom_field_values").select("*")).data || [])),
        safe(async () => ((await supabase.from("attachments").select("*")).data || [])),
        safe(async () => ((await supabase.from("notifications").select("*").order("created_at", { ascending: false })).data || [])),
        safe(async () => ((await supabase.from("automation_rules").select("*")).data || [])),
        safe(async () => ((await supabase.from("rule_executions").select("*").order("executed_at", { ascending: false }).limit(200)).data || [])),
        safe(async () => ((await supabase.from("forms").select("*")).data || [])),
        safe(async () => ((await supabase.from("form_fields").select("*").order("position")).data || [])),
        safe(async () => ((await supabase.from("form_submissions").select("*").order("submitted_at", { ascending: false })).data || [])),
        safe(async () => ((await supabase.from("goals").select("*")).data || [])),
        safe(async () => ((await supabase.from("portfolios").select("*")).data || [])),
        safe(async () => ((await supabase.from("portfolio_projects").select("*")).data || [])),
        safe(async () => ((await supabase.from("teams").select("*")).data || [])),
        safe(async () => ((await supabase.from("team_members").select("*")).data || [])),
        safe(async () => ((await supabase.from("project_members").select("*")).data || [])),
        safe(async () => ((await supabase.from("project_status_updates").select("*").order("created_at", { ascending: false })).data || [])),
        safe(async () => ((await supabase.from("time_entries").select("*").order("started_at", { ascending: false })).data || [])),
        safe(async () => ((await supabase.from("saved_views").select("*")).data || [])),
        safe(async () => ((await supabase.from("saved_searches").select("*")).data || [])),
        safe(async () => ((await supabase.from("dashboards").select("*")).data || [])),
        safe(async () => ((await supabase.from("dashboard_widgets").select("*")).data || [])),
        safe(async () => ((await supabase.from("my_task_sections").select("*").order("position")).data || [])),
      ]);

      set({
        users,
        projects,
        sections,
        tasks,
        notifications: [],
        currentUser: nextUser,
        tags: tagsD.map(dbToTag),
        taskTags: taskTagsD.map((r: any) => ({ taskId: r.task_id, tagId: r.tag_id })),
        taskDeps: depsD.map(dbToDep),
        taskProjects: taskProjectsD.map((r: any) => ({ taskId: r.task_id, projectId: r.project_id, sectionId: r.section_id ?? null, createdAt: r.created_at })),
        customFieldDefs: cfdD.map(dbToCustomFieldDef),
        customFieldValues: cfvD.map(dbToCustomFieldValue),
        attachments: attachD.map(dbToAttachment),
        notificationsExt: notifD.map(dbToNotification),
        rules: rulesD.map(dbToRule),
        ruleExecutions: ruleExecD.map(dbToRuleExec),
        forms: formsD.map(dbToForm),
        formFields: formFieldsD.map(dbToFormField),
        formSubmissions: formSubD.map(dbToFormSubmission),
        goalsExt: goalsD.map(dbToGoal),
        portfoliosExt: portD.map(dbToPortfolio),
        portfolioProjects: portProjD.map((r: any) => ({ portfolioId: r.portfolio_id, projectId: r.project_id, position: r.position ?? 0 })),
        teams: teamsD.map(dbToTeam),
        teamMembers: teamMembD.map((r: any) => ({ teamId: r.team_id, userId: r.user_id, role: r.role ?? "member", createdAt: r.created_at })),
        projectMembers: projMembD.map((r: any) => ({ projectId: r.project_id, userId: r.user_id, role: r.role ?? "member", createdAt: r.created_at })),
        projectStatusUpdates: psuD.map(dbToStatusUpdate),
        timeEntries: timeD.map(dbToTimeEntry),
        savedViews: savedViewsD.map(dbToSavedView),
        savedSearches: savedSearchD.map(dbToSavedSearch),
        dashboards: dashD.map(dbToDashboard),
        dashboardWidgets: widgetD.map(dbToWidget),
        myTaskSections: myTaskSecD.map((r: any) => ({ id: r.id, userId: r.user_id, name: r.name, position: r.position ?? 0, createdAt: r.created_at })),
        initialized: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Supabase fetch failed:", err);
      // No mock fallback - show empty state with error
      set({
        users: [],
        projects: [],
        sections: [],
        tasks: [],
        notifications: [],
        currentUser: EMPTY_USER,
        initialized: true,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load data",
      });
    }
  },

  // -- Project mutations ----------------------------------------------------

  createProject: async (data) => {
    const id = crypto.randomUUID();
    const project: Project = {
      id,
      name: data.name || "New Project",
      description: data.description ?? null,
      color: data.color || "#6366f1",
      icon: data.icon || "folder",
      archived: false,
      favorite: false,
      defaultView: data.defaultView || "list",
      creatorId: get().currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((s) => ({ projects: [project, ...s.projects] }));

    const defaultSections: Section[] = [
      { id: crypto.randomUUID(), name: "To Do", position: 0, projectId: id },
      { id: crypto.randomUUID(), name: "In Progress", position: 1, projectId: id },
      { id: crypto.randomUUID(), name: "Done", position: 2, projectId: id },
    ];
    set((s) => ({ sections: [...s.sections, ...defaultSections] }));

    try {
      await supabase.from("projects").insert(projectToDb(project));
      for (const sec of defaultSections) {
        await supabase.from("sections").insert(sectionToDb(sec));
      }
    } catch (err) {
      console.error("Failed to create project in Supabase:", err);
    }

    return project;
  },

  updateProject: async (id, updates) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    try {
      await supabase.from("projects").update(projectToDb(updates)).eq("id", id);
    } catch (err) {
      console.error("Failed to update project in Supabase:", err);
    }
  },

  deleteProject: async (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      sections: s.sections.filter((sec) => sec.projectId !== id),
    }));
    try {
      await supabase.from("tasks").delete().eq("project_id", id);
      await supabase.from("sections").delete().eq("project_id", id);
      await supabase.from("projects").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete project in Supabase:", err);
    }
  },

  toggleFavorite: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const newFav = !project.favorite;
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, favorite: newFav } : p)),
    }));
    try {
      await supabase.from("projects").update({ favorite: newFav }).eq("id", id);
    } catch (err) {
      console.error("Failed to toggle favorite in Supabase:", err);
    }
  },

  // -- Task mutations -------------------------------------------------------

  createTask: async (data) => {
    const id = crypto.randomUUID();
    const task: Task = {
      id,
      title: data.title || "New Task",
      description: data.description ?? null,
      completed: false,
      completedAt: null,
      dueDate: data.dueDate ?? null,
      dueTime: data.dueTime ?? null,
      startDate: data.startDate ?? null,
      priority: data.priority ?? "none",
      taskType: data.taskType ?? "task",
      approvalStatus: null,
      position: get().tasks.filter((t) => t.projectId === data.projectId).length,
      isTemplate: false,
      assigneeId: data.assigneeId ?? null,
      creatorId: get().currentUser.id,
      projectId: data.projectId ?? null,
      sectionId: data.sectionId ?? null,
      parentId: data.parentId ?? null,
    };

    set((s) => ({ tasks: [...s.tasks, task] }));

    try {
      await supabase.from("tasks").insert(taskToDb(task));
    } catch (err) {
      console.error("Failed to create task in Supabase:", err);
    }

    return task;
  },

  updateTask: async (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    try {
      await supabase.from("tasks").update(taskToDb(updates)).eq("id", id);
    } catch (err) {
      console.error("Failed to update task in Supabase:", err);
    }
  },

  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    try {
      await supabase.from("tasks").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete task in Supabase:", err);
    }
  },

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    const completedAt = completed ? new Date().toISOString() : null;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed, completedAt } : t)),
    }));
    try {
      await supabase.from("tasks").update({ completed, completed_at: completedAt }).eq("id", id);
    } catch (err) {
      console.error("Failed to toggle task complete in Supabase:", err);
    }
  },

  // -- Section mutations ----------------------------------------------------

  createSection: async (data) => {
    const id = crypto.randomUUID();
    const section: Section = {
      id,
      name: data.name || "New Section",
      position: get().sections.filter((s) => s.projectId === data.projectId).length,
      projectId: data.projectId || "",
    };

    set((s) => ({ sections: [...s.sections, section] }));

    try {
      await supabase.from("sections").insert(sectionToDb(section));
    } catch (err) {
      console.error("Failed to create section in Supabase:", err);
    }

    return section;
  },

  updateSection: async (id, name) => {
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === id ? { ...sec, name } : sec)),
    }));
    try {
      await supabase.from("sections").update({ name }).eq("id", id);
    } catch (err) {
      console.error("Failed to update section in Supabase:", err);
    }
  },

  deleteSection: async (id) => {
    set((s) => ({
      sections: s.sections.filter((sec) => sec.id !== id),
      tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: null } : t)),
    }));
    try {
      await supabase.from("tasks").update({ section_id: null }).eq("section_id", id);
      await supabase.from("sections").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete section in Supabase:", err);
    }
  },

  // -- Notification mutations -----------------------------------------------

  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllNotificationsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  archiveNotification: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, archived: true } : n)),
    }));
  },

  // -- Helpers --------------------------------------------------------------

  getProjectTasks: (projectId) => {
    return get().tasks.filter(
      (t) => t.projectId === projectId && !t.parentId && !(t as any).deletedAt
    );
  },

  getProjectSections: (projectId) => {
    return get().sections.filter((s) => s.projectId === projectId);
  },

  getMyTasks: () => {
    const userId = get().currentUser.id;
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);

    const myTasks = get().tasks.filter(
      (t) => t.assigneeId === userId && !t.completed && !(t as any).deletedAt
    );

    const today = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) <= todayEnd && t.taskType !== "recurring"
    );
    const upcoming = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) > todayEnd && new Date(t.dueDate) <= weekEnd && t.taskType !== "recurring"
    );
    const later = myTasks.filter(
      (t) => (!t.dueDate || new Date(t.dueDate) > weekEnd) && t.taskType !== "recurring"
    );
    
    // Example: Use taskType = 'recurring' or priority for the checklist
    const recurring = get().tasks.filter(
      (t) =>
        t.assigneeId === userId &&
        !t.completed &&
        t.taskType === "recurring" &&
        !(t as any).deletedAt
    );

    return { today, upcoming, later, recurring };
  },

  // -- Per-user visibility selectors ---------------------------------------

  visibleProjectIds: (): string[] => {
    const uid = get().currentUser.id;
    const alive = get().projects.filter((p) => !(p as any).deletedAt);
    if (!uid) return alive.map((p) => p.id);
    const ownerProjects = alive.filter((p) => p.creatorId === uid).map((p) => p.id);
    const memberProjects = get().projectMembers
      .filter((m) => m.userId === uid)
      .map((m) => m.projectId);
    return Array.from(new Set([...ownerProjects, ...memberProjects]));
  },

  getVisibleProjects: (): Project[] => {
    const uid = get().currentUser.id;
    const alive = get().projects.filter((p) => !(p as any).deletedAt);
    if (!uid) return alive;
    const ids = new Set(get().visibleProjectIds());
    return alive.filter((p) => ids.has(p.id));
  },

  getMyGoals: (): GoalExt[] => {
    const uid = get().currentUser.id;
    if (!uid) return get().goalsExt;
    return get().goalsExt.filter((g) => g.ownerId === uid);
  },

  getMyPortfolios: (): PortfolioExt[] => {
    const uid = get().currentUser.id;
    if (!uid) return get().portfoliosExt;
    return get().portfoliosExt.filter((p) => p.ownerId === uid);
  },

  getMyTeams: (): TeamExt[] => {
    const uid = get().currentUser.id;
    if (!uid) return get().teams;
    return get().teams.filter(
      (t) =>
        t.ownerId === uid ||
        get().teamMembers.some((m) => m.teamId === t.id && m.userId === uid)
    );
  },

  getMyNotifications: (): NotificationItem[] => {
    const uid = get().currentUser.id;
    return get().notificationsExt.filter((n) => n.userId === uid);
  },

  setLocalGoals: (goals) => set({ localGoals: goals }),
  setLocalPortfolios: (portfolios) => set({ localPortfolios: portfolios }),

  // -- Spread extended-schema slices --
  ...(createTagsSlice(set, get) as unknown as Partial<AppState>),
  ...(createCustomFieldsSlice(set, get) as unknown as Partial<AppState>),
  ...(createDepsSlice(set, get) as unknown as Partial<AppState>),
  ...(createAttachmentsSlice(set, get) as unknown as Partial<AppState>),
  ...(createRulesSlice(set, get) as unknown as Partial<AppState>),
  ...(createTimeSlice(set, get) as unknown as Partial<AppState>),
  ...(createFormsSlice(set, get) as unknown as Partial<AppState>),
  ...(createNotificationsSlice(set, get) as unknown as Partial<AppState>),
  ...(createGoalsSlice(set, get) as unknown as Partial<AppState>),
  ...(createPortfoliosSlice(set, get) as unknown as Partial<AppState>),
  ...(createTeamsSlice(set, get) as unknown as Partial<AppState>),
  ...(createSavedViewsSlice(set, get) as unknown as Partial<AppState>),
  ...(createDashboardsSlice(set, get) as unknown as Partial<AppState>),
  ...(createMultiHomingSlice(set, get) as unknown as Partial<AppState>),
  ...(createRecurrenceSlice(set, get) as unknown as Partial<AppState>),
} as AppState),
{
  name: "adana-app-storage",
  partialize: (state) => ({
    currentUser: state.currentUser,
    localGoals: state.localGoals,
    localPortfolios: state.localPortfolios,
    theme: state.theme,
  }),
}
));

// ---------------------------------------------------------------------------
// Seed helper: used only to populate an empty Supabase database
// ---------------------------------------------------------------------------

async function seedSupabase() {
  try {
    for (const p of mockProjects) {
      await supabase.from("projects").upsert(projectToDb(p));
    }
    for (const s of mockSections) {
      await supabase.from("sections").upsert(sectionToDb(s));
    }
    for (const t of mockTasks) {
      await supabase.from("tasks").upsert(taskToDb(t));
    }
  } catch (err) {
    console.warn("Failed to seed Supabase:", err);
  }
}
