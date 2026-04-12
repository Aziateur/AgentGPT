"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import type { Task, Section } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
  none: "bg-gray-300",
};

const columnColors = [
  "bg-gray-400",
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
];

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "overview", label: "Overview" },
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "workload", label: "Workload" },
    { key: "note", label: "Note" },
    { key: "files", label: "Files" },
    { key: "dashboard", label: "Dashboard" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/project/${v.key}?id=${projectId}`}
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectBoardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("id") as string;

  const {
    getProjectTasks,
    getProjectSections,
    createTask,
    createSection,
    updateTask,
    toggleTaskComplete,
    users,
  } = useAppStore();

  const sections = getProjectSections(projectId);
  const tasks = getProjectTasks(projectId);

  const [addingTaskInSection, setAddingTaskInSection] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  // Group tasks by section
  const tasksBySection: Record<string, Task[]> = {};
  for (const sec of sections) {
    tasksBySection[sec.id] = [];
  }
  for (const task of tasks) {
    if (task.sectionId && tasksBySection[task.sectionId]) {
      tasksBySection[task.sectionId].push(task);
    }
  }
  // Sort by position
  for (const key of Object.keys(tasksBySection)) {
    tasksBySection[key].sort((a, b) => a.position - b.position);
  }

  const handleAddTask = useCallback(
    async (sectionId: string) => {
      if (!newTaskName.trim()) {
        setAddingTaskInSection(null);
        return;
      }
      const name = newTaskName.trim();
      setNewTaskName("");
      setAddingTaskInSection(null);

      await createTask({
        title: name,
        projectId,
        sectionId,
      });
    },
    [newTaskName, projectId, createTask]
  );

  const handleAddSection = useCallback(async () => {
    const name = prompt("Section name:");
    if (!name?.trim()) return;
    await createSection({ name: name.trim(), projectId });
  }, [projectId, createSection]);

  // HTML5 drag and drop for moving tasks between sections
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    setDragOverSectionId(sectionId);
  };

  const handleDrop = async (sectionId: string) => {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.sectionId === sectionId) {
      setDraggedTaskId(null);
      setDragOverSectionId(null);
      return;
    }

    setDraggedTaskId(null);
    setDragOverSectionId(null);

    await updateTask(draggedTaskId, { sectionId });
  };

  const handleToggleComplete = async (taskId: string) => {
    await toggleTaskComplete(taskId);
  };

  function getAssigneeName(assigneeId: string | null): string | null {
    if (!assigneeId) return null;
    return users.find((u) => u.id === assigneeId)?.name ?? null;
  }

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="board" />

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {sections.map((col: Section, idx: number) => {
            const colTasks = tasksBySection[col.id] ?? [];
            const colorClass = columnColors[idx % columnColors.length];

            return (
              <div
                key={col.id}
                className={`w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50 ${
                  dragOverSectionId === col.id ? "ring-2 ring-indigo-300" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverSectionId(null)}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {col.name}
                  </h3>
                  <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 px-3 pb-3">
                  {colTasks.map((task: Task) => {
                    const assigneeName = getAssigneeName(task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md ${
                          task.completed ? "opacity-60" : ""
                        } ${draggedTaskId === task.id ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(task.id);
                            }}
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              task.completed
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {task.completed && (
                              <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <p className={`text-sm font-medium text-gray-900 ${task.completed ? "line-through" : ""}`}>
                            {task.title}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority ?? "none"] ?? priorityDot.none}`} />
                          <span className="text-xs capitalize text-gray-500">
                            {task.priority || "none"}
                          </span>
                          {task.dueDate && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="text-xs text-gray-500">
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </>
                          )}
                          <span className="ml-auto" />
                          {assigneeName && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                              {assigneeName[0] ?? "?"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add task input */}
                  {addingTaskInSection === col.id ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTask(col.id);
                          if (e.key === "Escape") {
                            setAddingTaskInSection(null);
                            setNewTaskName("");
                          }
                        }}
                        onBlur={() => handleAddTask(col.id)}
                        autoFocus
                        placeholder="Task name..."
                        className="w-full text-sm outline-none placeholder:text-gray-400"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTaskInSection(col.id)}
                      className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add task
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add column */}
          <button
            onClick={handleAddSection}
            className="flex h-fit w-72 shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-gray-400 transition hover:border-gray-300 hover:text-gray-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add section
          </button>
        </div>
      </div>
    </div>
  );
}
