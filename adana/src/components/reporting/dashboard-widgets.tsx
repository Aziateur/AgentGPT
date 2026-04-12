"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAppStore } from "@/store/app-store";
import type { Task, User, Project } from "@/types";

// ---------------------------------------------------------------------------
// Selector helpers — pure functions derived from store data
// ---------------------------------------------------------------------------

type TaskStatusKey = "completed" | "in_progress" | "todo";

export function tasksByStatus(
  tasks: Task[]
): { status: TaskStatusKey; count: number }[] {
  let completed = 0;
  let inProgress = 0;
  let todo = 0;
  for (const t of tasks) {
    if (t.completed) {
      completed++;
    } else if (t.assigneeId) {
      inProgress++;
    } else {
      todo++;
    }
  }
  return [
    { status: "completed", count: completed },
    { status: "in_progress", count: inProgress },
    { status: "todo", count: todo },
  ];
}

export function tasksByAssignee(
  tasks: Task[],
  users: User[]
): { name: string; count: number }[] {
  const userById = new Map(users.map((u) => [u.id, u]));
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (t.completed) continue;
    const key = t.assigneeId ?? "__unassigned__";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows: { name: string; count: number }[] = [];
  Array.from(counts.entries()).forEach(([key, count]) => {
    if (key === "__unassigned__") {
      rows.push({ name: "Unassigned", count });
    } else {
      const u = userById.get(key);
      rows.push({ name: u ? u.name : "Unknown", count });
    }
  });
  return rows.sort((a, b) => b.count - a.count);
}

type PriorityKey = "high" | "medium" | "low" | "none";

export function tasksByPriority(
  tasks: Task[]
): { priority: PriorityKey; count: number }[] {
  const buckets: Record<PriorityKey, number> = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  for (const t of tasks) {
    const p = (t.priority as string | null | undefined)?.toLowerCase();
    if (p === "high") buckets.high++;
    else if (p === "medium") buckets.medium++;
    else if (p === "low") buckets.low++;
    else buckets.none++;
  }
  return (["high", "medium", "low", "none"] as PriorityKey[]).map((k) => ({
    priority: k,
    count: buckets[k],
  }));
}

function ymd(d: Date): string {
  // Local-date YYYY-MM-DD key
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function completionOverTime(
  tasks: Task[],
  days = 14
): { date: string; completed: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, number>();
  const labels: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = ymd(d);
    buckets.set(key, 0);
    labels.push({ key, label: shortLabel(d) });
  }

  for (const t of tasks) {
    if (!t.completed || !t.completedAt) continue;
    const d = new Date(t.completedAt);
    if (isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    const key = ymd(d);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return labels.map(({ key, label }) => ({
    date: label,
    completed: buckets.get(key) ?? 0,
  }));
}

export function burnup(
  tasks: Task[],
  days = 14
): { date: string; total: number; completed: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayList: { date: Date; key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayList.push({ date: d, key: ymd(d), label: shortLabel(d) });
  }

  return dayList.map(({ date, label }) => {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    let total = 0;
    let completed = 0;
    for (const t of tasks) {
      // Use createdAt if available, otherwise fall back to completedAt/dueDate
      const createdStr =
        (t as unknown as { createdAt?: string }).createdAt ??
        t.completedAt ??
        t.dueDate ??
        null;
      const createdTime = createdStr ? new Date(createdStr).getTime() : null;
      if (createdTime !== null && !isNaN(createdTime) && createdTime <= endOfDay.getTime()) {
        total++;
      } else if (createdStr === null) {
        // Unknown creation date — count toward total so chart isn't empty
        total++;
      }
      if (t.completed && t.completedAt) {
        const ct = new Date(t.completedAt).getTime();
        if (!isNaN(ct) && ct <= endOfDay.getTime()) {
          completed++;
        }
      }
    }
    return { date: label, total, completed };
  });
}

function projectProgress(
  tasks: Task[],
  projects: Project[]
): { name: string; progress: number; status: string }[] {
  return projects
    .filter((p) => !p.archived)
    .map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => t.completed).length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      const status =
        (p as unknown as { status?: string }).status ??
        (progress >= 100 ? "complete" : "on_track");
      return { name: p.name, progress, status };
    })
    .slice(0, 6);
}

