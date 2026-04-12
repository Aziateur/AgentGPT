import { useAppStore } from "@/store/app-store";
import type { Task } from "@/types";
import { runMatchingRules, type RuleEvent } from "./engine";

// ----------------------------------------------------------------------------
// Public helper: emit a rule event manually from any caller.
// ----------------------------------------------------------------------------

export function emitRuleEvent(event: RuleEvent): void {
  runMatchingRules(event).catch((err) => {
    console.error("Rule engine error:", err);
  });
}

// ----------------------------------------------------------------------------
// Store subscription: automatically emits synthetic events by diffing state.
// ----------------------------------------------------------------------------

let installed = false;
let unsubscribe: (() => void) | null = null;

function diffTasks(
  prev: Task[] | undefined,
  next: Task[] | undefined
): RuleEvent[] {
  const events: RuleEvent[] = [];
  if (!next) return events;
  const prevById = new Map<string, Task>();
  if (prev) for (const t of prev) prevById.set(t.id, t);

  const currentUserId = useAppStore.getState().currentUser?.id ?? null;

  for (const task of next) {
    const before = prevById.get(task.id);

    if (!before) {
      // New task
      events.push({
        type: "task_created",
        taskId: task.id,
        projectId: task.projectId ?? null,
        userId: task.assigneeId ?? currentUserId,
        after: task,
      });
      continue;
    }

    // Completion: false -> true
    if (!before.completed && task.completed) {
      events.push({
        type: "task_completed",
        taskId: task.id,
        projectId: task.projectId ?? null,
        userId: task.assigneeId ?? currentUserId,
        before,
        after: task,
      });
    }

    // Section moved
    if (before.sectionId !== task.sectionId) {
      events.push({
        type: "task_moved",
        taskId: task.id,
        projectId: task.projectId ?? null,
        userId: task.assigneeId ?? currentUserId,
        before,
        after: task,
      });
    }

    // Assignee changed
    if (before.assigneeId !== task.assigneeId) {
      events.push({
        type: "assignee_changed",
        taskId: task.id,
        projectId: task.projectId ?? null,
        userId: task.assigneeId ?? currentUserId,
        before,
        after: task,
      });
    }
  }

  return events;
}

/**
 * Install the rule engine store subscriber. Call once from a client-side
 * top-level component (e.g. the dashboard layout) inside a `useEffect`.
 * Returns a cleanup function that removes the subscription.
 */
export function installRuleEngine(): () => void {
  if (installed && unsubscribe) return unsubscribe;
  installed = true;

  let prevTasks: Task[] = useAppStore.getState().tasks;

  unsubscribe = useAppStore.subscribe((state) => {
    const nextTasks = state.tasks;
    if (nextTasks === prevTasks) return;
    const events = diffTasks(prevTasks, nextTasks);
    prevTasks = nextTasks;
    for (const ev of events) {
      runMatchingRules(ev).catch((err) =>
        console.error("Rule engine error:", err)
      );
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    installed = false;
  };
}
