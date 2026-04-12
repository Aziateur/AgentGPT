"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, X, Settings, GripVertical } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { Task, Project } from "@/types";

type WidgetType = "my-tasks" | "projects" | "goals" | "notepad" | "activity" | "milestones";
type Period = "week" | "month" | "year";

interface HomeWidget {
  id: string;
  type: WidgetType;
  title: string;
}

const DEFAULT_WIDGETS: HomeWidget[] = [
  { id: "w-mytasks", type: "my-tasks", title: "My tasks" },
  { id: "w-projects", type: "projects", title: "Projects" },
  { id: "w-goals", type: "goals", title: "Goals" },
  { id: "w-notepad", type: "notepad", title: "Private notepad" },
];

const PALETTE: { type: WidgetType; title: string; desc: string }[] = [
  { type: "my-tasks", title: "My tasks", desc: "Upcoming / Overdue / Completed" },
  { type: "projects", title: "Projects", desc: "Recent projects" },
  { type: "goals", title: "Goals", desc: "Your goals and progress" },
  { type: "notepad", title: "Private notepad", desc: "Saved locally in your browser" },
  { type: "activity", title: "Recent activity", desc: "Latest task updates" },
  { type: "milestones", title: "Upcoming milestones", desc: "Next key dates" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function periodStart(period: Period): Date {
  const d = new Date();
  if (period === "week") {
    const dow = d.getDay();
    d.setDate(d.getDate() - dow);
  } else if (period === "month") {
    d.setDate(1);
  } else {
    d.setMonth(0, 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

const ORDER_KEY = "adana:home-widget-order";

function loadWidgets(): HomeWidget[] {
  let widgets: HomeWidget[] | null = null;
  try {
    const raw = localStorage.getItem("adana:home-widgets");
    if (raw) {
      const parsed = JSON.parse(raw) as HomeWidget[];
      if (Array.isArray(parsed) && parsed.every((w) => w && w.type && w.id)) {
        widgets = parsed;
      }
    }
  } catch {}
  if (!widgets) widgets = DEFAULT_WIDGETS;

  // Apply saved order from ORDER_KEY (array of widget keys/types)
  try {
    const orderRaw = localStorage.getItem(ORDER_KEY);
    if (orderRaw) {
      const order = JSON.parse(orderRaw) as string[];
      if (Array.isArray(order) && order.length > 0) {
        const byType = new Map<string, HomeWidget[]>();
        for (const w of widgets) {
          const arr = byType.get(w.type) ?? [];
          arr.push(w);
          byType.set(w.type, arr);
        }
        const ordered: HomeWidget[] = [];
        for (const key of order) {
          const bucket = byType.get(key);
          if (bucket && bucket.length > 0) ordered.push(bucket.shift()!);
        }
        // Append any remaining widgets not mentioned in order
        byType.forEach((arr) => ordered.push(...arr));
        if (ordered.length === widgets.length) widgets = ordered;
      }
    }
  } catch {}
  return widgets;
}

function saveOrder(widgets: HomeWidget[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(widgets.map((w) => w.type)));
  } catch {}
}

export default function HomePage() {
  const store = useAppStore();
  const { initialized, loading, currentUser, tasks, goalsExt } = store;
  const getVisibleProjects = (store as any).getVisibleProjects as undefined | (() => Project[]);
  const projects = getVisibleProjects ? getVisibleProjects() : store.projects;
  const projectMembers = (store as any).projectMembers as { projectId: string; userId: string }[] | undefined;

  const [widgets, setWidgets] = useState<HomeWidget[]>(DEFAULT_WIDGETS);
  const [customizing, setCustomizing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("week");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWidgets(loadWidgets());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("adana:home-widgets", JSON.stringify(widgets));
    } catch {}
    saveOrder(widgets);
  }, [widgets, hydrated]);

  // Drag-reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
  };
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) setDragOverIndex(index);
  };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    if (from == null || from === index) return;
    setWidgets((ws) => {
      const next = [...ws];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const removeWidget = (id: string) => setWidgets((ws) => ws.filter((w) => w.id !== id));
  const addWidget = (type: WidgetType) => {
    const meta = PALETTE.find((p) => p.type === type)!;
    setWidgets((ws) => [...ws, { id: `w-${type}-${Date.now()}`, type, title: meta.title }]);
    setPaletteOpen(false);
  };

  // Period stats
  const stats = useMemo(() => {
    const start = periodStart(period);
    const userId = currentUser?.id;
    const allTasks = tasks as Task[];
    const completed = allTasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt) >= start
    ).length;

    // Collaborators: distinct users in projects the user is also in
    let collaborators = 0;
    if (userId && projectMembers && projectMembers.length > 0) {
      const myProjects = new Set(
        projectMembers.filter((m) => m.userId === userId).map((m) => m.projectId)
      );
      // Include projects owned by the user
      for (const p of projects as Project[]) {
        if ((p as any).creatorId === userId) myProjects.add(p.id);
      }
      const distinct = new Set<string>();
      for (const m of projectMembers) {
        if (m.userId !== userId && myProjects.has(m.projectId)) distinct.add(m.userId);
      }
      collaborators = distinct.size;
    }
    return { completed, collaborators };
  }, [tasks, period, currentUser, projectMembers, projects]);

  if (!initialized || loading || !hydrated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const user = currentUser ?? { id: "demo", name: "Demo User", email: "demo@adana.dev" };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {(user.name as string).split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.completed} task{stats.completed === 1 ? "" : "s"} completed
            {" · "}
            {stats.collaborators} collaborator{stats.collaborators === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700"
          >
            <option value="week">My week</option>
            <option value="month">My month</option>
            <option value="year">My year</option>
          </select>
          <button
            onClick={() => setCustomizing((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              customizing
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            {customizing ? "Done" : "Customize"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {widgets.map((w, i) => (
          <div
            key={w.id}
            draggable
            onDragStart={handleDragStart(i)}
            onDragOver={handleDragOver(i)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(i)}
            onDragEnd={handleDragEnd}
            className={`transition-all ${
              dragIndex === i ? "opacity-40" : ""
            } ${dragOverIndex === i && dragIndex !== i ? "ring-2 ring-indigo-400 ring-offset-2 rounded-xl" : ""}`}
          >
            <WidgetShell widget={w} editing={customizing} onRemove={() => removeWidget(w.id)}>
              <WidgetBody widget={w} tasks={tasks as Task[]} projects={projects as Project[]} goals={goalsExt as any[]} currentUserId={currentUser?.id ?? null} />
            </WidgetShell>
          </div>
        ))}
        {customizing && (
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-8 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
          >
            <Plus className="h-5 w-5" />
            Add widget
          </button>
        )}
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Add a widget</h3>
              <button onClick={() => setPaletteOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {PALETTE.map((p) => (
                <li key={p.type}>
                  <button
                    onClick={() => addWidget(p.type)}
                    className="flex w-full flex-col items-start rounded-md px-3 py-2.5 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-900">{p.title}</span>
                    <span className="text-xs text-gray-500">{p.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Shell ----------------

function WidgetShell({
  widget,
  editing,
  onRemove,
  children,
}: {
  widget: HomeWidget;
  editing: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-4 w-4 cursor-grab text-gray-300 active:cursor-grabbing" />
          <h2 className="text-sm font-semibold text-gray-900">{widget.title}</h2>
        </div>
        {editing && (
          <button
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

// ---------------- Widget bodies ----------------

function WidgetBody({
  widget,
  tasks,
  projects,
  goals,
  currentUserId,
}: {
  widget: HomeWidget;
  tasks: Task[];
  projects: Project[];
  goals: { id: string; name: string; status?: string; metricCurrent?: number; metricTarget?: number | null }[];
  currentUserId: string | null;
}) {
  switch (widget.type) {
    case "my-tasks":
      return <MyTasksWidget tasks={tasks} currentUserId={currentUserId} />;
    case "projects":
      return <ProjectsWidget projects={projects} />;
    case "goals":
      return <GoalsWidget goals={goals} />;
    case "notepad":
      return <NotepadWidget />;
    case "activity":
      return <ActivityWidget tasks={tasks} />;
    case "milestones":
      return <MilestonesWidget tasks={tasks} />;
  }
}

function MyTasksWidget({ tasks, currentUserId }: { tasks: Task[]; currentUserId: string | null }) {
  const [tab, setTab] = useState<"upcoming" | "overdue" | "completed">("upcoming");
  const now = new Date();
  const mine = tasks.filter((t) => !currentUserId || t.assigneeId === currentUserId);

  const upcoming = mine
    .filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  const overdue = mine.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now);
  const completed = mine.filter((t) => t.completed);

  const list = tab === "upcoming" ? upcoming : tab === "overdue" ? overdue : completed;

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-100 px-2">
        {(["upcoming", "overdue", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
              tab === t ? "border-b-2 border-indigo-600 text-indigo-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t} ({t === "upcoming" ? upcoming.length : t === "overdue" ? overdue.length : completed.length})
          </button>
        ))}
      </div>
      <ul className="divide-y divide-gray-50">
        {list.slice(0, 5).map((task) => (
          <li key={task.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${task.completed ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="flex-1 truncate text-gray-800">{task.title}</span>
            {task.dueDate && (
              <span className="text-xs text-gray-400">
                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-gray-400">No tasks here.</li>
        )}
      </ul>
      <div className="border-t border-gray-50 px-3 py-2 text-right">
        <Link href="/my-tasks" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          View all
        </Link>
      </div>
    </div>
  );
}

function ProjectsWidget({ projects }: { projects: Project[] }) {
  return (
    <div>
      <ul className="divide-y divide-gray-50">
        {projects.slice(0, 5).map((p) => (
          <li key={p.id}>
            <Link href="/projects" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: (p as any).color || "#6366f1" }} />
              <span className="flex-1 truncate text-gray-800">{p.name}</span>
            </Link>
          </li>
        ))}
        {projects.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-gray-400">No projects yet.</li>
        )}
      </ul>
      <div className="border-t border-gray-50 px-3 py-2 text-right">
        <Link href="/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          View all
        </Link>
      </div>
    </div>
  );
}

function GoalsWidget({
  goals,
}: {
  goals: { id: string; name: string; status?: string; metricCurrent?: number; metricTarget?: number | null }[];
}) {
  return (
    <div>
      <ul className="divide-y divide-gray-50">
        {goals.slice(0, 5).map((g) => {
          const target = g.metricTarget || 0;
          const current = g.metricCurrent || 0;
          const pct = target > 0 ? Math.round((current / target) * 100) : 0;
          return (
            <li key={g.id} className="px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate text-gray-800">{g.name}</span>
                <span className="text-xs text-gray-500">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
        {goals.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-gray-400">No goals yet.</li>
        )}
      </ul>
      <div className="border-t border-gray-50 px-3 py-2 text-right">
        <Link href="/goals" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          View all
        </Link>
      </div>
    </div>
  );
}

function NotepadWidget() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setText(localStorage.getItem("adana:notepad") ?? "");
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const h = setTimeout(() => {
      try {
        localStorage.setItem("adana:notepad", text);
      } catch {}
    }, 250);
    return () => clearTimeout(h);
  }, [text, ready]);

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Private notes (only visible to you, saved in this browser)"
      className="h-40 w-full resize-none rounded-md border-none bg-transparent p-3 text-sm text-gray-800 focus:outline-none focus:ring-0"
    />
  );
}

function ActivityWidget({ tasks }: { tasks: Task[] }) {
  // Sort by completedAt desc, fallback to dueDate, then id
  const sorted = [...tasks]
    .map((t) => ({
      t,
      ts: (t as any).updatedAt || (t as any).createdAt || t.completedAt || t.dueDate || "",
    }))
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .slice(0, 10);

  return (
    <ul className="divide-y divide-gray-50">
      {sorted.length === 0 && (
        <li className="px-3 py-6 text-center text-xs text-gray-400">No activity yet.</li>
      )}
      {sorted.map(({ t }) => (
        <li key={t.id} className="flex items-start gap-2 px-3 py-2 text-sm">
          <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.completed ? "bg-green-500" : "bg-indigo-400"}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-gray-800">
              {t.completed ? "Completed: " : "Updated: "}{t.title}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MilestonesWidget({ tasks }: { tasks: Task[] }) {
  const now = new Date();
  const milestones = tasks
    .filter((t) => t.taskType === "milestone" && t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);
  return (
    <ul className="divide-y divide-gray-50">
      {milestones.length === 0 && (
        <li className="px-3 py-6 text-center text-xs text-gray-400">No upcoming milestones.</li>
      )}
      {milestones.map((m) => (
        <li key={m.id} className="flex items-center gap-2 px-3 py-2 text-sm">
          <span className="text-yellow-500">◆</span>
          <span className="flex-1 truncate text-gray-800">{m.title}</span>
          {m.dueDate && (
            <span className="text-xs text-gray-400">
              {new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
