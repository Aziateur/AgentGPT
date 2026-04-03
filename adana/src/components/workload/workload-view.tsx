"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// -- Mock data ----------------------------------------------------------------

interface TeamMemberWorkload {
  id: string;
  name: string;
  initial: string;
  color: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  estimatedHours: number;
  capacityHours: number;
  tasksByDay: number[]; // 7 days of task counts
}

const mockWorkloads: TeamMemberWorkload[] = [
  {
    id: "u1", name: "Sarah Chen", initial: "S", color: "bg-purple-100 text-purple-600",
    totalTasks: 12, completedTasks: 7, overdueTasks: 1, estimatedHours: 32, capacityHours: 40,
    tasksByDay: [4, 5, 6, 3, 5, 2, 0],
  },
  {
    id: "u2", name: "Alex Kim", initial: "A", color: "bg-blue-100 text-blue-600",
    totalTasks: 15, completedTasks: 9, overdueTasks: 0, estimatedHours: 38, capacityHours: 40,
    tasksByDay: [5, 6, 4, 7, 5, 3, 1],
  },
  {
    id: "u3", name: "Jordan Lee", initial: "J", color: "bg-green-100 text-green-600",
    totalTasks: 18, completedTasks: 10, overdueTasks: 3, estimatedHours: 48, capacityHours: 40,
    tasksByDay: [7, 8, 6, 9, 7, 4, 2],
  },
  {
    id: "u4", name: "Taylor Swift", initial: "T", color: "bg-orange-100 text-orange-600",
    totalTasks: 8, completedTasks: 6, overdueTasks: 0, estimatedHours: 20, capacityHours: 40,
    tasksByDay: [2, 3, 3, 2, 3, 1, 0],
  },
  {
    id: "u5", name: "Demo User", initial: "D", color: "bg-indigo-100 text-indigo-600",
    totalTasks: 14, completedTasks: 8, overdueTasks: 2, estimatedHours: 35, capacityHours: 40,
    tasksByDay: [5, 4, 6, 5, 6, 2, 1],
  },
];

// -- Helpers ------------------------------------------------------------------

function getLoadStatus(hours: number, capacity: number): { label: string; color: string } {
  const ratio = hours / capacity;
  if (ratio > 1) return { label: "Overloaded", color: "text-red-600" };
  if (ratio > 0.8) return { label: "High", color: "text-orange-600" };
  if (ratio > 0.5) return { label: "Balanced", color: "text-green-600" };
  return { label: "Low", color: "text-blue-600" };
}

function getBarColor(hours: number, capacity: number): string {
  const ratio = hours / capacity;
  if (ratio > 1) return "bg-red-500";
  if (ratio > 0.8) return "bg-orange-500";
  if (ratio > 0.5) return "bg-green-500";
  return "bg-blue-400";
}

const maxDailyTasks = Math.max(...mockWorkloads.flatMap((w) => w.tasksByDay));

// -- Props --------------------------------------------------------------------

export interface WorkloadViewProps {
  className?: string;
}

// -- Component ----------------------------------------------------------------

export function WorkloadView({ className }: WorkloadViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + weekOffset * 7 - startDate.getDay() + 1);

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return {
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  const weekLabel = `${dayLabels[0].date} - ${dayLabels[6].date}`;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Team Workload</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[160px] text-center text-sm font-medium text-gray-700">
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            This week
          </button>
        </div>
      </div>

      {/* Capacity bars */}
      <div className="mb-8 space-y-4">
        {mockWorkloads.map((person) => {
          const loadStatus = getLoadStatus(person.estimatedHours, person.capacityHours);
          const barColor = getBarColor(person.estimatedHours, person.capacityHours);
          const fillPercent = Math.min((person.estimatedHours / person.capacityHours) * 100, 120);

          return (
            <div key={person.id} className="flex items-center gap-4">
              {/* Person info */}
              <div className="flex w-40 shrink-0 items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${person.color}`}>
                  {person.initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{person.name}</p>
                  <p className={`text-[10px] font-medium ${loadStatus.color}`}>{loadStatus.label}</p>
                </div>
              </div>

              {/* Bar */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(fillPercent, 100)}%` }}
                  />
                  {/* Capacity line */}
                  <div className="absolute right-0 top-0 h-full w-px bg-gray-300" />
                  {fillPercent > 100 && (
                    <div
                      className="absolute top-0 h-full rounded-r-full bg-red-200"
                      style={{ left: "100%", width: `${fillPercent - 100}%` }}
                    />
                  )}
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-gray-500">
                  {person.estimatedHours}h / {person.capacityHours}h
                </span>
              </div>

              {/* Stats */}
              <div className="flex w-28 shrink-0 items-center gap-2 text-xs">
                <span className="flex items-center gap-0.5 text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> {person.completedTasks}
                </span>
                {person.overdueTasks > 0 && (
                  <span className="flex items-center gap-0.5 text-red-600">
                    <AlertTriangle className="h-3 w-3" /> {person.overdueTasks}
                  </span>
                )}
                <span className="text-gray-400">{person.totalTasks} total</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily breakdown chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Daily Task Distribution</h3>

        <div className="flex items-end gap-2">
          {dayLabels.map((day, dayIdx) => (
            <div key={day.short} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-px" style={{ height: 120 }}>
                {mockWorkloads.map((person) => {
                  const val = person.tasksByDay[dayIdx] || 0;
                  const height = maxDailyTasks > 0 ? (val / maxDailyTasks) * 100 : 0;
                  return (
                    <div
                      key={person.id}
                      className={`w-3 rounded-t transition-all ${person.color.split(" ")[0].replace("text-", "bg-").replace("-100", "-400")}`}
                      style={{ height: `${height}%`, minHeight: val > 0 ? 4 : 0 }}
                      title={`${person.name}: ${val} tasks`}
                    />
                  );
                })}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-600">{day.short}</p>
                <p className="text-[9px] text-gray-400">{day.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {mockWorkloads.map((person) => (
            <span key={person.id} className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className={`h-2 w-2 rounded-full ${person.color.split(" ")[0].replace("text-", "bg-").replace("-100", "-400")}`} />
              {person.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
