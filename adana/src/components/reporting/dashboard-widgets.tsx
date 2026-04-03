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
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

const completionData = [
  { date: "Mar 4", completed: 5 },
  { date: "Mar 5", completed: 8 },
  { date: "Mar 6", completed: 3 },
  { date: "Mar 7", completed: 12 },
  { date: "Mar 8", completed: 7 },
  { date: "Mar 9", completed: 2 },
  { date: "Mar 10", completed: 9 },
  { date: "Mar 11", completed: 14 },
  { date: "Mar 12", completed: 6 },
  { date: "Mar 13", completed: 11 },
  { date: "Mar 14", completed: 8 },
  { date: "Mar 15", completed: 15 },
  { date: "Mar 16", completed: 4 },
  { date: "Mar 17", completed: 10 },
];

export function TaskCompletionChart() {
  return (
    <WidgetCard title="Tasks Completed Over Time">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={completionData}>
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

const statusData = [
  { name: "Not Started", value: 12, color: "#9ca3af" },
  { name: "In Progress", value: 24, color: "#6366f1" },
  { name: "Completed", value: 38, color: "#22c55e" },
  { name: "Deferred", value: 6, color: "#f59e0b" },
];

export function TasksByStatusChart() {
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

const assigneeData = [
  { name: "Sarah C.", tasks: 18 },
  { name: "James W.", tasks: 14 },
  { name: "Emily P.", tasks: 11 },
  { name: "Alex R.", tasks: 9 },
  { name: "Mia L.", tasks: 7 },
  { name: "Unassigned", tasks: 21 },
];

export function TasksByAssigneeChart() {
  return (
    <WidgetCard title="Tasks by Assignee">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={assigneeData} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
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
  const overdueCount = 7;
  const lastWeekCount = 11;
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

const projectProgressData = [
  { name: "Website Redesign", progress: 72, status: "on_track" as const },
  { name: "Mobile App v2", progress: 45, status: "at_risk" as const },
  { name: "API Migration", progress: 88, status: "on_track" as const },
  { name: "Design System", progress: 30, status: "off_track" as const },
  { name: "Analytics Dashboard", progress: 100, status: "complete" as const },
];

const progressColor = (p: number) =>
  p >= 80 ? "green" : p >= 40 ? "blue" : "orange";

const statusBadgeVariant = (s: string) => {
  switch (s) {
    case "on_track":
      return "success" as const;
    case "at_risk":
      return "warning" as const;
    case "off_track":
      return "high" as const;
    case "complete":
      return "info" as const;
    default:
      return "default" as const;
  }
};

export function ProjectProgressWidget() {
  return (
    <WidgetCard title="Project Progress">
      <div className="space-y-3">
        {projectProgressData.map((p) => (
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
        ))}
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// 6. WorkloadWidget
// ---------------------------------------------------------------------------

const workloadData = [
  { name: "Sarah C.", tasks: 12, capacity: 10 },
  { name: "James W.", tasks: 8, capacity: 10 },
  { name: "Emily P.", tasks: 10, capacity: 10 },
  { name: "Alex R.", tasks: 5, capacity: 10 },
  { name: "Mia L.", tasks: 3, capacity: 10 },
];

export function WorkloadWidget() {
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
