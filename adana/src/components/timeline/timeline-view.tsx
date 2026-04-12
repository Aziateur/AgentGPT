"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { Task } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ZoomLevel = "day" | "week" | "month";

const ZOOM_PX_PER_DAY: Record<ZoomLevel, number> = {
  day: 50,
  week: 24,
  month: 8,
};

export interface TimelineViewProps {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

interface DragState {
  taskId: string;
  startX: number;
  originalStart: string;
  originalDue: string;
  deltaDays: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86400000;

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toISODate(d: Date): string {
  return startOfDay(d).toISOString();
}

// ---------------------------------------------------------------------------
// Critical path computation (forward/backward pass)
// ---------------------------------------------------------------------------

interface CPMNode {
  id: string;
  duration: number; // days
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  slack: number;
}

function computeCriticalPath(
  tasks: Task[],
  deps: { blockerTaskId: string; blockedTaskId: string }[]
): Record<string, CPMNode> {
  const taskIds = new Set(tasks.map((t) => t.id));
  const relevantDeps = deps.filter(
    (d) => taskIds.has(d.blockerTaskId) && taskIds.has(d.blockedTaskId)
  );

  // Build adjacency
  const successors: Record<string, string[]> = {};
  const predecessors: Record<string, string[]> = {};
  for (const t of tasks) {
    successors[t.id] = [];
    predecessors[t.id] = [];
  }
  for (const d of relevantDeps) {
    successors[d.blockerTaskId].push(d.blockedTaskId);
    predecessors[d.blockedTaskId].push(d.blockerTaskId);
  }

  // Topological sort (Kahn's)
  const indeg: Record<string, number> = {};
  for (const t of tasks) indeg[t.id] = predecessors[t.id].length;
  const queue: string[] = tasks.filter((t) => indeg[t.id] === 0).map((t) => t.id);
  const topo: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    topo.push(id);
    for (const s of successors[id]) {
      indeg[s]--;
      if (indeg[s] === 0) queue.push(s);
    }
  }
  // If there's a cycle, topo will have fewer nodes; just append the rest to avoid crashes
  if (topo.length < tasks.length) {
    for (const t of tasks) if (!topo.includes(t.id)) topo.push(t.id);
  }

  const nodes: Record<string, CPMNode> = {};
  for (const t of tasks) {
    const s = t.startDate ? new Date(t.startDate) : new Date();
    const e = t.dueDate ? new Date(t.dueDate) : s;
    const dur = Math.max(diffDays(e, s), 1);
    nodes[t.id] = {
      id: t.id,
      duration: dur,
      earlyStart: 0,
      earlyFinish: dur,
      lateStart: 0,
      lateFinish: 0,
      slack: 0,
    };
  }

  // Forward pass
  for (const id of topo) {
    const preds = predecessors[id];
    const es = preds.length === 0 ? 0 : Math.max(...preds.map((p) => nodes[p].earlyFinish));
    nodes[id].earlyStart = es;
    nodes[id].earlyFinish = es + nodes[id].duration;
  }

  // Project finish time
  const projectFinish = Math.max(0, ...Object.values(nodes).map((n) => n.earlyFinish));

  // Backward pass
  for (let i = topo.length - 1; i >= 0; i--) {
    const id = topo[i];
    const succs = successors[id];
    const lf =
      succs.length === 0 ? projectFinish : Math.min(...succs.map((s) => nodes[s].lateStart));
    nodes[id].lateFinish = lf;
    nodes[id].lateStart = lf - nodes[id].duration;
    nodes[id].slack = nodes[id].lateStart - nodes[id].earlyStart;
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineView({ projectId, onTaskClick, className }: TimelineViewProps) {
  const allTasks = useAppStore((s) => s.getProjectTasks(projectId));
  const taskDeps = useAppStore((s) => s.taskDeps);
  const updateTask = useAppStore((s) => s.updateTask);

  // Only tasks with both startDate and dueDate
  const tasks = useMemo(
    () => allTasks.filter((t) => t.startDate && t.dueDate),
    [allTasks]
  );

  // Only deps whose endpoints are both present in tasks
  const relevantDeps = useMemo(() => {
    const ids = new Set(tasks.map((t) => t.id));
    return taskDeps.filter((d) => ids.has(d.blockerTaskId) && ids.has(d.blockedTaskId));
  }, [tasks, taskDeps]);

  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pxPerDay = ZOOM_PX_PER_DAY[zoom];

  // Date range
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    const dates: Date[] = [];
    for (const t of tasks) {
      if (t.startDate) dates.push(new Date(t.startDate));
      if (t.dueDate) dates.push(new Date(t.dueDate));
    }
    if (dates.length === 0) {
      const now = startOfDay(new Date());
      return { rangeStart: now, rangeEnd: addDays(now, 30), totalDays: 30 };
    }
    const min = dates.reduce((a, b) => (a < b ? a : b));
    const max = dates.reduce((a, b) => (a > b ? a : b));
    const start = addDays(startOfDay(min), -3);
    const end = addDays(startOfDay(max), 7);
    return { rangeStart: start, rangeEnd: end, totalDays: Math.max(diffDays(end, start), 1) };
  }, [tasks]);

