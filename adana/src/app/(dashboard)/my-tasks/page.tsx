"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "@/store/app-store";
import type { Task } from "@/types";

// -- Helpers ------------------------------------------------------------------

const priorityColor: Record<string, string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-600 bg-blue-50",
  none: "text-gray-500 bg-gray-50",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type ViewKey = "list" | "board" | "calendar" | "files" | "dashboard";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "list", label: "List" },
  { key: "board", label: "Board" },
  { key: "calendar", label: "Calendar" },
  { key: "files", label: "Files" },
  { key: "dashboard", label: "Dashboard" },
];

// -- Component ----------------------------------------------------------------

export default function MyTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = (searchParams.get("view") || "list") as ViewKey;
  const activeView: ViewKey = VIEWS.some((v) => v.key === viewParam)
    ? viewParam
    : "list";

  const currentUser = useAppStore((s) => s.currentUser);
  const allTasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const attachments = useAppStore((s) => s.attachments);
  const createTask = useAppStore((s) => s.createTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const loading = useAppStore((s) => s.loading);

  const myTasks = useMemo(
    () => allTasks.filter((t) => t.assigneeId === currentUser.id),
    [allTasks, currentUser.id]
  );

  function setView(v: ViewKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.replace(`/my-tasks?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
      </div>

      {/* View tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {VIEWS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${
              activeView === tab.key
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {activeView === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
            )}
          </button>
        ))}
      </div>

      {activeView === "list" && (
        <ListView
          tasks={myTasks}
          onToggleComplete={(id) => toggleTaskComplete(id)}
          onCreate={(title) => createTask({ title, assigneeId: currentUser.id })}
        />
      )}
      {activeView === "board" && (
        <BoardView
          tasks={myTasks}
          onToggleComplete={(id) => toggleTaskComplete(id)}
          onMove={(id, dueDate) => updateTask(id, { dueDate })}
        />
      )}
      {activeView === "calendar" && (
        <CalendarWeekView tasks={myTasks} />
      )}
      {activeView === "files" && (
        <FilesView
          tasks={myTasks}
          attachments={attachments}
          projects={projects}
        />
      )}
      {activeView === "dashboard" && (
        <DashboardView tasks={myTasks} projects={projects} />
      )}
    </div>
  );
}

// -- List view ---------------------------------------------------------------

function ListView({
  tasks,
  onToggleComplete,
  onCreate,
}: {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onCreate: (title: string) => void;
}) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const notCompleted = tasks.filter((t) => !t.completed);

  const recentlyAssigned = notCompleted.filter((t) => {
    const ts = (t.updatedAt || t.createdAt) as string | number | Date | undefined;
    if (!ts) return false;
    return new Date(ts) >= sevenDaysAgo;
  });
  const today = notCompleted.filter(
    (t) => t.dueDate && new Date(t.dueDate) <= todayEnd
  );
  const upcoming = notCompleted.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) > todayEnd &&
      new Date(t.dueDate) <= weekEnd
  );
  const later = notCompleted.filter(
    (t) => !t.dueDate || new Date(t.dueDate) > weekEnd
  );

  const buckets: { key: string; title: string; items: Task[] }[] = [
    { key: "recent", title: "Recently assigned", items: recentlyAssigned },
    { key: "today", title: "Today", items: today },
    { key: "upcoming", title: "Upcoming", items: upcoming },
    { key: "later", title: "Later", items: later },
  ];

  return (
    <div className="space-y-6">
      {buckets.map((b) => (
        <ListSection
          key={b.key}
          title={b.title}
          tasks={b.items}
          onToggleComplete={onToggleComplete}
          onCreate={onCreate}
        />
      ))}
    </div>
  );
}

function ListSection({
  title,
  tasks,
  onToggleComplete,
  onCreate,
}: {
  title: string;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onCreate: (title: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    setAdding(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          {title}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {tasks.length}
          </span>
        </button>
        <button
          onClick={() => setAdding(true)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          + Add task
        </button>
      </div>
      {open && (
        <>
          {adding && (
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-indigo-50/40">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setName("");
                  }
                }}
                placeholder="Task name..."
                className="flex-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <button
                onClick={submit}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setName("");
                }}
                className="rounded px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
          {tasks.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-500">No tasks.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
                >
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
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
                    <p
                      className={`truncate text-sm font-medium ${
                        task.completed ? "text-gray-400 line-through" : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                  {task.priority && task.priority !== "none" && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority] || ""}`}
                    >
                      {task.priority}
                    </span>
                  )}
                  {task.dueDate && (
                    <span
                      className={`shrink-0 text-xs ${
                        !task.completed && isOverdue(task.dueDate)
                          ? "font-medium text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// -- Board view --------------------------------------------------------------

type BoardBucket = "today" | "next_week" | "later" | "done";

function bucketForTask(t: Task): BoardBucket {
  if (t.completed) return "done";
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);
  if (t.dueDate) {
    const d = new Date(t.dueDate);
    if (d <= todayEnd) return "today";
    if (d <= weekEnd) return "next_week";
  }
  return "later";
}

function BoardView({
  tasks,
  onToggleComplete,
  onMove,
}: {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onMove: (id: string, dueDate: string | null) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const columns: { key: BoardBucket; title: string; color: string }[] = [
    { key: "today", title: "Do today", color: "bg-red-50 border-red-200" },
    { key: "next_week", title: "Do next week", color: "bg-amber-50 border-amber-200" },
    { key: "later", title: "Do later", color: "bg-blue-50 border-blue-200" },
    { key: "done", title: "Done", color: "bg-green-50 border-green-200" },
  ];

  function handleDrop(bucket: BoardBucket) {
    if (!draggingId) return;
    const now = new Date();
    let newDue: string | null = null;
    if (bucket === "today") {
      newDue = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0).toISOString();
    } else if (bucket === "next_week") {
      const d = new Date(now.getTime() + 3 * 86400000);
      newDue = d.toISOString();
    } else if (bucket === "later") {
      const d = new Date(now.getTime() + 14 * 86400000);
      newDue = d.toISOString();
    } else if (bucket === "done") {
      const task = tasks.find((t) => t.id === draggingId);
      if (task && !task.completed) onToggleComplete(draggingId);
      setDraggingId(null);
      return;
    }
    onMove(draggingId, newDue);
    setDraggingId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => bucketForTask(t) === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className={`rounded-xl border ${col.color} p-3 min-h-[300px]`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{col.title}</h3>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDraggingId(t.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow transition"
                >
                  <p
                    className={`text-sm font-medium ${
                      t.completed ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {t.title}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {t.priority && t.priority !== "none" && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor[t.priority] || ""}`}
                      >
                        {t.priority}
                      </span>
                    )}
                    {t.dueDate && (
                      <span className="text-[11px] text-gray-500">{formatDate(t.dueDate)}</span>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">Drop tasks here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -- Calendar view (weekly) --------------------------------------------------

function CalendarWeekView({ tasks }: { tasks: Task[] }) {
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = startOfDay(new Date());
    const day = today.getDay();
    return new Date(today.getTime() - day * 86400000);
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    return new Date(weekStart.getTime() + i * 86400000);
  });

  function openTask(taskId: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("adana:open-task", { detail: { taskId } }));
    }
  }

  const weekLabel = `${formatDate(days[0].toISOString())} – ${formatDate(days[6].toISOString())}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setWeekStart(new Date(weekStart.getTime() - 7 * 86400000))
            }
            className="rounded border border-gray-200 bg-white p-1.5 hover:bg-gray-50"
            aria-label="Previous week"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              const today = startOfDay(new Date());
              const day = today.getDay();
              setWeekStart(new Date(today.getTime() - day * 86400000));
            }}
            className="rounded border border-gray-200 bg-white px-3 py-1 text-sm font-medium hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() =>
              setWeekStart(new Date(weekStart.getTime() + 7 * 86400000))
            }
            className="rounded border border-gray-200 bg-white p-1.5 hover:bg-gray-50"
            aria-label="Next week"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const dayTasks = tasks.filter(
            (t) => t.dueDate && sameDay(new Date(t.dueDate), d)
          );
          const today = sameDay(d, new Date());
          return (
            <div
              key={d.toISOString()}
              className={`min-h-[300px] rounded-xl border bg-white p-2 ${
                today ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-200"
              }`}
            >
              <div className="mb-2 border-b border-gray-100 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold ${today ? "text-indigo-600" : "text-gray-900"}`}
                >
                  {d.getDate()}
                </p>
              </div>
              <div className="space-y-1">
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className="block w-full truncate rounded bg-indigo-50 px-2 py-1 text-left text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length === 0 && (
                  <p className="py-2 text-center text-[11px] text-gray-400">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- Files view --------------------------------------------------------------

function FilesView({
  tasks,
  attachments,
  projects,
}: {
  tasks: Task[];
  attachments: { id: string; taskId?: string | null; filename: string; sizeBytes?: number | null; createdAt: string; publicUrl?: string | null }[];
  projects: { id: string; name: string }[];
}) {
  const taskIds = useMemo(() => new Set(tasks.map((t) => t.id)), [tasks]);
  const tasksById = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of tasks) m.set(t.id, t);
    return m;
  }, [tasks]);
  const projectsById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projects) m.set(p.id, p.name);
    return m;
  }, [projects]);

  const files = attachments.filter((a) => a.taskId && taskIds.has(a.taskId));

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-900">No files</p>
        <p className="mt-1 text-sm text-gray-500">
          Attachments on your tasks will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-2.5 text-left font-semibold text-gray-700">Name</th>
            <th className="px-5 py-2.5 text-left font-semibold text-gray-700">Task</th>
            <th className="px-5 py-2.5 text-left font-semibold text-gray-700">Project</th>
            <th className="px-5 py-2.5 text-left font-semibold text-gray-700">Size</th>
            <th className="px-5 py-2.5 text-left font-semibold text-gray-700">Added</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {files.map((f) => {
            const task = f.taskId ? tasksById.get(f.taskId) : null;
            const projectName = task?.projectId ? projectsById.get(task.projectId) : null;
            return (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  {f.publicUrl ? (
                    <a href={f.publicUrl} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">
                      {f.filename}
                    </a>
                  ) : (
                    <span className="font-medium text-gray-900">{f.filename}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-700">{task?.title || "—"}</td>
                <td className="px-5 py-3 text-gray-600">{projectName || "—"}</td>
                <td className="px-5 py-3 text-gray-600">{formatBytes(f.sizeBytes)}</td>
                <td className="px-5 py-3 text-gray-600">{formatDate(f.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// -- Dashboard view ----------------------------------------------------------

function DashboardView({
  tasks,
  projects,
}: {
  tasks: Task[];
  projects: { id: string; name: string; color: string }[];
}) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
  ).length;
  const upcoming = tasks.filter(
    (t) =>
      !t.completed &&
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= weekEnd
  ).length;

  const priorityData = (["high", "medium", "low", "none"] as const).map((p) => ({
    priority: p,
    count: tasks.filter((t) => (t.priority || "none") === p).length,
  }));

  const projectsById = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    for (const p of projects) m.set(p.id, { name: p.name, color: p.color });
    return m;
  }, [projects]);

  const projectCounts = new Map<string, number>();
  for (const t of tasks) {
    const pid = t.projectId || "__none__";
    projectCounts.set(pid, (projectCounts.get(pid) || 0) + 1);
  }
  const projectData = Array.from(projectCounts.entries())
    .map(([pid, count]) => ({
      name: pid === "__none__" ? "No project" : projectsById.get(pid)?.name || "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Tasks completed this week per day
  const weekStart = new Date(todayEnd.getTime() - 6 * 86400000);
  const perDay: { day: string; completed: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.getTime() + i * 86400000);
    const count = tasks.filter(
      (t) => t.completed && t.completedAt && sameDay(new Date(t.completedAt), d)
    ).length;
    perDay.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      completed: count,
    });
  }

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Counter label="Total" value={total} color="bg-gray-100 text-gray-700" />
        <Counter label="Completed" value={completed} color="bg-green-100 text-green-700" />
        <Counter label="Overdue" value={overdue} color="bg-red-100 text-red-700" />
        <Counter label="Upcoming" value={upcoming} color="bg-indigo-100 text-indigo-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Tasks by priority">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="priority" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tasks by project">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completed this week" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded px-2 text-lg font-bold ${color}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className || ""}`}>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}
