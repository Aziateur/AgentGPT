"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Plus, X, Trash2, BarChart3, LineChart as LineIcon, Hash, Activity } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import {
  tasksByAssignee,
  completionOverTime,
  burnup,
} from "@/components/reporting/dashboard-widgets";
import type { DashboardWidget, Task } from "@/types";

// ---------------------------------------------------------------------------
// View Nav
// ---------------------------------------------------------------------------

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
// Shared card
// ---------------------------------------------------------------------------

function WidgetCard({
  title,
  onDelete,
  children,
}: {
  title: string;
  onDelete?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-gray-300 transition hover:text-red-500"
            title="Remove widget"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Counter config
// ---------------------------------------------------------------------------

type CounterMetric = "total" | "completed" | "overdue" | "upcoming";

function computeCounter(metric: CounterMetric, tasks: Task[]): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (metric === "total") return tasks.length;
  if (metric === "completed") return tasks.filter((t) => t.completed).length;
  if (metric === "overdue") {
    return tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return !isNaN(d.getTime()) && d < now;
    }).length;
  }
  // upcoming this week
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && d >= now && d <= weekEnd;
  }).length;
}

const COUNTER_LABEL: Record<CounterMetric, string> = {
  total: "Total tasks",
  completed: "Completed",
  overdue: "Overdue",
  upcoming: "Due this week",
};

// ---------------------------------------------------------------------------
// Widget renderer
// ---------------------------------------------------------------------------

