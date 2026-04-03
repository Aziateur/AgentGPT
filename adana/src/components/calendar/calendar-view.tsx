"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import type { Task, User, TaskPriority } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarViewProps {
  tasks?: Task[];
  users?: Record<string, User>;
  onTaskClick?: (taskId: string) => void;
  onDayClick?: (date: Date) => void;
  onAddTask?: (date: Date) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: Record<string, User> = {
  u1: { id: "u1", name: "Alice Chen", email: "alice@example.com", avatarUrl: null, bio: null, role: "member", teamIds: ["t1"], createdAt: "", updatedAt: "" },
  u2: { id: "u2", name: "Bob Park", email: "bob@example.com", avatarUrl: null, bio: null, role: "member", teamIds: ["t1"], createdAt: "", updatedAt: "" },
  u3: { id: "u3", name: "Carol Smith", email: "carol@example.com", avatarUrl: null, bio: null, role: "member", teamIds: ["t1"], createdAt: "", updatedAt: "" },
};

function makeTask(overrides: Partial<Task> & { id: string; name: string }): Task {
  return {
    description: null, htmlDescription: null, status: "not_started", priority: "none",
    type: "task", completed: false, completedAt: null, assigneeId: null, projectId: "p1",
    sectionId: null, parentTaskId: null, order: 0, dueDate: null, startDate: null,
    estimatedMinutes: null, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [],
    dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0, attachmentCount: 0,
    commentCount: 0, customFieldValues: [], createdAt: "", updatedAt: "",
    ...overrides,
  };
}

const MOCK_TASKS: Task[] = [
  makeTask({ id: "t1", name: "Design review", priority: "high", assigneeId: "u1", dueDate: "2026-04-03" }),
  makeTask({ id: "t2", name: "Sprint planning", priority: "medium", assigneeId: "u2", dueDate: "2026-04-03" }),
  makeTask({ id: "t3", name: "API endpoints", priority: "high", assigneeId: "u2", dueDate: "2026-04-05" }),
  makeTask({ id: "t4", name: "Write tests", priority: "low", assigneeId: "u3", dueDate: "2026-04-08" }),
  makeTask({ id: "t5", name: "Deploy staging", priority: "medium", dueDate: "2026-04-10" }),
  makeTask({ id: "t6", name: "Client demo", priority: "high", assigneeId: "u1", dueDate: "2026-04-14", type: "milestone" }),
  makeTask({ id: "t7", name: "Bug triage", priority: "medium", assigneeId: "u3", dueDate: "2026-04-15" }),
  makeTask({ id: "t8", name: "Release v2.0", priority: "high", assigneeId: "u2", dueDate: "2026-04-22", type: "milestone" }),
  makeTask({ id: "t9", name: "Retrospective", priority: "low", dueDate: "2026-04-25" }),
  makeTask({ id: "t10", name: "Update docs", priority: "low", assigneeId: "u1", dueDate: "2026-04-28" }),
  makeTask({ id: "t11", name: "Database migration", priority: "high", assigneeId: "u2", dueDate: "2026-04-10" }),
  makeTask({ id: "t12", name: "Performance audit", priority: "medium", assigneeId: "u3", dueDate: "2026-04-17" }),
];

// ---------------------------------------------------------------------------
// Priority colors for chips
// ---------------------------------------------------------------------------

const PRIORITY_CHIP_COLORS: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
  none: "bg-gray-100 text-gray-700 border-gray-200",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarView({
  tasks: tasksProp,
  users = MOCK_USERS,
  onTaskClick,
  onDayClick,
  onAddTask,
  className,
}: CalendarViewProps) {
  const tasks = tasksProp ?? MOCK_TASKS;
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()]
  );

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.dueDate) {
        const key = format(new Date(task.dueDate), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [tasks]);

  const goToday = () => setCurrentDate(new Date());

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      {/* Header / navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                "group relative border-b border-r border-gray-100 p-1.5 min-h-[100px] transition-colors cursor-pointer",
                !inMonth && "bg-gray-50/50",
                today && "bg-indigo-50/40",
                "hover:bg-gray-50"
              )}
              onClick={() => {
                onDayClick?.(day);
              }}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    today && "bg-indigo-600 text-white",
                    !today && inMonth && "text-gray-900",
                    !today && !inMonth && "text-gray-400"
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Add task button on hover */}
                <button
                  className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask?.(day);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Task chips */}
              <div className="flex flex-col gap-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const assignee = task.assigneeId ? users[task.assigneeId] : null;
                  return (
                    <Tooltip
                      key={task.id}
                      content={
                        <div className="text-xs">
                          <div className="font-medium">{task.name}</div>
                          {assignee && <div className="text-gray-300 mt-0.5">{assignee.name}</div>}
                        </div>
                      }
                    >
                      <button
                        className={cn(
                          "w-full rounded px-1.5 py-0.5 text-left text-[11px] font-medium truncate border transition-colors hover:brightness-95",
                          PRIORITY_CHIP_COLORS[task.priority],
                          task.completed && "opacity-50 line-through"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task.id);
                        }}
                      >
                        {task.type === "milestone" && (
                          <span className="mr-0.5">&#9670;</span>
                        )}
                        {task.name}
                      </button>
                    </Tooltip>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-gray-500 px-1.5">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
