"use client";

import { Suspense, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { useTaskDetailPanel } from "@/hooks/use-task-detail-panel";
import type { Task } from "@/types";

// ---------------------------------------------------------------------------
// Global host that renders the task detail drawer once at the dashboard
// layout level. Listens to the shared `useTaskDetailPanel` store so any
// component can open the panel by calling `openTask(id)`.
//
// Slides in from the right; ESC closes. Backed by the existing
// `<TaskDetailPanel>` so all behavior is shared with list-view.
// ---------------------------------------------------------------------------

function TaskDetailHostInner() {
  const { selectedTaskId, closeTask } = useTaskDetailPanel();

  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const createTask = useAppStore((s) => s.createTask);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const createComment = useAppStore((s) => s.createComment);
  const toggleTaskLike = useAppStore((s) => s.toggleTaskLike);
  const toggleTaskFollower = useAppStore((s) => s.toggleTaskFollower);

  // ESC closes the drawer.
  useEffect(() => {
    if (!selectedTaskId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeTask();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTaskId, closeTask]);

  const task = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  // -- Handlers (mirror list-view) --

  async function handleUpdate(taskId: string, updates: Partial<Task>) {
    await updateTask(taskId, updates);
  }

  async function handleDelete(taskId: string) {
    await deleteTask(taskId);
    closeTask();
  }

  async function handleDuplicate(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    await createTask({
      title: `${t.title} (copy)`,
      description: t.description ?? undefined,
      projectId: t.projectId ?? undefined,
      sectionId: t.sectionId ?? undefined,
      assigneeId: t.assigneeId ?? undefined,
      dueDate: t.dueDate ?? undefined,
      priority: t.priority ?? undefined,
    });
  }

  async function handleToggleComplete(taskId: string) {
    await toggleTaskComplete(taskId);
  }

  async function handleAddSubtask(parentId: string, title: string) {
    const parent = tasks.find((t) => t.id === parentId);
    await createTask({
      title,
      projectId: parent?.projectId ?? undefined,
      parentId,
    });
  }

  async function handleToggleSubtaskComplete(subtaskId: string) {
    await toggleTaskComplete(subtaskId);
  }

  async function handleSetApprovalStatus(taskId: string, status: string) {
    await updateTask(taskId, { approvalStatus: status as Task["approvalStatus"] });
  }

  async function handleAddComment(taskId: string, text: string) {
    if (!text.trim()) return;
    await createComment(taskId, text.trim());
  }
  async function handleToggleLike(taskId: string) {
    await toggleTaskLike(taskId);
  }
  async function handleToggleFollow(taskId: string) {
    await toggleTaskFollower(taskId);
  }

  // Build enriched task with assignee for the panel UI.
  const enrichedTask = task
    ? {
        ...task,
        assignee: task.assigneeId
          ? (() => {
              const u = users.find((x) => x.id === task.assigneeId);
              return u
                ? { id: u.id, name: u.name, avatar: u.avatar ?? null }
                : null;
            })()
          : null,
      }
    : null;

  const open = !!enrichedTask;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeTask}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[420px] max-w-full transform bg-white shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {enrichedTask && (
          <TaskDetailPanel
            task={
              enrichedTask as Task & {
                assignee?: { id: string; name: string; avatar: string | null } | null;
              }
            }
            onClose={closeTask}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onToggleComplete={handleToggleComplete}
            onAddComment={handleAddComment}
            onAddSubtask={handleAddSubtask}
            onToggleSubtaskComplete={handleToggleSubtaskComplete}
            onToggleLike={handleToggleLike}
            onToggleFollow={handleToggleFollow}
            onSetApprovalStatus={handleSetApprovalStatus}
          />
        )}
      </div>
    </>
  );
}

export function TaskDetailHost() {
  // useSearchParams (used inside the hook) requires a Suspense boundary
  // when consumed from a layout under a static export.
  return (
    <Suspense fallback={null}>
      <TaskDetailHostInner />
    </Suspense>
  );
}
