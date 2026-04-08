"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";
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

export default function ProjectListPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const {
    getProjectTasks,
    getProjectSections,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    createTask,
    users,
  } = useAppStore();

  const tasks = getProjectTasks(projectId);
  const sections = getProjectSections(projectId);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSectionId, setCreateSectionId] = useState<string | null>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

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

  async function handleToggleComplete(taskId: string) {
    await toggleTaskComplete(taskId);
  }

  async function handleUpdateTask(taskId: string, updates: Partial<Task>) {
    await updateTask(taskId, updates);
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTask(taskId);
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  }

  async function handleDuplicateTask(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await createTask({
      title: `${task.title} (copy)`,
      description: task.description ?? undefined,
      projectId: task.projectId ?? undefined,
      sectionId: task.sectionId ?? undefined,
      assigneeId: task.assigneeId ?? undefined,
      dueDate: task.dueDate ?? undefined,
      priority: task.priority ?? undefined,
    });
  }

  async function handleCreateTask(data: {
    name: string;
    description: string;
    assigneeId: string | null;
    dueDate: string | null;
    priority: string;
    sectionId: string | null;
    tagIds: string[];
  }) {
    await createTask({
      title: data.name,
      description: data.description || undefined,
      projectId,
      sectionId: data.sectionId || undefined,
      assigneeId: data.assigneeId || undefined,
      dueDate: data.dueDate || undefined,
      priority: data.priority || undefined,
    });
  }

  // Stub handlers for detail panel features not yet wired in the store
  async function handleAddComment(_taskId: string, _text: string) {}
  async function handleAddSubtask(parentId: string, title: string) {
    await createTask({ title, projectId, parentId });
  }
  async function handleToggleSubtaskComplete(subtaskId: string) {
    await toggleTaskComplete(subtaskId);
  }
  async function handleToggleLike(_taskId: string) {}
  async function handleToggleFollow(_taskId: string) {}
  async function handleSetApprovalStatus(taskId: string, status: string) {
    await updateTask(taskId, { approvalStatus: status as Task["approvalStatus"] });
  }

  function getAssignee(assigneeId: string | null) {
    if (!assigneeId) return null;
    return users.find((u) => u.id === assigneeId) ?? null;
  }

  function renderTaskRow(task: Task) {
    const assignee = getAssignee(task.assigneeId);
    return (
      <div
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        className={`flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
          selectedTaskId === task.id ? "bg-indigo-50/50" : ""
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleComplete(task.id);
          }}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
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
        {assignee && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
            {(assignee.name || "?")[0].toUpperCase()}
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

  // Build enriched selectedTask with assignee for the detail panel
  const enrichedSelectedTask = selectedTask
    ? {
        ...selectedTask,
        assignee: getAssignee(selectedTask.assigneeId)
          ? {
              id: selectedTask.assigneeId!,
              name: getAssignee(selectedTask.assigneeId)!.name,
              avatar: getAssignee(selectedTask.assigneeId)!.avatar ?? null,
            }
          : null,
      }
    : null;

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
              {sections.map((section: Section) => {
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
        {enrichedSelectedTask && (
          <div className="w-[420px] shrink-0 border-l border-gray-200 overflow-auto">
            <TaskDetailPanel
              task={enrichedSelectedTask as Task & { assignee?: { id: string; name: string; avatar: string | null } | null }}
              onClose={() => setSelectedTaskId(null)}
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
