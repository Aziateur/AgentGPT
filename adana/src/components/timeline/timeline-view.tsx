"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  differenceInDays,
  differenceInCalendarDays,
  isToday,
  isBefore,
  isAfter,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import type { Task, Section, User, TaskPriority, Dependency } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ZoomLevel = "day" | "week" | "month";

export interface TimelineViewProps {
  sections?: Section[];
  tasks?: Task[];
  dependencies?: Dependency[];
  users?: Record<string, User>;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: Record<string, User> = {
  u1: { id: "u1", name: "Alice Chen", email: "alice@example.com", avatar: null },
  u2: { id: "u2", name: "Bob Park", email: "bob@example.com", avatar: null },
  u3: { id: "u3", name: "Carol Smith", email: "carol@example.com", avatar: null },
};

function makeTask(overrides: Partial<Task> & { id: string; title: string; sectionId: string }): Task {
  return {
    description: null, htmlDescription: null, status: "not_started", priority: "none",
    taskType: "task", completed: false, completedAt: null, assigneeId: null, projectId: "p1",
    parentTaskId: null, position: 0, dueDate: null, startDate: null, estimatedMinutes: null,
    actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [], dependencyIds: [],
    approvalStatus: null, approverIds: [], likes: [], attachmentCount: 0, commentCount: 0,
    customFieldValues: [], createdAt: "", updatedAt: "", creatorId: "u1", isTemplate: false,
    ...overrides,
  };
}

const MOCK_SECTIONS: Section[] = [
  { id: "s1", name: "To Do", projectId: "p1", position: 0, taskIds: ["t1", "t2"], createdAt: "" },
  { id: "s2", name: "In Progress", projectId: "p1", position: 1, taskIds: ["t3"], createdAt: "" },
  { id: "s3", name: "Review", projectId: "p1", position: 2, taskIds: [], createdAt: "" },
];

const MOCK_TASKS: Task[] = [
  makeTask({ id: "t1", title: "Research & discovery", sectionId: "s1", priority: "high", assigneeId: "u1", startDate: "2026-03-25", dueDate: "2026-04-04", position: 0 }),
  makeTask({ id: "t2", title: "Define requirements", sectionId: "s1", priority: "medium", assigneeId: "u2", startDate: "2026-04-02", dueDate: "2026-04-08", dependencyIds: ["dep1"], position: 1 }),
  makeTask({ id: "t3", title: "Backend API", sectionId: "s2", priority: "high", assigneeId: "u2", startDate: "2026-04-07", dueDate: "2026-04-18", position: 0 }),
  makeTask({ id: "t4", title: "Frontend implementation", sectionId: "s2", priority: "high", assigneeId: "u1", startDate: "2026-04-10", dueDate: "2026-04-22", dependencyIds: ["dep2"], position: 1 }),
  makeTask({ id: "t5", title: "Integration tests", sectionId: "s2", priority: "medium", assigneeId: "u3", startDate: "2026-04-20", dueDate: "2026-04-25", position: 2 }),
  makeTask({ id: "t6", title: "QA & bug fixes", sectionId: "s3", priority: "medium", assigneeId: "u3", startDate: "2026-04-23", dueDate: "2026-04-29", position: 0 }),
  makeTask({ id: "t7", title: "Production deploy", sectionId: "s3", priority: "high", assigneeId: "u2", startDate: "2026-04-30", dueDate: "2026-04-30", taskType: "milestone", position: 1 }),
];

const MOCK_DEPENDENCIES: Dependency[] = [
  { id: "d1", blockingTaskId: "t1", blockedTaskId: "t2", createdAt: "" },
  { id: "d2", blockingTaskId: "t2", blockedTaskId: "t3", createdAt: "" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: "bg-red-400",
  medium: "bg-orange-400",
  low: "bg-blue-400",
  none: "bg-indigo-400",
};

const SECTION_COLORS = ["bg-indigo-400", "bg-emerald-400", "bg-amber-400", "bg-pink-400", "bg-cyan-400"];

function getColumnWidth(zoom: ZoomLevel): number {
  switch (zoom) {
    case "day": return 40;
    case "week": return 120;
    case "month": return 180;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineView({
  sections: sectionsProp,
  tasks: tasksProp,
  dependencies: depsProp,
  users = MOCK_USERS,
  onTaskClick,
  className,
}: TimelineViewProps) {
  const sections = sectionsProp ?? MOCK_SECTIONS;
  const tasks = tasksProp ?? MOCK_TASKS;
  const dependencies = depsProp ?? MOCK_DEPENDENCIES;

  const [zoom, setZoom] = useState<ZoomLevel>("day");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute date range
  const { rangeStart, rangeEnd, columns } = useMemo(() => {
    const allDates: Date[] = [];
    for (const t of tasks) {
      if (t.startDate) allDates.push(new Date(t.startDate));
      if (t.dueDate) allDates.push(new Date(t.dueDate));
    }
    if (allDates.length === 0) {
      allDates.push(new Date());
    }

    const minDate = allDates.reduce((a, b) => (a < b ? a : b));
    const maxDate = allDates.reduce((a, b) => (a > b ? a : b));

    // Add padding
    const start = addDays(startOfDay(minDate), -7);
    const end = addDays(startOfDay(maxDate), 14);

    let cols: { date: Date; label: string }[] = [];
    if (zoom === "day") {
      const days = eachDayOfInterval({ start, end });
      cols = days.map((d) => ({ date: d, label: format(d, "d") }));
    } else if (zoom === "week") {
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      cols = weeks.map((d) => ({ date: d, label: format(d, "MMM d") }));
    } else {
      const months = eachMonthOfInterval({ start, end });
      cols = months.map((d) => ({ date: d, label: format(d, "MMM yyyy") }));
    }

    return { rangeStart: start, rangeEnd: end, columns: cols };
  }, [tasks, zoom]);

  const colWidth = getColumnWidth(zoom);
  const totalWidth = columns.length * colWidth;

  // Group tasks by section
  const tasksBySection = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const sec of sections) map[sec.id] = [];
    for (const t of tasks) {
      if (t.sectionId && map[t.sectionId]) map[t.sectionId].push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [sections, tasks]);

  // Build flat row list: section headers + tasks
  const rows: Array<{ type: "section"; section: Section } | { type: "task"; task: Task; sectionIndex: number }> = [];
  sections.sort((a, b) => (a.position as number) - (b.position as number)).forEach((sec, si) => {
    rows.push({ type: "section", section: sec });
    (tasksBySection[sec.id] ?? []).forEach((t) => {
      rows.push({ type: "task", task: t, sectionIndex: si });
    });
  });

  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 60;
  const SIDEBAR_WIDTH = 260;

  // Position a bar for a task
  function getBarStyle(task: Task) {
    const s = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null;
    const e = task.dueDate ? new Date(task.dueDate) : s;
    if (!s || !e) return null;

    const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) || 1;
    const startOffset = differenceInCalendarDays(s, rangeStart);
    const duration = Math.max(differenceInCalendarDays(e, s), 1);

    const pxPerDay = totalWidth / (columns.length * (zoom === "day" ? 1 : zoom === "week" ? 7 : 30));
    const left = (startOffset / totalDays) * totalWidth;
    const width = Math.max((duration / totalDays) * totalWidth, 8);

    return { left: Math.max(left, 0), width };
  }

  // Today line position
  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date());
    if (isBefore(today, rangeStart) || isAfter(today, rangeEnd)) return null;
    const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) || 1;
    const offset = differenceInCalendarDays(today, rangeStart);
    return (offset / totalDays) * totalWidth;
  }, [rangeStart, rangeEnd, totalWidth]);

  // Month headers for day zoom
  const monthHeaders = useMemo(() => {
    if (zoom !== "day") return [];
    const headers: { label: string; left: number; width: number }[] = [];
    let currentMonth = "";
    let startIdx = 0;
    columns.forEach((col, i) => {
      const m = format(col.date, "MMMM yyyy");
      if (m !== currentMonth) {
        if (currentMonth) {
          headers.push({ label: currentMonth, left: startIdx * colWidth, width: (i - startIdx) * colWidth });
        }
        currentMonth = m;
        startIdx = i;
      }
    });
    if (currentMonth) {
      headers.push({ label: currentMonth, left: startIdx * colWidth, width: (columns.length - startIdx) * colWidth });
    }
    return headers;
  }, [columns, zoom, colWidth]);

  // Dependency arrows (simple SVG lines)
  const taskRowIndex = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r, i) => {
      if (r.type === "task") map[r.task.id] = i;
    });
    return map;
  }, [rows]);

  const depLines = useMemo(() => {
    return dependencies.map((dep) => {
      const sourceTask = tasks.find((t) => t.id === dep.blockingTaskId);
      const targetTask = tasks.find((t) => t.id === dep.blockedTaskId);
      if (!sourceTask || !targetTask) return null;

      const sourceBar = getBarStyle(sourceTask);
      const targetBar = getBarStyle(targetTask);
      if (!sourceBar || !targetBar) return null;

      const sourceRow = taskRowIndex[dep.blockingTaskId];
      const targetRow = taskRowIndex[dep.blockedTaskId];
      if (sourceRow === undefined || targetRow === undefined) return null;

      const x1 = sourceBar.left + sourceBar.width;
      const y1 = sourceRow * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x2 = targetBar.left;
      const y2 = targetRow * ROW_HEIGHT + ROW_HEIGHT / 2;

      return { id: dep.id, x1, y1, x2, y2 };
    }).filter(Boolean) as Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>;
  }, [dependencies, tasks, taskRowIndex]);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-white", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-1">
          {(["day", "week", "month"] as ZoomLevel[]).map((level) => (
            <Button
              key={level}
              variant={zoom === level ? "primary" : "ghost"}
              size="sm"
              onClick={() => setZoom(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Zoom out">
            <span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (zoom === "day") setZoom("week");
                  else if (zoom === "week") setZoom("month");
                }}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </span>
          </Tooltip>
          <Tooltip content="Zoom in">
            <span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (zoom === "month") setZoom("week");
                  else if (zoom === "week") setZoom("day");
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - task names */}
        <div className="flex-shrink-0 border-r border-gray-200" style={{ width: SIDEBAR_WIDTH }}>
          {/* Sidebar header */}
          <div
            className="flex items-center border-b border-gray-200 bg-gray-50 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"
            style={{ height: HEADER_HEIGHT }}
          >
            Task
          </div>
          {/* Sidebar rows */}
          <div className="overflow-y-auto">
            {rows.map((row, i) => {
              if (row.type === "section") {
                return (
                  <div
                    key={row.section.id}
                    className="flex items-center bg-gray-50 px-4 text-xs font-semibold text-gray-700 border-b border-gray-100"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {row.section.name}
                  </div>
                );
              }
              const task = row.task;
              const member = task.assigneeId ? users[task.assigneeId] : null;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onTaskClick?.(task.id)}
                >
                  {member && (
                    <Avatar size="sm" name={member.name} src={member.avatar as string | undefined} />
                  )}
                  <span className="truncate text-sm text-gray-800">{task.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - timeline grid */}
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Column headers */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200" style={{ height: HEADER_HEIGHT }}>
              {/* Month row (day zoom) */}
              {zoom === "day" && (
                <div className="relative flex border-b border-gray-100" style={{ height: HEADER_HEIGHT / 2 }}>
                  {monthHeaders.map((mh, i) => (
                    <div
                      key={i}
                      className="absolute flex items-center px-2 text-xs font-semibold text-gray-600 border-r border-gray-100"
                      style={{ left: mh.left, width: mh.width, height: HEADER_HEIGHT / 2 }}
                    >
                      {mh.label}
                    </div>
                  ))}
                </div>
              )}
              {/* Date columns */}
              <div
                className="relative flex"
                style={{ height: zoom === "day" ? HEADER_HEIGHT / 2 : HEADER_HEIGHT }}
              >
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center border-r border-gray-100 text-xs text-gray-500",
                      isToday(col.date) && "bg-red-50 font-semibold text-red-600"
                    )}
                    style={{ width: colWidth, flexShrink: 0 }}
                  >
                    {zoom === "day" ? (
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[10px] text-gray-400">{format(col.date, "EEE")}</span>
                        <span>{col.label}</span>
                      </div>
                    ) : (
                      col.label
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows with bars */}
            <div className="relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex pointer-events-none" aria-hidden>
                {columns.map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-gray-50"
                    style={{ width: colWidth, flexShrink: 0, height: rows.length * ROW_HEIGHT }}
                  />
                ))}
              </div>

              {/* Today line */}
              {todayOffset !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20 pointer-events-none"
                  style={{ left: todayOffset, height: rows.length * ROW_HEIGHT }}
                />
              )}

              {/* Dependency arrows */}
              <svg
                className="absolute top-0 left-0 pointer-events-none z-10"
                width={totalWidth}
                height={rows.length * ROW_HEIGHT}
                style={{ overflow: "visible" }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>
                {depLines.map((line) => {
                  const midX = (line.x1 + line.x2) / 2;
                  return (
                    <path
                      key={line.id}
                      d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </svg>

              {/* Task rows */}
              {rows.map((row, i) => {
                if (row.type === "section") {
                  return (
                    <div
                      key={row.section.id}
                      className="relative bg-gray-50/60 border-b border-gray-100"
                      style={{ height: ROW_HEIGHT }}
                    />
                  );
                }

                const task = row.task;
                const barStyle = getBarStyle(task);
                const colorClass = SECTION_COLORS[row.sectionIndex % SECTION_COLORS.length];

                return (
                  <div
                    key={task.id}
                    className="relative border-b border-gray-50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {barStyle && (
                      <Tooltip content={`${task.title}${task.startDate ? ` (${format(new Date(task.startDate), "MMM d")} - ${task.dueDate ? format(new Date(task.dueDate), "MMM d") : "?"})` : ""}`}>
                        <button
                          className={cn(
                            "absolute top-1.5 h-[26px] rounded-md shadow-sm cursor-pointer hover:brightness-110 transition-all flex items-center px-2 text-white text-[11px] font-medium truncate",
                            task.taskType === "milestone" ? "bg-amber-500 rounded-full w-6 h-6 top-2 px-0 justify-center" : colorClass,
                            task.completed && "opacity-60"
                          )}
                          style={task.taskType === "milestone"
                            ? { left: barStyle.left - 12, width: 26 }
                            : { left: barStyle.left, width: barStyle.width }
                          }
                          onClick={() => onTaskClick?.(task.id)}
                        >
                          {task.taskType === "milestone" ? (
                            <span className="text-[10px]">&#9670;</span>
                          ) : (
                            barStyle.width > 60 ? task.title : ""
                          )}
                        </button>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
