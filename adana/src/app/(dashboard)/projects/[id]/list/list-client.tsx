"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import type { Task, Section } from "@/types";

// -- Helpers ------------------------------------------------------------------

const priorityColor: Record<string, string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-600 bg-blue-50",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "overview", label: "Overview" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/projects/${projectId}/${v.key}`}
          className={`relative px-3 py-2.5 text-sm font-medium transition ${
            active === v.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {v.label}
          {active === v.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
          )}
        </Link>
      ))}
    </div>
  );
}

// -- Component ----------------------------------------------------------------

export function ProjectListClient({
  projectId,
  initialSections,
  initialTasks,
}: {
  projectId: string;
  initialSections: Section[];
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sections] = useState<Section[]>(initialSections);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSectionId, setCreateSectionId] = useState<string | null>(null);

  // Group tasks by section
  const tasksBySection: Record<string, Task[]> = {};
  const unsectioned: Task[] = [];
  for (const task of tasks) {
    if (task.sectionId) {
      if (!tasksBySection[task.sectionId]) tasksBySection[task.sectionId] = [];
      tasksBySection[task.sectionId].push(task);
    } else {
      unsectioned.push(task);
    }
  }

  const reloadTasks = useCallback(async () => {
    try {
      const { getTasks } = await import("@/app/actions/task-actions");
      const fresh = await getTasks(projectId);
      if (fresh) setTasks(JSON.parse(JSON.stringify(fresh)));
    } catch {
      // ignore
    }
  }, [projectId]);

  const loadTaskDetail = useCallback(async (taskId: string) => {
    try {
      const { getTask } = await import("@/app/actions/task-actions");
      const task = await getTask(taskId);
      if (task) setSelectedTask(JSON.parse(JSON.stringify(task)));
    } catch {
      // ignore
    }
  }, []);

  async function handleTaskClick(taskId: string) {
    setSelectedTaskId(taskId);
    await loadTaskDetail(taskId);
  }

  async function handleToggleComplete(taskId: string) {
    try {
      const { toggleComplete } = await import("@/app/actions/task-actions");
      await toggleComplete(taskId);
      reloadTasks();
      if (selectedTaskId === taskId) loadTaskDetail(taskId);
    } catch {
      // ignore
    }
  }

  async function handleUpdateTask(taskId: string, updates: Partial<Task>) {
    try {
      const { updateTask } = await import("@/app/actions/task-actions");
      await updateTask(taskId, updates as Parameters<typeof updateTask>[1]);
      reloadTasks();
      if (selectedTaskId === taskId) loadTaskDetail(taskId);
    } catch {
      // ignore
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      const { deleteTask } = await import("@/app/actions/task-actions");
      await deleteTask(taskId);
      setSelectedTaskId(null);
      setSelectedTask(null);
      reloadTasks();
    } catch {
      // ignore
    }
  }

  async function handleDuplicateTask(taskId: string) {
    try {
      const { duplicateTask } = await import("@/app/actions/task-actions");
      await duplicateTask(taskId);
      reloadTasks();
    } catch {
      // ignore
    }
  }

  async function handleAddComment(taskId: string, text: string) {
    try {
      const { addComment } = await import("@/app/actions/comment-actions");
      await addComment(taskId, text);
      loadTaskDetail(taskId);
    } catch {
      // ignore
    }
  }

  async function handleAddSubtask(parentId: string, title: string) {
    try {
      const { addSubtask } = await import("@/app/actions/task-actions");
      await addSubtask(parentId, { title });
      loadTaskDetail(parentId);
      reloadTasks();
    } catch {
      // ignore
    }
  }

  async function handleToggleSubtaskComplete(subtaskId: string) {
    try {
      const { toggleComplete } = await import("@/app/actions/task-actions");
      await toggleComplete(subtaskId);
      if (selectedTaskId) loadTaskDetail(selectedTaskId);
    } catch {
      // ignore
    }
  }

  async function handleToggleLike(taskId: string) {
    try {
      const { toggleTaskLike } = await import("@/app/actions/comment-actions");
      await toggleTaskLike(taskId);
      loadTaskDetail(taskId);
    } catch {
      // ignore
    }
  }

  async function handleToggleFollow(taskId: string) {
    try {
      const { toggleFollowTask } = await import("@/app/actions/comment-actions");
      await toggleFollowTask(taskId);
      loadTaskDetail(taskId);
    } catch {
      // ignore
    }
  }

  async function handleSetApprovalStatus(taskId: string, status: string) {
    try {
      const { setApprovalStatus } = await import("@/app/actions/task-actions");
      await setApprovalStatus(taskId, status as "pending" | "approved" | "changes_requested" | "rejected");
      loadTaskDetail(taskId);
      reloadTasks();
    } catch {
      // ignore
    }
  }

  async function handleCreateTask(data: { name: string; description: string; assigneeId: string | null; dueDate: string | null; priority: string; sectionId: string | null; tagIds: string[] }) {
    try {
      const { createTask } = await import("@/app/actions/task-actions");
      await createTask({
        title: data.name,
        description: data.description || undefined,
        projectId,
        sectionId: data.sectionId || undefined,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
        priority: data.priority || undefined,
      });
      reloadTasks();
    } catch {
      // ignore
    }
  }

  function renderTaskRow(task: Task) {
    return (
      <div
        key={task.id}
        onClick={() => handleTaskClick(task.id)}
        className={`flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
          selectedTaskId === task.id ? "bg-indigo-50/50" : ""
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleComplete(task.id);
          }}
          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            task.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {task.completed && (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
            {task.title}
          </p>
        </div>
        {task.assignee && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
            {(task.assignee.name || "?")[0].toUpperCase()}
          </div>
        )}
        {task.priority && task.priority !== "none" && (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority] || ""}`}>
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="shrink-0 text-xs text-gray-500">
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="list" />

      <div className="flex flex-1 overflow-hidden">
        {/* Main list */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <button
                onClick={() => {
                  setCreateSectionId(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Unsectioned tasks */}
              {unsectioned.length > 0 && (
                <div>
                  {unsectioned.map(renderTaskRow)}
                </div>
              )}

              {/* Sectioned tasks */}
              {sections.map((section) => {
                const sectionTasks = tasksBySection[section.id] || [];
                return (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-2">
                      <h3 className="text-sm font-semibold text-gray-700">{section.name}</h3>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                        {sectionTasks.length}
                      </span>
                      <button
                        onClick={() => {
                          setCreateSectionId(section.id);
                          setShowCreateModal(true);
                        }}
                        className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {sectionTasks.map(renderTaskRow)}
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-500">No tasks yet. Create one to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedTask && (
          <div className="w-[420px] shrink-0 border-l border-gray-200 overflow-auto">
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => {
                setSelectedTaskId(null);
                setSelectedTask(null);
              }}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              onDuplicate={handleDuplicateTask}
              onToggleComplete={handleToggleComplete}
              onAddComment={handleAddComment}
              onAddSubtask={handleAddSubtask}
              onToggleSubtaskComplete={handleToggleSubtaskComplete}
              onToggleLike={handleToggleLike}
              onToggleFollow={handleToggleFollow}
              onSetApprovalStatus={handleSetApprovalStatus}
            />
          </div>
        )}
      </div>

      {/* Create task modal */}
      <CreateTaskModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTask}
        sections={sections}
        defaultSectionId={createSectionId}
      />
    </div>
  );
}
