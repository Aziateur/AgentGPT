// Enums / union types

export type ProjectView = "list" | "board" | "timeline" | "calendar" | "overview";

export type TaskPriority = "none" | "low" | "medium" | "high";

export type TaskType = "task" | "milestone" | "approval";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

export type ProjectStatusType = "on_track" | "at_risk" | "off_track" | "on_hold" | "complete";

export type GoalStatus = "on_track" | "at_risk" | "off_track" | "achieved" | "missed" | "dropped";

export type GoalTimeframe = "q1" | "q2" | "q3" | "q4" | "h1" | "h2" | "annual" | "custom";

export type Theme = "light" | "dark";

export type MemberRole = "owner" | "admin" | "editor" | "commenter" | "viewer" | "member";

export type NotificationType = "assigned" | "commented" | "mentioned" | "completed" | "dependency_resolved" | "task_assigned" | "task_completed" | "comment_added" | "due_date_approaching" | "project_status_update" | "mention" | "approval_request" | "approval_response";

// Entity types - loosely typed to match Prisma output

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  oooEnabled?: boolean | null;
  oooFrom?: string | null;
  oooUntil?: string | null;
  oooMessage?: string | null;
  [key: string]: unknown;
}

export interface TaskTypeDef {
  id: string;
  projectId: string | null;
  name: string;
  color: string;
  icon?: string | null;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  members?: TeamMember[];
  projects?: Project[];
  [key: string]: unknown;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  user?: User;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  archived: boolean;
  favorite: boolean;
  defaultView: string;
  creatorId: string;
  startDate?: string | null;
  dueDate?: string | null;
  statusText?: string | null;
  createdAt: string;
  updatedAt: string;
  teamId?: string | null;
  sections?: Section[];
  members?: ProjectMember[];
  tasks?: Task[];
  statuses?: ProjectStatusUpdate[];
  [key: string]: unknown;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user?: User;
}

export interface ProjectStatusUpdate {
  id: string;
  projectId: string;
  authorId: string;
  status: string;
  text?: string | null;
  createdAt: string;
  author?: User;
}

export interface Section {
  id: string;
  name: string;
  position: number;
  projectId: string;
  tasks?: Task[];
  [key: string]: unknown;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  startDate?: string | null;
  priority?: string | null;
  taskType: string;
  approvalStatus?: string | null;
  position: number;
  isTemplate: boolean;
  assigneeId?: string | null;
  creatorId: string;
  projectId?: string | null;
  sectionId?: string | null;
  parentId?: string | null;

  assignee?: User | null;
  creator?: User;
  project?: Project | null;
  section?: Section | null;
  subtasks?: Task[];
  comments?: Comment[];
  tags?: { tag: Tag }[];
  attachments?: Attachment[];
  blockedBy?: Dependency[];
  blocking?: Dependency[];
  customValues?: CustomFieldValue[];
  likes?: TaskLike[];
  followers?: TaskFollower[];
  tagIds?: string[];
  [key: string]: unknown;
}

export interface Comment {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  likes?: CommentLike[];
}

export interface CommentLike {
  id: string;
  commentId: string;
  userId: string;
  user?: User;
}

export interface TaskLike {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
}

export interface TaskFollower {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Dependency {
  id: string;
  blockedTaskId: string;
  blockingTaskId: string;
  blockedTask?: Task;
  blockingTask?: Task;
  createdAt: string;
}

export interface CustomFieldDef {
  id: string;
  name: string;
  fieldType: string;
  options?: string | null;
  projectId: string;
  values?: CustomFieldValue[];
}

export type FormFieldType =
  | "text"
  | "paragraph"
  | "number"
  | "date"
  | "single_select"
  | "multi_select";

export interface CustomFieldValue {
  id: string;
  value?: string | null;
  taskId: string;
  fieldId: string;
  field?: CustomFieldDef;
  [key: string]: unknown;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  taskId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  read: boolean;
  archived: boolean;
  userId: string;
  linkUrl?: string | null;
  createdAt: string | Date;
}

export type AutomationTrigger =
  | "task_added"
  | "task_completed"
  | "task_moved_to_section"
  | "due_date_approaching"
  | "status_changed"
  | "custom_field_changed";

export type AutomationAction =
  | "assign_task"
  | "set_due_date"
  | "move_to_section"
  | "add_comment"
  | "mark_complete"
  | "set_custom_field"
  | "create_subtask";

export interface AutomationRule {
  id: string;
  name: string;
  active: boolean;
  triggerType: string;
  triggerConfig: string;
  actionType: string;
  actionConfig: string;
  projectId: string;
  creatorId: string;
  executions?: RuleExecution[];
  [key: string]: unknown;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  userId: string;
  success: boolean;
  details?: string | null;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  ownerId: string;
  owner?: User;
  projects?: PortfolioProject[];
  [key: string]: unknown;
}

export interface PortfolioProject {
  id: string;
  portfolioId: string;
  projectId: string;
  project?: Project;
}

export interface Goal {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  progress: number;
  period?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  ownerId: string;
  parentId?: string | null;
  targetValue?: number;
  currentValue?: number;
  owner?: User;
  parent?: Goal | null;
  subGoals?: Goal[];
  projects?: GoalProject[];
  [key: string]: unknown;
}

export interface GoalProject {
  id: string;
  goalId: string;
  projectId: string;
  project?: Project;
}

export interface Form {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  projectId: string;
  submissionCount?: number;
  fields?: FormField[];
  submissions?: FormSubmission[];
  [key: string]: unknown;
}

export interface FormField {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
  options?: string | null;
  position: number;
  formId: string;
}

export interface FormSubmission {
  id: string;
  data: string;
  formId: string;
  userId?: string | null;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: string;
  userId: string;
  createdAt: string;
}

// Utility types

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
  label: string;
}

