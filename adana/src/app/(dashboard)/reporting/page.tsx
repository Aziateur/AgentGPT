"use client";

import { useState } from "react";
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

// -- Mock data ----------------------------------------------------------------

const summaryCards = [
  { label: "Total Tasks", value: "248", change: "+12%", up: true, icon: BarChart3, color: "bg-indigo-50 text-indigo-600" },
  { label: "Completed", value: "186", change: "+8%", up: true, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
  { label: "Overdue", value: "7", change: "-3%", up: false, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
  { label: "Team Members", value: "12", change: "+2", up: true, icon: Users, color: "bg-blue-50 text-blue-600" },
];

const projectProgress = [
  { name: "Website Redesign", progress: 72, status: "on_track", tasks: 24, completed: 17 },
  { name: "Mobile App v2", progress: 45, status: "at_risk", tasks: 36, completed: 16 },
  { name: "Design System", progress: 88, status: "on_track", tasks: 18, completed: 16 },
  { name: "API Integration", progress: 30, status: "off_track", tasks: 42, completed: 13 },
  { name: "Data Pipeline", progress: 55, status: "on_track", tasks: 15, completed: 8 },
];

const weeklyTasks = [
  { day: "Mon", completed: 8, created: 5 },
  { day: "Tue", completed: 12, created: 7 },
  { day: "Wed", completed: 6, created: 10 },
  { day: "Thu", completed: 15, created: 8 },
  { day: "Fri", completed: 10, created: 6 },
  { day: "Sat", completed: 3, created: 1 },
  { day: "Sun", completed: 1, created: 0 },
];

const topContributors = [
  { name: "Sarah Chen", initial: "S", completed: 42, color: "bg-purple-100 text-purple-600" },
  { name: "Alex Kim", initial: "A", completed: 38, color: "bg-blue-100 text-blue-600" },
  { name: "Jordan Lee", initial: "J", completed: 35, color: "bg-green-100 text-green-600" },
  { name: "Taylor Swift", initial: "T", completed: 29, color: "bg-orange-100 text-orange-600" },
  { name: "Demo User", initial: "D", completed: 27, color: "bg-indigo-100 text-indigo-600" },
];

const tasksByPriority = [
  { label: "High", count: 18, color: "bg-red-500", percent: 29 },
  { label: "Medium", count: 27, color: "bg-yellow-500", percent: 44 },
  { label: "Low", count: 12, color: "bg-blue-400", percent: 19 },
  { label: "None", count: 5, color: "bg-gray-300", percent: 8 },
];

const recentActivity = [
  { id: "a1", text: 'Sarah completed "Design homepage wireframes"', time: "2h ago", type: "completed" },
  { id: "a2", text: 'Alex moved "API endpoint" to In Review', time: "3h ago", type: "moved" },
  { id: "a3", text: 'Jordan created 3 new tasks in "Mobile App v2"', time: "5h ago", type: "created" },
  { id: "a4", text: 'Taylor updated status of "Design System" to On Track', time: "6h ago", type: "status" },
  { id: "a5", text: 'Demo User assigned "Deploy staging" to Jordan', time: "8h ago", type: "assigned" },
];

const statusColor: Record<string, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
};

const maxBar = Math.max(...weeklyTasks.map((d) => Math.max(d.completed, d.created)));

type DateRange = "week" | "month" | "quarter";

// -- Component ----------------------------------------------------------------

export default function ReportingPage() {
  const [dateRange, setDateRange] = useState<DateRange>("week");

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
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? "text-green-600" : "text-red-600"}`}>
                {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {card.change}
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly task chart */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Tasks This Week</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-300" /> Created
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3" style={{ height: 180 }}>
            {weeklyTasks.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: 150 }}>
                  <div className="w-5 rounded-t bg-indigo-500 transition-all" style={{ height: `${(d.completed / maxBar) * 150}px` }} />
                  <div className="w-5 rounded-t bg-gray-200 transition-all" style={{ height: `${(d.created / maxBar) * 150}px` }} />
                </div>
                <span className="text-[10px] font-medium text-gray-500">{d.day}</span>
              </div>
            ))}
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
                  <span className="text-gray-500">{p.count} tasks ({p.percent}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full transition-all ${p.color}`} style={{ width: `${p.percent}%` }} />
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
          <div className="divide-y divide-gray-50">
            {projectProgress.map((p) => (
              <div key={p.name} className="flex items-center gap-4 px-5 py-3">
                <div className={`h-2.5 w-2.5 rounded-full ${statusColor[p.status]}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{p.name}</span>
                <span className="text-xs text-gray-500">{p.completed}/{p.tasks}</span>
                <div className="h-1.5 w-24 rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-medium text-gray-700">{p.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top contributors */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Top Contributors</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {topContributors.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${c.color}`}>
                  {c.initial}
                </div>
                <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{c.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(c.completed / topContributors[0].completed) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-gray-700">{c.completed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <ul className="divide-y divide-gray-50">
          {recentActivity.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex h-2 w-2 rounded-full bg-indigo-400" />
              <span className="min-w-0 flex-1 text-sm text-gray-700">{a.text}</span>
              <span className="shrink-0 text-xs text-gray-400">{a.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
