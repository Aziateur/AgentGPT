import { useAppStore } from "@/store/app-store";
import type { Task, AutomationRuleExt } from "@/types";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type RuleEventType =
  | "task_created"
  | "task_completed"
  | "task_moved" // sectionId changed
  | "assignee_changed"
  | "custom_field_changed"
  | "due_date_approaching"
  | "comment_added"
  | "form_submitted";

export interface RuleEvent {
  type: RuleEventType;
  taskId?: string;
  projectId?: string | null;
  userId?: string | null;
  before?: any;
  after?: any;
  payload?: any;
}

type ActionSpec = { type: string; config?: any; condition?: any };

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getTask(taskId: string | undefined | null): Task | null {
  if (!taskId) return null;
  const state = useAppStore.getState();
  return state.tasks.find((t) => t.id === taskId) ?? null;
}

function ruleMatchesScope(rule: AutomationRuleExt, event: RuleEvent): boolean {
  // Workspace rules always fire
  if (rule.scope === "workspace") return true;

  // Project rules: must match the event's project
  if (rule.scope === "project") {
    if (!rule.projectId) return false;
    if (!event.projectId) return false;
    return rule.projectId === event.projectId;
  }

  // My-tasks rules: must match the event's user
  if (rule.scope === "my_tasks") {
    if (!rule.userId) return false;
    if (!event.userId) return false;
    return rule.userId === event.userId;
  }

  return false;
}

function getTaskField(task: Task | null, field: string, event: RuleEvent): unknown {
  if (!task) {
    // Fall back to event payload for form_submitted etc.
    if (event.payload && typeof event.payload === "object" && field in event.payload) {
      return (event.payload as any)[field];
    }
    return undefined;
  }
  return (task as any)[field];
}

// ----------------------------------------------------------------------------
// Condition evaluation
// ----------------------------------------------------------------------------

export function evaluateCondition(
  condition: any,
  task: Task | null,
  event: RuleEvent
): boolean {
  // No condition -> always true
  if (!condition || typeof condition !== "object") return true;
  const { field, operator, value } = condition as {
    field?: string;
    operator?: string;
    value?: unknown;
  };
  if (!field || !operator) return true;

  const actual = getTaskField(task, field, event);

  switch (operator) {
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "gt":
      return typeof actual === "number" && typeof value === "number" && actual > value;
    case "lt":
      return typeof actual === "number" && typeof value === "number" && actual < value;
    case "contains": {
      if (Array.isArray(actual)) return actual.includes(value as any);
      if (typeof actual === "string" && typeof value === "string") {
        return actual.includes(value);
      }
      return false;
    }
    default:
      return true;
  }
}

// ----------------------------------------------------------------------------
// Action execution
// ----------------------------------------------------------------------------

export async function executeAction(
  action: ActionSpec,
  task: Task | null,
  event: RuleEvent
): Promise<void> {
  const store = useAppStore.getState();
  const config = action.config || {};
  const taskId = task?.id ?? event.taskId;

  switch (action.type) {
    case "assign": {
      if (!taskId || !config.userId) return;
      await store.updateTask(taskId, { assigneeId: config.userId });
      return;
    }
    case "move_section": {
      if (!taskId || !config.sectionId) return;
      await store.updateTask(taskId, { sectionId: config.sectionId });
      return;
    }
    case "set_priority": {
      if (!taskId || !config.priority) return;
      await store.updateTask(taskId, { priority: config.priority });
      return;
    }
    case "set_due_date": {
      if (!taskId) return;
      let dueDate: string | null = null;
      if (typeof config.date === "string") {
        dueDate = config.date;
      } else if (typeof config.offsetDays === "number") {
        const d = new Date();
        d.setDate(d.getDate() + config.offsetDays);
        dueDate = d.toISOString();
      }
      if (!dueDate) return;
      await store.updateTask(taskId, { dueDate });
      return;
    }
    case "set_field": {
      if (!taskId || !config.fieldId) return;
      await store.setCustomFieldValue(taskId, config.fieldId, config.value ?? {});
      return;
    }
    case "add_tag": {
      if (!taskId || !config.tagId) return;
      await store.addTagToTask(taskId, config.tagId);
      return;
    }
    case "complete": {
      if (!taskId) return;
      await store.updateTask(taskId, {
        completed: true,
        completedAt: new Date().toISOString(),
      });
      return;
    }
    case "add_subtask": {
      if (!taskId) return;
      const parent = task ?? getTask(taskId);
      await store.createTask({
        title: config.title || "New subtask",
        parentId: taskId,
        projectId: parent?.projectId ?? undefined,
      });
      return;
    }
    case "notify": {
      if (!config.userId) return;
      await store.createNotification({
        userId: config.userId,
        type: "rule_notify",
        title: config.title || "Rule notification",
        message: config.message,
        taskId: taskId ?? null,
      });
      return;
    }
    case "add_comment": {
      // Not implemented in store yet; log but don't fail
      return;
    }
    default:
      return;
  }
}

// ----------------------------------------------------------------------------
// Main entry: run all matching rules for an event
// ----------------------------------------------------------------------------

export async function runMatchingRules(event: RuleEvent): Promise<void> {
  const state = useAppStore.getState();
  const rules = state.rules.filter(
    (r) => r.enabled && r.triggerType === event.type
  );

  const task = getTask(event.taskId);

  for (const rule of rules) {
    if (!ruleMatchesScope(rule, event)) continue;

    const actions: ActionSpec[] = Array.isArray(rule.actions) ? rule.actions : [];
    let executedCount = 0;
    let skippedCount = 0;
    let failed = false;
    let errorMessage = "";

    for (const action of actions) {
      try {
        if (!evaluateCondition(action.condition, task, event)) {
          skippedCount++;
          continue;
        }
        await executeAction(action, task, event);
        executedCount++;
      } catch (err) {
        failed = true;
        errorMessage =
          err instanceof Error ? err.message : String(err);
        console.error(
          `Rule "${rule.name}" action "${action.type}" failed:`,
          err
        );
        break;
      }
    }

    const status: "success" | "failed" | "skipped" = failed
      ? "failed"
      : executedCount === 0 && skippedCount > 0
      ? "skipped"
      : "success";
    const log = failed
      ? `Error: ${errorMessage}`
      : `Executed ${executedCount} action(s), skipped ${skippedCount}`;

    try {
      await useAppStore
        .getState()
        .logRuleExecution(rule.id, event.taskId ?? null, status, log);
    } catch (err) {
      console.error("Failed to log rule execution:", err);
    }
  }
}