export interface FilterOption {
  field: string;
  value: unknown;
  label: string;
}

// ============================================================
// Extended schema types (2026-04 expansion)
// ============================================================

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval?: number;           // every N periods, default 1
  byDay?: number[];            // 0=Sun..6=Sat, for weekly
  byMonthDay?: number;         // for monthly
  endAfter?: number;           // occurrences
  endOn?: string | null;       // ISO date
}

export interface TaskDependencyEdge {
  id: string;
  blockerTaskId: string;
  blockedTaskId: string;
  depType: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
  createdAt: string;
}

export interface AttachmentFile {
  id: string;
  taskId?: string | null;
  projectId?: string | null;
  uploaderId?: string | null;
  filename: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  storagePath: string;
  publicUrl?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;
  taskId?: string | null;
  projectId?: string | null;
  title: string;
  message?: string | null;
  linkUrl?: string | null;
  read: boolean;
  archived: boolean;
  bookmarked?: boolean;
  snoozedUntil?: string | null;
  createdAt: string;
}

// Rich automation-rule shape that matches the new JSONB schema.
// Existing AutomationRule (above) keeps its legacy string shape for back-compat.
export interface RuleTrigger {
  type: string; // task_created | task_completed | task_moved | due_date_approaching | assignee_changed | custom_field_changed | comment_added | form_submitted
  config?: Record<string, unknown>;
}

export interface RuleActionSpec {
  type: string; // assign | move_section | set_field | add_comment | complete | set_priority | add_tag | notify
  config?: Record<string, unknown>;
  condition?: Record<string, unknown>;
}

export interface AutomationRuleExt {
  id: string;
  projectId?: string | null;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actions: RuleActionSpec[];
  scope: "project" | "workspace" | "my_tasks";
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RuleExecutionExt {
  id: string;
  ruleId: string;
  taskId?: string | null;
  status: "success" | "failed" | "skipped";
  log?: string | null;
  executedAt: string;
}

export interface FormExt {
  id: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  publicSlug?: string | null;
  settings: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  fields?: FormFieldExt[];
}

export interface FormFieldExt {
  id: string;
  formId: string;
  label: string;
  fieldType: string;
  options?: Record<string, unknown> | null;
  required: boolean;
  position: number;
}

export interface FormSubmissionExt {
  id: string;
  formId: string;
  taskId?: string | null;
  payload: Record<string, unknown>;
  submittedAt: string;
}

export interface GoalExt {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string | null;
  parentId?: string | null;
  timePeriod?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  metricType: "percentage" | "numeric" | "milestone";
  metricTarget?: number | null;
  metricCurrent?: number;
  status: string;
  weight?: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  projectId?: string | null;
  portfolioId?: string | null;
  taskId?: string | null;
  createdAt: string;
}

export interface PortfolioExt {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  ownerId?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  projectIds?: string[];
}

export interface TeamExt {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberExt {
  teamId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface ProjectMemberExt {
  projectId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface TaskProjectLink {
  taskId: string;
  projectId: string;
  sectionId?: string | null;
  createdAt: string;
}

export interface TagExt {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CustomFieldDefExt {
  id: string;
  projectId?: string | null;
  name: string;
  fieldType:
    | "text"
    | "number"
    | "date"
    | "single_select"
    | "multi_select"
    | "people"
    | "checkbox"
    | "formula";
  options?: { choices?: Array<{ id: string; label: string; color?: string }>; formula?: string } | null;
  required: boolean;
  position: number;
  createdAt: string;
}

export interface CustomFieldValueExt {
  id: string;
  taskId: string;
  fieldId: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDate?: string | null;
  valueUserId?: string | null;
  valueSelectIds?: string[] | null;
  valueBool?: boolean | null;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface SavedView {
  id: string;
  projectId?: string | null;
  userId?: string | null;
  name: string;
  viewType: "list" | "board" | "timeline" | "calendar";
  filters: FilterSpec[];
  sort: SortSpec[];
  groupBy?: string | null;
  createdAt: string;
}

export interface FilterSpec {
  field: string;
  operator:
    | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
    | "contains" | "starts_with" | "ends_with"
    | "in" | "not_in" | "is_null" | "is_not_null"
    | "between";
  value?: unknown;
  value2?: unknown;
}

export interface SortSpec {
  field: string;
  direction: "asc" | "desc";
}

export interface Dashboard {
  id: string;
  ownerId?: string | null;
  scopeId?: string | null;
  name: string;
  createdAt: string;
  widgets?: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: "counter" | "bar" | "line" | "pie" | "burnup" | "list";
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  createdAt: string;
}

export interface WebhookSubscription {
  id: string;
  userId?: string | null;
  eventType: string;
  targetUrl: string;
  secret?: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface MyTaskSection {
  id: string;
  userId: string;
  name: string;
  position: number;
  createdAt: string;
}

export interface ProjectStatusUpdateExt {
  id: string;
  projectId: string;
  authorId?: string | null;
  status: string;
  text?: string | null;
  createdAt: string;
}

// ----------------------------------------------
// AI provider config (stored in localStorage)
// ----------------------------------------------

export type AIProviderType = "anthropic" | "openai" | "openai_compatible" | "ollama";

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  label: string;
  apiKey?: string;   // not used for ollama / openai_compatible local
  baseUrl?: string;  // for openai_compatible / ollama
  model: string;
  isDefault?: boolean;
}

export interface AIAppSettings {
  providers: AIProviderConfig[];
  defaultProviderId?: string | null;
  features: {
    smartSummary: boolean;
    smartStatus: boolean;
    smartFields: boolean;
    smartRuleCreator: boolean;
    smartChat: boolean;
  };
}