function workload(
  tasks: Task[],
  users: User[]
): { name: string; tasks: number; capacity: number }[] {
  const byUser = new Map<string, number>();
  for (const t of tasks) {
    if (t.completed || !t.assigneeId) continue;
    byUser.set(t.assigneeId, (byUser.get(t.assigneeId) ?? 0) + 1);
  }
  return users
    .map((u) => ({
      name: u.name,
      tasks: byUser.get(u.id) ?? 0,
      capacity: 10,
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// Shared card wrapper
// ---------------------------------------------------------------------------

function WidgetCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. TaskCompletionChart
// ---------------------------------------------------------------------------

export function TaskCompletionChart() {
  const tasks = useAppStore((s) => s.tasks);
  const data = React.useMemo(() => completionOverTime(tasks, 14), [tasks]);

  return (
    <WidgetCard title="Tasks Completed Over Time">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorCompleted)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// 2. TasksByStatusChart
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  TaskStatusKey,
  { label: string; color: string }
> = {
  todo: { label: "Not Started", color: "#9ca3af" },
  in_progress: { label: "In Progress", color: "#6366f1" },
  completed: { label: "Completed", color: "#22c55e" },
};

export function TasksByStatusChart() {
  const tasks = useAppStore((s) => s.tasks);
  const rows = React.useMemo(() => tasksByStatus(tasks), [tasks]);
  const statusData = rows.map((r) => ({
    name: STATUS_META[r.status].label,
    value: r.count,
    color: STATUS_META[r.status].color,
  }));

  return (
    <WidgetCard title="Tasks by Status">
      <div className="flex items-center gap-6">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm text-gray-700">
                {s.name}:{" "}
                <span className="font-semibold tabular-nums">{s.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// 3. TasksByAssigneeChart
// ---------------------------------------------------------------------------

export function TasksByAssigneeChart() {
  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const rows = React.useMemo(
    () => tasksByAssignee(tasks, users),
    [tasks, users]
  );
  const assigneeData = rows.map((r) => ({ name: r.name, tasks: r.count }));

  return (
    <WidgetCard title="Tasks by Assignee">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={assigneeData} layout="vertical" barSize={16}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="tasks" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// 4. OverdueTasksWidget
// ---------------------------------------------------------------------------

export function OverdueTasksWidget() {
  const tasks = useAppStore((s) => s.tasks);

  const { overdueCount, lastWeekCount } = React.useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;

    let overdue = 0;
    let prev = 0;
    for (const t of tasks) {
      if (t.completed || !t.dueDate) continue;
      const due = new Date(t.dueDate).getTime();
      if (isNaN(due)) continue;
      if (due < nowMs) overdue++;
      if (due < sevenDaysAgo) prev++;
    }
    return { overdueCount: overdue, lastWeekCount: prev };
  }, [tasks]);

  const trending = overdueCount < lastWeekCount ? "down" : "up";

  return (
    <WidgetCard title="Overdue Tasks">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <p className="text-3xl font-bold tabular-nums text-gray-900">
            {overdueCount}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            {trending === "down" ? (
              <TrendingDown className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trending === "down" ? "text-green-600" : "text-red-600"
              )}
            >
              {trending === "down" ? "Improving" : "Increasing"} vs last week (
              {lastWeekCount})
            </span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// 5. ProjectProgressWidget
// ---------------------------------------------------------------------------

const progressColor = (p: number) =>
  p >= 80 ? "green" : p >= 40 ? "blue" : "orange";

export function ProjectProgressWidget() {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const data = React.useMemo(
    () => projectProgress(tasks, projects),
    [tasks, projects]
  );

  return (
    <WidgetCard title="Project Progress">
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400">No projects yet.</p>
        ) : (
          data.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="w-36 truncate text-sm text-gray-700">
                {p.name}
              </span>
              <div className="flex-1">
                <ProgressBar
                  value={p.progress}
                  size="sm"
                  color={progressColor(p.progress)}
                />
              </div>
              <span className="w-8 text-right text-xs tabular-nums text-gray-500">
                {p.progress}%
              </span>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// 6. WorkloadWidget
// ---------------------------------------------------------------------------

export function WorkloadWidget() {
  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const workloadData = React.useMemo(
    () => workload(tasks, users),
    [tasks, users]
  );

  return (
    <WidgetCard title="Team Workload">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={workloadData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Bar
              dataKey="tasks"
              name="Current Tasks"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="capacity"
              name="Capacity"
              fill="#e5e7eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}
