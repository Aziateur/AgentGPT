"use client";

import { useMemo } from "react";
import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { useAppStore } from "@/store/app-store";
import type { Task, User } from "@/types";

// -- Props --------------------------------------------------------------------

export interface WorkloadViewProps {
  className?: string;
}

// -- Helpers ------------------------------------------------------------------

function getBarColor(hours: number, capacity: number): string {
  if (hours <= capacity) return "bg-green-500";
  if (hours <= capacity * 1.2) return "bg-yellow-400";
  return "bg-red-500";
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function taskRangeForWeek(
  task: Task,
  weekStart: Date,
  weekEnd: Date,
): boolean {
  // Determine a [start, end] window for the task
  const dueRaw = task.dueDate;
  const startRaw = task.startDate;
  if (!dueRaw && !startRaw) return false;
  const start = startRaw ? new Date(startRaw) : new Date(dueRaw as string);
  const end = dueRaw ? new Date(dueRaw as string) : new Date(startRaw as string);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  // Normalize if reversed
  const s = start <= end ? start : end;
  const e = start <= end ? end : start;
  return rangesOverlap(s, e, weekStart, weekEnd);
}

function getEffortHours(task: Task): number {
  const v = (task as unknown as { effortHours?: unknown }).effortHours;
  if (typeof v === "number" && !isNaN(v)) return v;
  return 1;
}

function getCapacity(user: User): number {
  const v = (user as unknown as { weeklyCapacityHours?: unknown })
    .weeklyCapacityHours;
  if (typeof v === "number" && v > 0) return v;
  return 40;
}

function isGuest(user: User): boolean {
  const role = (user as unknown as { role?: unknown }).role;
  const guest = (user as unknown as { isGuest?: unknown }).isGuest;
  return role === "guest" || guest === true;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// -- Component ----------------------------------------------------------------

export function WorkloadView({ className }: WorkloadViewProps) {
  const users = useAppStore((s) => s.users);
  const tasks = useAppStore((s) => s.tasks);

  const weeks = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const start = startOfWeek(addWeeks(now, i), { weekStartsOn: 1 });
      const end = endOfWeek(addWeeks(now, i), { weekStartsOn: 1 });
      return {
        start,
        end,
        // Format like "Wk 15 Apr 7"
        label: `Wk ${format(start, "I")} ${format(start, "MMM d")}`,
      };
    });
  }, []);

  const activeUsers = useMemo(
    () => users.filter((u) => !isGuest(u)),
    [users],
  );

  // Build a map: userId -> week index -> hours
  const loads = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const user of activeUsers) {
      const perWeek = weeks.map(({ start, end }) => {
        let sum = 0;
        for (const task of tasks) {
          if (task.assigneeId !== user.id) continue;
          if (task.completed) continue;
          if (!taskRangeForWeek(task, start, end)) continue;
          sum += getEffortHours(task);
        }
        return sum;
      });
      map.set(user.id, perWeek);
    }
    return map;
  }, [activeUsers, tasks, weeks]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Team Workload
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Effort hours per user over the next 4 weeks
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
                Member
              </th>
              {weeks.map((w, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                >
                  {w.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeUsers.length === 0 && (
              <tr>
                <td
                  colSpan={weeks.length + 1}
                  className="px-4 py-6 text-center text-sm text-gray-400"
                >
                  No team members yet.
                </td>
              </tr>
            )}
            {activeUsers.map((user) => {
              const capacity = getCapacity(user);
              const perWeek = loads.get(user.id) ?? [];
              const thisWeekHours = perWeek[0] ?? 0;
              return (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 align-middle dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar as string}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {thisWeekHours} of {capacity} hours
                        </p>
                      </div>
                    </div>
                  </td>
                  {perWeek.map((hours, i) => {
                    if (hours === 0) {
                      return (
                        <td
                          key={i}
                          className="px-4 py-3 align-middle text-xs text-gray-400"
                        >
                          — Free
                        </td>
                      );
                    }
                    const color = getBarColor(hours, capacity);
                    const pct = Math.min((hours / capacity) * 100, 100);
                    return (
                      <td key={i} className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 text-xs font-medium text-gray-700 dark:text-gray-200">
                            {hours}h
                          </span>
                          <div className="relative h-2 flex-1 min-w-[60px] overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full transition-all ${color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