  const totalWidth = totalDays * pxPerDay;

  // Column headers based on zoom
  const columns = useMemo(() => {
    const cols: { date: Date; label: string; isToday: boolean }[] = [];
    const today = startOfDay(new Date());
    if (zoom === "day") {
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(rangeStart, i);
        cols.push({ date: d, label: String(d.getDate()), isToday: isSameDay(d, today) });
      }
    } else if (zoom === "week") {
      for (let i = 0; i < totalDays; i += 7) {
        const d = addDays(rangeStart, i);
        cols.push({ date: d, label: formatShort(d), isToday: false });
      }
    } else {
      // month - step per month
      let d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (d <= rangeEnd) {
        cols.push({ date: new Date(d), label: formatMonth(d), isToday: false });
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    }
    return cols;
  }, [zoom, rangeStart, rangeEnd, totalDays]);

  const colWidth =
    zoom === "day" ? pxPerDay : zoom === "week" ? pxPerDay * 7 : pxPerDay * 30;

  // Critical path
  const cpm = useMemo(() => computeCriticalPath(tasks, relevantDeps), [tasks, relevantDeps]);
  const projectFinish = useMemo(
    () => Math.max(0, ...Object.values(cpm).map((n) => n.earlyFinish)),
    [cpm]
  );
  const isOnCriticalPath = useCallback(
    (taskId: string) => {
      const n = cpm[taskId];
      if (!n) return false;
      // Must have slack 0 AND be reachable to/from the critical endpoints
      return projectFinish > 0 && n.slack === 0 && n.earlyFinish === projectFinish
        ? true
        : n.slack === 0;
    },
    [cpm, projectFinish]
  );

