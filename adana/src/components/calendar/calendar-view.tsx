"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import type { Task, TaskPriority } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarViewProps {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Priority colors for chips
// ---------------------------------------------------------------------------

const PRIORITY_CHIP_COLORS: Record<string, string> = {
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
  projectId,
  onTaskClick,
  className,
}: CalendarViewProps) {
  const tasks = useAppStore((s) => s.getProjectTasks(projectId));
  const updateTask = useAppStore((s) => s.updateTask);
  const createTask = useAppStore((s) => s.createTask);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calendarStart.getTime(), calendarEnd.getTime()]
  );

  // Ensure 6 rows x 7 cols = 42 cells
  const cells = useMemo(() => {
    if (days.length >= 42) return days.slice(0, 42);
    const extra: Date[] = [];
    const last = days[days.length - 1];
    for (let i = 1; i <= 42 - days.length; i++) {
      extra.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + i));
    }
    return [...days, ...extra];
  }, [days]);

  // Tasks with due date only, grouped
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  useEffect(() => {
    if (creatingKey && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creatingKey]);

  const goToday = () => setCurrentDate(new Date());

  // Drag handlers
  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }

  function handleDragEnd() {
    setDragTaskId(null);
    setDragOverKey(null);
  }

  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverKey !== key) setDragOverKey(key);
  }

  function handleDrop(e: React.DragEvent, cellDate: Date) {
    e.preventDefault();
    const taskId =
      dragTaskId || e.dataTransfer.getData("text/plain") || null;
    setDragOverKey(null);
    setDragTaskId(null);
    if (!taskId) return;
    // Normalize to midday to avoid timezone off-by-one issues
    const newDate = new Date(
      cellDate.getFullYear(),
      cellDate.getMonth(),
      cellDate.getDate(),
      12,
      0,
      0
    );
    updateTask(taskId, { dueDate: newDate.toISOString() });
  }

  // Create task inline
  function openCreate(cellDate: Date) {
    setCreatingKey(format(cellDate, "yyyy-MM-dd"));
    setNewTitle("");
  }

  function cancelCreate() {
    setCreatingKey(null);
    setNewTitle("");
  }

  function submitCreate(cellDate: Date) {
    const title = newTitle.trim();
    if (!title) {
      cancelCreate();
      return;
    }
    const newDate = new Date(
      cellDate.getFullYear(),
      cellDate.getMonth(),
      cellDate.getDate(),
      12,
      0,
      0
    );
    createTask({
      title,
      dueDate: newDate.toISOString(),
      projectId,
    });
    cancelCreate();
  }

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

      {/* Calendar grid: 6 rows x 7 cols */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {cells.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const isDragOver = dragOverKey === dateKey;
          const isCreating = creatingKey === dateKey;

          return (
            <div
              key={dateKey}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={() => {
                if (dragOverKey === dateKey) setDragOverKey(null);
              }}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => {
                if (!isCreating) openCreate(day);
              }}
              className={cn(
                "group relative border-b border-r border-gray-100 p-1.5 min-h-[100px] transition-colors cursor-pointer overflow-hidden",
                !inMonth && "bg-gray-50/50",
                today && "bg-indigo-50/40",
                isDragOver && "bg-indigo-100 ring-2 ring-inset ring-indigo-300",
                "hover:bg-gray-50"
              )}
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
              </div>

              {/* Task chips */}
              <div className="flex flex-col gap-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const priorityKey = (task.priority ?? "none") as string;
                  return (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick?.(task.id);
                      }}
                      title={task.title}
                      className={cn(
                        "w-full rounded px-1.5 py-0.5 text-left text-[11px] font-medium truncate border transition-colors hover:brightness-95 cursor-grab active:cursor-grabbing",
                        PRIORITY_CHIP_COLORS[priorityKey] ??
                          PRIORITY_CHIP_COLORS.none,
                        task.completed && "opacity-50 line-through",
                        dragTaskId === task.id && "opacity-40"
                      )}
                    >
                      {task.taskType === "milestone" && (
                        <span className="mr-0.5">&#9670;</span>
                      )}
                      {task.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && !isCreating && (
                  <span className="text-[10px] text-gray-500 px-1.5">
                    +{dayTasks.length - 3} more
                  </span>
                )}

                {/* Inline create input */}
                {isCreating && (
                  <input
                    ref={inputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        submitCreate(day);
                      } else if (e.key === "Escape") {
                        cancelCreate();
                      }
                    }}
                    onBlur={() => cancelCreate()}
                    placeholder="Task title..."
                    className="w-full rounded border border-indigo-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
