"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
} from "lucide-react";

// -- Types --------------------------------------------------------------------

interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalUsers: number;
  completionRate: number;
  recentTasks: {
    id: string;
    title: string;
    completed: boolean;
    assignee: { id: string; name: string; avatar: string | null } | null;
    project: { id: string; name: string; color: string } | null;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    text: string;
    createdAt: string;
    author: { id: string; name: string; avatar: string | null };
    task: { id: string; title: string } | null;
  }[];
}

interface ProjectForReport {
  id: string;
  name: string;
  color: string;
  _count?: { tasks: number; members: number };
  taskCount?: number;
  statuses?: { status: string }[];
}

interface ProjectStats {
  total: number;
  completed: number;
  completionRate: number;
  overdue: number;
  bySection: Record<string, number>;
  byPriority: Record<string, number>;
  byAssignee: {
    user: { id: string; name: string; avatar: string | null };
    count: number;
    completedCount: number;
  }[];
}

const statusColor: Record<string, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
};

type DateRange = "week" | "month" | "quarter";

// -- Component ----------------------------------------------------------------

export default function ReportingPage() {
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<ProjectForReport[]>([]);
  const [projectStats, setProjectStats] = useState<Map<string, ProjectStats>>(
    new Map()
  );

  const loadData = useCallback(async () => {
    try {
      const { getDashboardData } = await import(
        "@/app/actions/reporting-actions"
      );
      const { getProjects } = await import("@/app/actions/project-actions");
      const { getProjectStats } = await import(
        "@/app/actions/reporting-actions"
      );

      const [dashData, projectList] = await Promise.all([
        getDashboardData(),
        getProjects(),
      ]);

      setDashboard(dashData as unknown as DashboardData);
      const projs = (projectList || []) as unknown as ProjectForReport[];
      setProjects(projs);

      // Load stats for each project
      const statsMap = new Map<string, ProjectStats>();
      await Promise.all(
        projs.slice(0, 10).map(async (p) => {
          const stats = await getProjectStats(p.id);
          statsMap.set(p.id, stats as ProjectStats);
        })
      );
      setProjectStats(statsMap);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Build derived data from real DB values
  const summaryCards = [
    {
      label: "Total Tasks",
      value: String(dashboard.totalTasks),
      icon: BarChart3,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Completed",
      value: String(dashboard.completedTasks),
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Overdue",
      value: String(dashboard.overdueTasks),
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Team Members",
      value: String(dashboard.totalUsers),
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  // Aggregate priority counts across all loaded project stats
  const aggregatedPriority: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  for (const stats of projectStats.values()) {
    for (const [k, v] of Object.entries(stats.byPriority)) {
      aggregatedPriority[k] = (aggregatedPriority[k] || 0) + v;
    }
  }
  const totalPriorityTasks = Object.values(aggregatedPriority).reduce(
    (s, v) => s + v,
    0
  );

  const tasksByPriority = [
    {
      label: "High",
      count: aggregatedPriority.high,
      color: "bg-red-500",
      percent:
        totalPriorityTasks > 0
          ? Math.round((aggregatedPriority.high / totalPriorityTasks) * 100)
          : 0,
    },
    {
      label: "Medium",
      count: aggregatedPriority.medium,
      color: "bg-yellow-500",
      percent:
        totalPriorityTasks > 0
          ? Math.round((aggregatedPriority.medium / totalPriorityTasks) * 100)
          : 0,
    },
    {
      label: "Low",
      count: aggregatedPriority.low,
      color: "bg-blue-400",
      percent:
        totalPriorityTasks > 0
          ? Math.round((aggregatedPriority.low / totalPriorityTasks) * 100)
          : 0,
    },
    {
      label: "None",
      count: aggregatedPriority.none,
      color: "bg-gray-300",
      percent:
        totalPriorityTasks > 0
          ? Math.round((aggregatedPriority.none / totalPriorityTasks) * 100)
          : 0,
    },
  ];

  // Build project progress from real data
  const projectProgress = projects.slice(0, 8).map((p) => {
    const stats = projectStats.get(p.id);
    const latestStatus = p.statuses?.[0]?.status || "on_track";
    return {
      name: p.name,
      progress: stats?.completionRate || 0,
      status: latestStatus,
      tasks: stats?.total || p.taskCount || p._count?.tasks || 0,
      completed: stats?.completed || 0,
    };
  });

  // Build top contributors from aggregated assignee data
  const contributorMap = new Map<
    string,
    { name: string; completed: number; initial: string }
  >();
  for (const stats of projectStats.values()) {
    for (const a of stats.byAssignee) {
      if (a.user.id === "unassigned") continue;
      const existing = contributorMap.get(a.user.id);
      if (existing) {
        existing.completed += a.completedCount;
      } else {
        contributorMap.set(a.user.id, {
          name: a.user.name,
          completed: a.completedCount,
          initial: a.user.name?.[0] || "?",
        });
      }
    }
  }
  const topContributors = [...contributorMap.values()]
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);
  const contributorColors = [
    "bg-purple-100 text-purple-600",
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
    "bg-indigo-100 text-indigo-600",
  ];

  // Format recent activity from comments
  const recentActivity = dashboard.recentActivity.map((a) => ({
    id: a.id,
    text: `${a.author?.name || "Someone"} commented on "${a.task?.title || "a task"}"`,
    time: formatTimeAgo(a.createdAt),
  }));

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
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Completion rate */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Overall Completion
            </h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-indigo-100">
              <span className="text-3xl font-bold text-indigo-600">
                {dashboard.completionRate}%
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">
                  {dashboard.completedTasks}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {dashboard.totalTasks}
                </span>{" "}
                tasks completed
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">
                  {dashboard.totalProjects}
                </span>{" "}
                active projects
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-red-600">
                  {dashboard.overdueTasks}
                </span>{" "}
                overdue tasks
              </p>
            </div>
          </div>
        </div>

        {/* Tasks by priority */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            By Priority
          </h3>
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
            <h3 className="text-sm font-semibold text-gray-900">
              Project Progress
            </h3>
          </div>
          {projectProgress.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No projects yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {projectProgress.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${statusColor[p.status] || "bg-gray-400"}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {p.completed}/{p.tasks}
                  </span>
                  <div className="h-1.5 w-24 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-gray-700">
                    {p.progress}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top contributors */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Top Contributors
            </h3>
          </div>
          {topContributors.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No contributor data yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topContributors.map((c, i) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="w-5 text-xs font-bold text-gray-400">
                    #{i + 1}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${contributorColors[i] || "bg-gray-100 text-gray-600"}`}
                  >
                    {c.initial}
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">
                    {c.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500 transition-all"
                        style={{
                          width: `${topContributors[0].completed > 0 ? (c.completed / topContributors[0].completed) * 100 : 0}%`,
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

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Recent Activity
          </h3>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No recent activity.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="flex h-2 w-2 rounded-full bg-indigo-400" />
                <span className="min-w-0 flex-1 text-sm text-gray-700">
                  {a.text}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {a.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// -- Utility ------------------------------------------------------------------

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
