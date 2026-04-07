"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DbTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; avatar: string | null } | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// View Nav
// ---------------------------------------------------------------------------

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "overview", label: "Overview" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/projects/${projectId}/${v.key}`}
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
// Helpers
// ---------------------------------------------------------------------------

const priorityColor: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#3b82f6",
  none: "#6b7280",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarPageClient({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: DbTask[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Only tasks with due dates
  const tasksWithDates = initialTasks.filter((t) => t.dueDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function getTasksForDay(day: number): DbTask[] {
    return tasksWithDates.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="calendar" />

      <div className="flex-1 overflow-auto p-6">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((d) => (
              <div
                key={d}
                className="px-3 py-2 text-center text-xs font-medium text-gray-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayTasks = day ? getTasksForDay(day) : [];
              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-2 ${
                    day === null ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  {day !== null && (
                    <>
                      <div
                        className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday(day)
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white ${
                              task.completed ? "opacity-60 line-through" : ""
                            }`}
                            style={{ backgroundColor: priorityColor[task.priority ?? "none"] }}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="px-1.5 text-[10px] text-gray-400">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {tasksWithDates.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-gray-900">No tasks with due dates</p>
            <p className="mt-1 text-sm text-gray-500">
              Add due dates to tasks to see them on the calendar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
