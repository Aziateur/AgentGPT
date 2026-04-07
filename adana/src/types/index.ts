// Enums / union types

export type ProjectView = "list" | "board" | "timeline" | "calendar" | "overview";

export type TaskPriority = "none" | "low" | "medium" | "high";

export type TaskType = "task" | "milestone" | "approval";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

export type ProjectStatusType = "on_track" | "at_risk" | "off_track" | "on_hold" | "complete";

export type GoalStatus = "on_track" | "at_risk" | "off_track" | "achieved" | "missed";

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
  [key: string]: unknown;
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
  tags?: Tag[];
  attachments?: Attachment[];
  blockedBy?: Dependency[];
  blocking?: Dependency[];
  customValues?: CustomFieldValue[];
  likes?: TaskLike[];
  followers?: TaskFollower[];
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

export interface CustomFieldValue {
  id: string;
  value?: string | null;
  taskId: string;
  fieldId: string;
  field?: CustomFieldDef;
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
  createdAt: string;
}

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
