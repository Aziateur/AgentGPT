"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Users,
  Filter,
  Download,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { Task } from "@/types";

// -- Helpers ------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const statusColor: Record<string, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
};

type DateRange = "week" | "month" | "quarter";

// -- Component ----------------------------------------------------------------

export default function ReportingPage() {
  const { tasks, projects, users, loading } = useAppStore();
  const [dateRange, setDateRange] = useState<DateRange>("week");

  // Compute stats from store data
  const stats = useMemo(() => {
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Task) => t.completed).length;
    const overdueTasks = tasks.filter(
      (t: Task) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Priority breakdown
    const priorityCount: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };
    for (const t of tasks) {
      const p = (t.priority as string) || "none";
      priorityCount[p] = (priorityCount[p] || 0) + 1;
    }
    const totalWithPriority = Object.values(priorityCount).reduce(
      (s, v) => s + v,
      0
    );

    // Per-project progress
    const projectProgress = projects.map((p) => {
      const projectTasks = tasks.filter((t: Task) => t.projectId === p.id);
      const done = projectTasks.filter((t: Task) => t.completed).length;
      const rate =
        projectTasks.length > 0
          ? Math.round((done / projectTasks.length) * 100)
          : 0;
      return {
        id: p.id,
        name: p.name,
        taskCount: projectTasks.length,
        completedCount: done,
        completionRate: rate,
        status: "on_track",
      };
    });

    // Top contributors: users sorted by completed tasks assigned to them
    const contributorMap = new Map<
      string,
      { name: string; completed: number; initial: string }
    >();
    for (const u of users) {
      const userTasks = tasks.filter((t: Task) => t.assigneeId === u.id);
      const done = userTasks.filter((t: Task) => t.completed).length;
      contributorMap.set(u.id, {
        name: u.name,
        completed: done,
        initial: u.name?.[0] || "?",
      });
    }
    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      totalUsers: users.length,
      totalProjects: projects.length,
      completionRate,
      priorityCount,
      totalWithPriority,
      projectProgress,
      topContributors,
    };
  }, [tasks, projects, users]);

  const summaryCards = [
    {
      label: "Total Tasks",
      value: String(stats.totalTasks),
      icon: BarChart3,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Completed",
      value: String(stats.completedTasks),
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Overdue",
      value: String(stats.overdueTasks),
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Team Members",
      value: String(stats.totalUsers),
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  const tasksByPriority = [
    {
      label: "High",
      count: stats.priorityCount.high || 0,
      color: "bg-red-500",
      percent:
        stats.totalWithPriority > 0
          ? Math.round(((stats.priorityCount.high || 0) / stats.totalWithPriority) * 100)
          : 0,
    },
    {
      label: "Medium",
      count: stats.priorityCount.medium || 0,
      color: "bg-yellow-500",
      percent:
        stats.totalWithPriority > 0
          ? Math.round(((stats.priorityCount.medium || 0) / stats.totalWithPriority) * 100)
          : 0,
    },
    {
      label: "Low",
      count: stats.priorityCount.low || 0,
      color: "bg-blue-400",
      percent:
        stats.totalWithPriority > 0
          ? Math.round(((stats.priorityCount.low || 0) / stats.totalWithPriority) * 100)
          : 0,
    },
    {
      label: "None",
      count: stats.priorityCount.none || 0,
      color: "bg-gray-300",
      percent:
        stats.totalWithPriority > 0
          ? Math.round(((stats.priorityCount.none || 0) / stats.totalWithPriority) * 100)
          : 0,
    },
  ];

  const contributorColors = [
    "bg-purple-100 text-purple-600",
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
    "bg-indigo-100 text-indigo-600",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white">
            {(["week", "month", "quarter"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  dateRange === r
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Completion rate */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Overall Completion</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-indigo-100">
              <span className="text-3xl font-bold text-indigo-600">
                {stats.completionRate}%
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{stats.completedTasks}</span>
                {" "}of{" "}
                <span className="font-medium text-gray-900">{stats.totalTasks}</span>
                {" "}tasks completed
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{stats.totalProjects}</span>
                {" "}active projects
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-red-600">{stats.overdueTasks}</span>
                {" "}overdue tasks
              </p>
            </div>
          </div>
        </div>

        {/* Tasks by priority */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">By Priority</h3>
          <div className="space-y-3">
            {tasksByPriority.map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{p.label}</span>
                  <span className="text-gray-500">
                    {p.count} tasks ({p.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${p.color}`}
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project progress */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Project Progress</h3>
          </div>
          {stats.projectProgress.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No projects yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.projectProgress.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${statusColor[p.status] || "bg-gray-400"}`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {p.completedCount}/{p.taskCount}
                  </span>
                  <div className="h-1.5 w-24 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${p.completionRate}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-gray-700">
                    {p.completionRate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top contributors */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Top Contributors</h3>
          </div>
          {stats.topContributors.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No contributor data yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.topContributors.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${contributorColors[i] || "bg-gray-100 text-gray-600"}`}>
                    {c.initial}
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500 transition-all"
                        style={{
                          width: `${stats.topContributors[0].completed > 0 ? (c.completed / stats.topContributors[0].completed) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-gray-700">
                      {c.completed}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tasks overview by project */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Tasks by Project</h3>
        </div>
        {projects.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No projects yet.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t: Task) => t.projectId === project.id);
              const completed = projectTasks.filter((t: Task) => t.completed).length;
              const pending = projectTasks.length - completed;
              return (
                <li key={project.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="min-w-0 flex-1 text-sm text-gray-700">{project.name}</span>
                  <span className="text-xs text-green-600">{completed} done</span>
                  <span className="text-xs text-gray-400">{pending} pending</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