  // Sort tasks by startDate for row order
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const sa = a.startDate ? new Date(a.startDate).getTime() : 0;
        const sb = b.startDate ? new Date(b.startDate).getTime() : 0;
        return sa - sb;
      }),
    [tasks]
  );

  const taskRowIndex = useMemo(() => {
    const m: Record<string, number> = {};
    sortedTasks.forEach((t, i) => {
      m[t.id] = i;
    });
    return m;
  }, [sortedTasks]);

  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 40;
  const SIDEBAR_WIDTH = 240;
  const BAR_HEIGHT = 24;

  // Bar position for a task, with optional drag offset
  const getBarPos = useCallback(
    (task: Task) => {
      if (!task.startDate || !task.dueDate) return null;
      let s = new Date(task.startDate);
      let e = new Date(task.dueDate);
      if (dragState && dragState.taskId === task.id) {
        s = addDays(s, dragState.deltaDays);
        e = addDays(e, dragState.deltaDays);
      }
      const left = diffDays(s, rangeStart) * pxPerDay;
      const width = Math.max(diffDays(e, s) * pxPerDay, 8);
      return { left, width };
    },
    [dragState, rangeStart, pxPerDay]
  );

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, task: Task) => {
    if (!task.startDate || !task.dueDate) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      taskId: task.id,
      startX: e.clientX,
      originalStart: task.startDate,
      originalDue: task.dueDate,
      deltaDays: 0,
    });
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaPx / pxPerDay);
      if (deltaDays !== dragState.deltaDays) {
        setDragState({ ...dragState, deltaDays });
      }
    };

    const handleMouseUp = () => {
      if (dragState.deltaDays !== 0) {
        const newStart = toISODate(addDays(new Date(dragState.originalStart), dragState.deltaDays));
        const newDue = toISODate(addDays(new Date(dragState.originalDue), dragState.deltaDays));
        void updateTask(dragState.taskId, { startDate: newStart, dueDate: newDue });
      }
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, pxPerDay, updateTask]);

  // Today line
  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date());
    if (today < rangeStart || today > rangeEnd) return null;
    return diffDays(today, rangeStart) * pxPerDay;
  }, [rangeStart, rangeEnd, pxPerDay]);

  // Dependency arrows
  const depArrows = useMemo(() => {
    return relevantDeps
      .map((dep) => {
        const blocker = tasks.find((t) => t.id === dep.blockerTaskId);
        const blocked = tasks.find((t) => t.id === dep.blockedTaskId);
        if (!blocker || !blocked) return null;
        const bPos = getBarPos(blocker);
        const tPos = getBarPos(blocked);
        if (!bPos || !tPos) return null;
        const bRow = taskRowIndex[blocker.id];
        const tRow = taskRowIndex[blocked.id];
        if (bRow === undefined || tRow === undefined) return null;
        const x1 = bPos.left + bPos.width;
        const y1 = bRow * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x2 = tPos.left;
        const y2 = tRow * ROW_HEIGHT + ROW_HEIGHT / 2;
        return { id: dep.id, x1, y1, x2, y2 };
      })
      .filter((x): x is { id: string; x1: number; y1: number; x2: number; y2: number } => x !== null);
  }, [relevantDeps, tasks, getBarPos, taskRowIndex]);

  if (tasks.length === 0) {
    return (
      <div className={cn("flex h-full flex-col items-center justify-center bg-white", className)}>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">No tasks with dates</p>
          <p className="mt-1 text-sm text-gray-500">
            Add start dates and due dates to tasks to see them on the timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-white", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-1">
          {(["day", "week", "month"] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setZoom(level)}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium capitalize transition",
                zoom === level
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-red-500" />
            Critical path
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-indigo-500" />
            Task
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex-shrink-0 border-r border-gray-200" style={{ width: SIDEBAR_WIDTH }}>
          <div
            className="flex items-center border-b border-gray-200 bg-gray-50 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500"
            style={{ height: HEADER_HEIGHT }}
          >
            Task
          </div>
          <div>
            {sortedTasks.map((task) => {
              const critical = isOnCriticalPath(task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 border-b border-gray-50 px-4 hover:bg-gray-50"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onTaskClick?.(task.id)}
                >
                  {critical && (
                    <span
                      className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-red-500"
                      title="On critical path"
                    />
                  )}
                  <span className="truncate text-sm text-gray-800">{task.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex border-b border-gray-200 bg-white"
              style={{ height: HEADER_HEIGHT }}
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-center border-r border-gray-100 text-xs text-gray-500",
                    col.isToday && "bg-red-50 font-semibold text-red-600"
                  )}
                  style={{ width: colWidth, flexShrink: 0 }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Rows + bars */}
            <div
              className="relative"
              style={{ height: sortedTasks.length * ROW_HEIGHT, width: totalWidth }}
            >
              {/* Row backgrounds */}
              {sortedTasks.map((task, i) => (
                <div
                  key={`row-${task.id}`}
                  className="absolute left-0 right-0 border-b border-gray-50"
                  style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              ))}

              {/* Today line */}
              {todayOffset !== null && (
                <div
                  className="pointer-events-none absolute top-0 z-20 w-0.5 bg-red-400"
                  style={{ left: todayOffset, height: sortedTasks.length * ROW_HEIGHT }}
                />
              )}

              {/* Dependency arrows */}
              <svg
                className="pointer-events-none absolute left-0 top-0 z-10"
                width={totalWidth}
                height={sortedTasks.length * ROW_HEIGHT}
                style={{ overflow: "visible" }}
              >
                <defs>
                  <marker
                    id="tl-arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>
                {depArrows.map((arr) => {
                  const midX = (arr.x1 + arr.x2) / 2;
                  return (
                    <path
                      key={arr.id}
                      d={`M ${arr.x1} ${arr.y1} C ${midX} ${arr.y1}, ${midX} ${arr.y2}, ${arr.x2} ${arr.y2}`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      markerEnd="url(#tl-arrowhead)"
                    />
                  );
                })}
              </svg>

              {/* Task bars */}
              {sortedTasks.map((task, i) => {
                const pos = getBarPos(task);
                if (!pos) return null;
                const critical = isOnCriticalPath(task.id);
                const dragging = dragState?.taskId === task.id;
                const top = i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
                return (
                  <div
                    key={`bar-${task.id}`}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => handleMouseDown(e, task)}
                    onClick={(e) => {
                      // Only treat as click if no drag happened
                      if (!dragState || dragState.deltaDays === 0) {
                        onTaskClick?.(task.id);
                      }
                      e.stopPropagation();
                    }}
                    className={cn(
                      "absolute flex items-center rounded-md px-2 text-[11px] font-medium text-white shadow-sm transition-opacity",
                      "cursor-grab active:cursor-grabbing hover:brightness-110",
                      critical ? "bg-red-500" : "bg-indigo-500",
                      task.completed && "opacity-60",
                      dragging && "z-30 ring-2 ring-indigo-300"
                    )}
                    style={{
                      left: pos.left,
                      width: pos.width,
                      top,
                      height: BAR_HEIGHT,
                    }}
                    title={`${task.title}${
                      task.startDate
                        ? ` (${formatShort(new Date(task.startDate))} - ${
                            task.dueDate ? formatShort(new Date(task.dueDate)) : "?"
                          })`
                        : ""
                    }`}
                  >
                    <span className="truncate">
                      {pos.width > 50 ? task.title : ""}
                    </span>
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