function WidgetRenderer({
  widget,
  tasks,
  users,
  sections,
  onDelete,
}: {
  widget: DashboardWidget;
  tasks: Task[];
  users: ReturnType<typeof useAppStore.getState>["users"];
  sections: ReturnType<typeof useAppStore.getState>["sections"];
  onDelete: () => void;
}) {
  const cfg = widget.config as Record<string, unknown>;
  const title = (cfg.title as string) ?? defaultTitle(widget);

  if (widget.type === "counter") {
    const metric = ((cfg.metric as CounterMetric) ?? "total") as CounterMetric;
    const value = computeCounter(metric, tasks);
    return (
      <WidgetCard title={title} onDelete={onDelete}>
        <div className="text-4xl font-bold text-gray-900 tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-gray-500">{COUNTER_LABEL[metric]}</div>
      </WidgetCard>
    );
  }

  if (widget.type === "bar") {
    const source = (cfg.source as string) ?? "assignee";
    let data: { name: string; count: number }[] = [];
    if (source === "section") {
      const counts = new Map<string, number>();
      for (const t of tasks) {
        const key = t.sectionId ?? "__none__";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const nameById = new Map(sections.map((s) => [s.id, s.name]));
      data = Array.from(counts.entries()).map(([k, count]) => ({
        name: k === "__none__" ? "No section" : nameById.get(k) ?? "Unknown",
        count,
      }));
    } else {
      data = tasksByAssignee(tasks, users);
    }
    return (
      <WidgetCard title={title} onDelete={onDelete}>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </WidgetCard>
    );
  }

  if (widget.type === "line") {
    const data = completionOverTime(tasks, 14);
    return (
      <WidgetCard title={title} onDelete={onDelete}>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </WidgetCard>
    );
  }

  if (widget.type === "burnup") {
    const data = burnup(tasks, 14);
    return (
      <WidgetCard title={title} onDelete={onDelete}>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`tot-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`done-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
              <Area type="monotone" dataKey="total" stroke="#94a3b8" fill={`url(#tot-${widget.id})`} strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" fill={`url(#done-${widget.id})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={title} onDelete={onDelete}>
      <p className="text-sm text-gray-500">Unsupported widget type: {widget.type}</p>
    </WidgetCard>
  );
}

function defaultTitle(w: DashboardWidget): string {
  switch (w.type) {
    case "counter":
      return "Counter";
    case "bar":
      return "Bar chart";
    case "line":
      return "Completion over time";
    case "burnup":
      return "Burnup";
    default:
      return "Widget";
  }
}

// ---------------------------------------------------------------------------
// Add widget modal
// ---------------------------------------------------------------------------

type NewWidgetType = "counter" | "bar" | "line" | "burnup";

function AddWidgetModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: NewWidgetType, title: string, source: string) => void;
}) {
  const [type, setType] = useState<NewWidgetType>("counter");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<string>("total");

  useEffect(() => {
    if (open) {
      setType("counter");
      setTitle("");
      setSource("total");
    }
  }, [open]);

  useEffect(() => {
    // Reset source when switching type
    if (type === "counter") setSource("total");
    else if (type === "bar") setSource("assignee");
    else setSource("");
  }, [type]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Add widget</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-600">Widget type</label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {([
            { t: "counter", label: "Counter", icon: Hash },
            { t: "bar", label: "Bar chart", icon: BarChart3 },
            { t: "line", label: "Line", icon: LineIcon },
            { t: "burnup", label: "Burnup", icon: Activity },
          ] as const).map(({ t, label, icon: Icon }) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                type === t
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={defaultTitle({ type } as DashboardWidget)}
          className="mb-3 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />

        {type === "counter" && (
          <>
            <label className="mb-1 block text-xs font-medium text-gray-600">Metric</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
            >
              <option value="total">Total tasks</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Due this week</option>
            </select>
          </>
        )}

        {type === "bar" && (
          <>
            <label className="mb-1 block text-xs font-medium text-gray-600">Group by</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
            >
              <option value="assignee">Assignee</option>
              <option value="section">Section</option>
            </select>
          </>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd(type, title.trim() || defaultTitle({ type } as DashboardWidget), source)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add widget
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardViewClient() {
  const searchParams = useSearchParams();
  const projectId = (searchParams?.get("id") as string) ?? "";

  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const sections = useAppStore((s) => s.sections);
  const dashboards = useAppStore((s) => s.dashboards);
  const dashboardWidgets = useAppStore((s) => s.dashboardWidgets);
  const createDashboard = useAppStore((s) => s.createDashboard);
  const addWidget = useAppStore((s) => s.addWidget);
  const deleteWidget = useAppStore((s) => s.deleteWidget);

  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId),
    [tasks, projectId],
  );
  const projectSections = useMemo(
    () => sections.filter((s) => s.projectId === projectId),
    [sections, projectId],
  );

  // Resolve / lazily create project dashboard.
  useEffect(() => {
    if (!projectId) return;
    const existing = dashboards.find((d) => d.scopeId === projectId);
    if (existing) {
      setDashboardId(existing.id);
    } else {
      setDashboardId(null);
    }
  }, [dashboards, projectId]);

  const widgets = useMemo(
    () => (dashboardId ? dashboardWidgets.filter((w) => w.dashboardId === dashboardId) : []),
    [dashboardWidgets, dashboardId],
  );

  async function handleAdd(type: NewWidgetType, title: string, source: string) {
    let dId = dashboardId;
    if (!dId) {
      const created = await createDashboard("Project Dashboard", projectId);
      dId = created.id;
      setDashboardId(dId);
    }
    const cfg: Record<string, unknown> = { title };
    if (type === "counter") cfg.metric = source;
    if (type === "bar") cfg.source = source;
    await addWidget(dId, type as DashboardWidget["type"], cfg);
    setShowAdd(false);
  }

  // Precomputed counter values for the default summary row
  const totalCount = projectTasks.length;
  const completedCount = computeCounter("completed", projectTasks);
  const overdueCount = computeCounter("overdue", projectTasks);
  const upcomingCount = computeCounter("upcoming", projectTasks);

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="dashboard" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add widget
            </button>
          </div>

          {/* Built-in summary counters — always shown */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total tasks", value: totalCount, color: "text-gray-900" },
              { label: "Completed", value: completedCount, color: "text-green-600" },
              { label: "Overdue", value: overdueCount, color: "text-red-600" },
              { label: "Due this week", value: upcomingCount, color: "text-indigo-600" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className={`text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</div>
                <div className="mt-0.5 text-xs text-gray-500">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Built-in charts */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <WidgetRenderer
              widget={
                {
                  id: "builtin-sections",
                  dashboardId: "builtin",
                  type: "bar",
                  config: { title: "Tasks by section", source: "section" },
                  position: { x: 0, y: 0, w: 6, h: 4 },
                  createdAt: "",
                } as DashboardWidget
              }
              tasks={projectTasks}
              users={users}
              sections={projectSections}
              onDelete={() => {}}
            />
            <WidgetRenderer
              widget={
                {
                  id: "builtin-assignees",
                  dashboardId: "builtin",
                  type: "bar",
                  config: { title: "Tasks by assignee", source: "assignee" },
                  position: { x: 0, y: 0, w: 6, h: 4 },
                  createdAt: "",
                } as DashboardWidget
              }
              tasks={projectTasks}
              users={users}
              sections={projectSections}
              onDelete={() => {}}
            />
            <WidgetRenderer
              widget={
                {
                  id: "builtin-line",
                  dashboardId: "builtin",
                  type: "line",
                  config: { title: "Completion over time" },
                  position: { x: 0, y: 0, w: 6, h: 4 },
                  createdAt: "",
                } as DashboardWidget
              }
              tasks={projectTasks}
              users={users}
              sections={projectSections}
              onDelete={() => {}}
            />
            <WidgetRenderer
              widget={
                {
                  id: "builtin-burnup",
                  dashboardId: "builtin",
                  type: "burnup",
                  config: { title: "Burnup" },
                  position: { x: 0, y: 0, w: 6, h: 4 },
                  createdAt: "",
                } as DashboardWidget
              }
              tasks={projectTasks}
              users={users}
              sections={projectSections}
              onDelete={() => {}}
            />
          </div>

          {/* Custom widgets */}
          {widgets.length > 0 && (
            <>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Custom widgets</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {widgets.map((w) => (
                  <WidgetRenderer
                    key={w.id}
                    widget={w}
                    tasks={projectTasks}
                    users={users}
                    sections={projectSections}
                    onDelete={() => deleteWidget(w.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddWidgetModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </div>
  );
}
