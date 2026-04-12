"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, BarChart3, LineChart, PieChart, Hash, List, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { Task, Dashboard, DashboardWidget, Project } from "@/types";

type WidgetType = DashboardWidget["type"];
type DataSource = "all-tasks" | "my-tasks" | "project" | "portfolio";

const WIDGET_TYPES: { value: WidgetType; label: string; icon: typeof Hash }[] = [
  { value: "counter", label: "Counter", icon: Hash },
  { value: "bar", label: "Bar chart", icon: BarChart3 },
  { value: "line", label: "Line chart", icon: LineChart },
  { value: "pie", label: "Pie chart", icon: PieChart },
  { value: "burnup", label: "Burnup", icon: TrendingUp },
  { value: "list", label: "List", icon: List },
];

export default function ReportingPage() {
  const store = useAppStore();
  const {
    initialized,
    loading,
    currentUser,
    tasks,
    projects,
    users,
    dashboards,
    dashboardWidgets,
    createDashboard,
    deleteDashboard,
    addWidget,
    updateWidget,
    deleteWidget,
  } = store;

  const myDashboards = useMemo(
    () => dashboards.filter((d: Dashboard) => !d.ownerId || d.ownerId === currentUser?.id),
    [dashboards, currentUser]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [autoSeeded, setAutoSeeded] = useState(false);

  // Auto-create default dashboard on first view
  useEffect(() => {
    if (!initialized || loading || autoSeeded) return;
    if (myDashboards.length > 0) {
      if (!selectedId) setSelectedId(myDashboards[0].id);
      return;
    }
    setAutoSeeded(true);
    (async () => {
      const d = await createDashboard("My Dashboard");
      await addWidget(d.id, "counter", { title: "Total tasks", source: "all-tasks", metric: "total" });
      await addWidget(d.id, "line", { title: "Completion over time", source: "all-tasks" });
      await addWidget(d.id, "bar", { title: "Tasks by status", source: "all-tasks", groupBy: "status" });
      await addWidget(d.id, "pie", { title: "Tasks by assignee", source: "all-tasks", groupBy: "assignee" });
      setSelectedId(d.id);
    })();
  }, [initialized, loading, myDashboards, autoSeeded, createDashboard, addWidget, selectedId]);

  const selected = myDashboards.find((d) => d.id === selectedId) ?? null;
  const widgets = dashboardWidgets.filter((w: DashboardWidget) => w.dashboardId === selectedId);

  const handleNewDashboard = async () => {
    const name = prompt("Dashboard name?");
    if (!name) return;
    const d = await createDashboard(name);
    setSelectedId(d.id);
  };

  const handleDeleteDashboard = async (id: string) => {
    if (!confirm("Delete this dashboard?")) return;
    await deleteDashboard(id);
    if (selectedId === id) setSelectedId(myDashboards.filter((d) => d.id !== id)[0]?.id ?? null);
  };

  if (!initialized || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Dashboards</h2>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {myDashboards.length === 0 && (
            <li className="px-3 py-4 text-xs text-gray-400">No dashboards yet</li>
          )}
          {myDashboards.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => setSelectedId(d.id)}
                className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                  selectedId === d.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="truncate">{d.name}</span>
                <Trash2
                  className="hidden h-3.5 w-3.5 text-gray-400 hover:text-red-600 group-hover:block"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDashboard(d.id);
                  }}
                />
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={handleNewDashboard}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" /> New dashboard
          </button>
        </div>
      </aside>

      {/* Main pane */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Select or create a dashboard to get started.
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selected.name}</h1>
                <p className="mt-1 text-xs text-gray-500">
                  {widgets.length} widget{widgets.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Add widget
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {widgets.length === 0 && (
                <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
                  No widgets yet. Click &quot;Add widget&quot; to create one.
                </div>
              )}
              {widgets.map((w) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  tasks={tasks}
                  projects={projects}
                  users={users}
                  currentUserId={currentUser?.id ?? null}
                  onEdit={() => setEditingWidget(w)}
                  onDelete={() => deleteWidget(w.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {addOpen && selected && (
        <WidgetModal
          projects={projects}
          onClose={() => setAddOpen(false)}
          onSave={async (type, config) => {
            await addWidget(selected.id, type, config);
            setAddOpen(false);
          }}
        />
      )}
      {editingWidget && (
        <WidgetModal
          projects={projects}
          initial={editingWidget}
          onClose={() => setEditingWidget(null)}
          onSave={async (type, config) => {
            await updateWidget(editingWidget.id, { type, config });
            setEditingWidget(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------- Widget Card ----------------

function WidgetCard({
  widget,
  tasks,
  projects,
  users,
  currentUserId,
  onEdit,
  onDelete,
}: {
  widget: DashboardWidget;
  tasks: Task[];
  projects: Project[];
  users: { id: string; name: string }[];
  currentUserId: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = (widget.config ?? {}) as Record<string, unknown>;
  const title = (cfg.title as string) || WIDGET_TYPES.find((t) => t.value === widget.type)?.label || "Widget";
  const source = (cfg.source as DataSource) || "all-tasks";
  const projectId = cfg.projectId as string | undefined;

  const filteredTasks = useMemo(() => {
    if (source === "my-tasks" && currentUserId) {
      return tasks.filter((t) => t.assigneeId === currentUserId);
    }
    if (source === "project" && projectId) {
      return tasks.filter((t) => t.projectId === projectId);
    }
    return tasks;
  }, [tasks, source, projectId, currentUserId]);

  let body: React.ReactNode;
  switch (widget.type) {
    case "counter": {
      const done = filteredTasks.filter((t) => t.completed).length;
      body = (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-5xl font-bold text-indigo-600">{filteredTasks.length}</div>
          <div className="mt-1 text-xs text-gray-500">{done} completed</div>
        </div>
      );
      break;
    }
    case "bar": {
      const buckets = { todo: 0, done: 0 };
      for (const t of filteredTasks) (t.completed ? buckets.done++ : buckets.todo++);
      const max = Math.max(buckets.todo, buckets.done, 1);
      body = (
        <div className="space-y-3 py-2">
          {[
            { k: "To do", v: buckets.todo, c: "bg-gray-400" },
            { k: "Completed", v: buckets.done, c: "bg-green-500" },
          ].map((row) => (
            <div key={row.k}>
              <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span>{row.k}</span>
                <span>{row.v}</span>
              </div>
              <div className="h-3 rounded bg-gray-100">
                <div className={`h-3 rounded ${row.c}`} style={{ width: `${(row.v / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      );
      break;
    }
    case "pie": {
      const groupBy = (cfg.groupBy as string) || "assignee";
      const counts = new Map<string, number>();
      for (const t of filteredTasks) {
        const key = groupBy === "status"
          ? (t.completed ? "Completed" : "To do")
          : users.find((u) => u.id === t.assigneeId)?.name || "Unassigned";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const colors = ["bg-indigo-500", "bg-green-500", "bg-yellow-500", "bg-pink-500", "bg-blue-500", "bg-purple-500"];
      const total = filteredTasks.length || 1;
      body = (
        <div className="space-y-2 py-2">
          {Array.from(counts.entries()).slice(0, 6).map(([k, v], i) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <div className={`h-3 w-3 rounded-full ${colors[i % colors.length]}`} />
              <span className="flex-1 truncate text-gray-700">{k}</span>
              <span className="text-gray-500">{v} ({Math.round((v / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      );
      break;
    }
    case "line":
    case "burnup": {
      // Simple 7-day burnup based on completedAt
      const days: { label: string; done: number }[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const done = filteredTasks.filter(
          (t) => t.completedAt && t.completedAt.slice(0, 10) <= dayStr
        ).length;
        days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), done });
      }
      const max = Math.max(...days.map((d) => d.done), 1);
      body = (
        <div className="flex h-28 items-end gap-1.5 py-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-indigo-500"
                style={{ height: `${(d.done / max) * 100}%`, minHeight: "2px" }}
              />
              <div className="text-[10px] text-gray-400">{d.label}</div>
            </div>
          ))}
        </div>
      );
      break;
    }
    case "list": {
      body = (
        <ul className="divide-y divide-gray-100">
          {filteredTasks.slice(0, 6).map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-2 text-xs">
              <div className={`h-2 w-2 rounded-full ${t.completed ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="truncate text-gray-700">{t.title}</span>
            </li>
          ))}
          {filteredTasks.length === 0 && (
            <li className="py-4 text-center text-xs text-gray-400">No tasks</li>
          )}
        </ul>
      );
      break;
    }
  }

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={onEdit} className="rounded p-1 text-xs text-gray-500 hover:bg-gray-100">Edit</button>
          <button onClick={onDelete} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {body}
    </div>
  );
}

// ---------------- Widget Modal ----------------

function WidgetModal({
  projects,
  initial,
  onClose,
  onSave,
}: {
  projects: Project[];
  initial?: DashboardWidget;
  onClose: () => void;
  onSave: (type: WidgetType, config: Record<string, unknown>) => void | Promise<void>;
}) {
  const initCfg = (initial?.config ?? {}) as Record<string, unknown>;
  const [type, setType] = useState<WidgetType>(initial?.type ?? "counter");
  const [title, setTitle] = useState((initCfg.title as string) ?? "");
  const [source, setSource] = useState<DataSource>((initCfg.source as DataSource) ?? "all-tasks");
  const [projectId, setProjectId] = useState<string>((initCfg.projectId as string) ?? "");
  const [filterCompleted, setFilterCompleted] = useState<string>((initCfg.filterCompleted as string) ?? "all");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {initial ? "Edit widget" : "Add widget"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WidgetType)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              {WIDGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget title"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Data source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as DataSource)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all-tasks">All tasks</option>
              <option value="my-tasks">My tasks</option>
              <option value="project">Specific project</option>
              <option value="portfolio">Portfolio</option>
            </select>
          </div>
          {source === "project" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Filter: status</label>
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="completed">Completed only</option>
              <option value="open">Open only</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave(type, {
                title: title || WIDGET_TYPES.find((t) => t.value === type)?.label,
                source,
                projectId: source === "project" ? projectId : undefined,
                filterCompleted,
              })
            }
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
