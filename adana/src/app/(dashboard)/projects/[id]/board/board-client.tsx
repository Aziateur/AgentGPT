"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types for DB-shaped data
// ---------------------------------------------------------------------------

interface DbSection {
  id: string;
  name: string;
  position: number;
  projectId: string;
  _count?: { tasks: number };
  [key: string]: unknown;
}

interface DbTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  sectionId?: string | null;
  position: number;
  assignee?: { id: string; name: string; avatar: string | null } | null;
  _count?: { subtasks: number; comments: number; likes: number };
  tags?: { tag: { id: string; name: string; color: string } }[];
  [key: string]: unknown;
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardPageClient({
  projectId,
  initialSections,
  initialTasks,
}: {
  projectId: string;
  initialSections: DbSection[];
  initialTasks: DbTask[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sections, setSections] = useState<DbSection[]>(initialSections);
  const [tasks, setTasks] = useState<DbTask[]>(initialTasks);
  const [addingTaskInSection, setAddingTaskInSection] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  // Group tasks by section
  const tasksBySection: Record<string, DbTask[]> = {};
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
    (sectionId: string) => {
      if (!newTaskName.trim()) {
        setAddingTaskInSection(null);
        return;
      }
      const name = newTaskName.trim();
      setNewTaskName("");
      setAddingTaskInSection(null);

      // Client-side only for demo
      const newTask: DbTask = {
        id: `task-${Date.now()}`,
        title: name,
        completed: false,
        priority: "none",
        sectionId,
        position: (tasksBySection[sectionId]?.length ?? 0) + 1,
      };
      setTasks((prev) => [...prev, newTask]);
    },
    [newTaskName, tasksBySection]
  );

  const handleAddSection = useCallback(() => {
    const name = prompt("Section name:");
    if (!name?.trim()) return;

    // Client-side only for demo
    const newSection: DbSection = {
      id: `section-${Date.now()}`,
      name: name.trim(),
      position: sections.length + 1,
      projectId,
    };
    setSections((prev) => [...prev, newSection]);
  }, [projectId, sections.length]);

  // Simple HTML5 drag and drop for moving tasks between sections
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    setDragOverSectionId(sectionId);
  };

  const handleDrop = (sectionId: string) => {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.sectionId === sectionId) {
      setDraggedTaskId(null);
      setDragOverSectionId(null);
      return;
    }

    // Client-side only
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTaskId ? { ...t, sectionId } : t
      )
    );
    setDraggedTaskId(null);
    setDragOverSectionId(null);
  };

  const handleToggleComplete = (taskId: string) => {
    // Client-side only
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  };

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="board" />

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {sections.map((col, idx) => {
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
                  {colTasks.map((task) => (
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
                        <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority ?? "none"]}`} />
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
                        {(task._count?.comments ?? 0) > 0 && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs text-gray-400">
                              {task._count?.comments}
                              <svg className="ml-0.5 inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </span>
                          </>
                        )}
                        <span className="ml-auto" />
                        {task.assignee && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                            {task.assignee.name?.[0] ?? "?"}
                          </div>
                        )}
                      </div>
                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((tt: any) => {
                            const tag = tt.tag || tt; // Fallback for raw tag object
                            return (
                              <span
                                key={tag.id}
                                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

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
