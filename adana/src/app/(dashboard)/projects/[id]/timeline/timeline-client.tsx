"use client";

import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DbSection {
  id: string;
  name: string;
  position: number;
  projectId: string;
  [key: string]: unknown;
}

interface DbTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  assigneeId?: string | null;
  sectionId?: string | null;
  position: number;
  assignee?: { id: string; name: string; avatar: string | null } | null;
  [key: string]: unknown;
}

interface DbDependency {
  id: string;
  blockedTaskId: string;
  blockingTaskId: string;
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

const SECTION_COLORS = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelinePageClient({
  projectId,
  initialSections,
  initialTasks,
  initialDependencies,
}: {
  projectId: string;
  initialSections: DbSection[];
  initialTasks: DbTask[];
  initialDependencies: DbDependency[];
}) {
  // Build timeline items from tasks that have dates
  const tasksWithDates = initialTasks.filter((t) => t.startDate || t.dueDate);

  // Calculate date range
  const allDates: Date[] = [];
  for (const t of tasksWithDates) {
    if (t.startDate) allDates.push(new Date(t.startDate));
    if (t.dueDate) allDates.push(new Date(t.dueDate));
  }
  // Fallback if no dates
  if (allDates.length === 0) {
    allDates.push(new Date());
    allDates.push(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000));
  }

  const minDate = allDates.reduce((a, b) => (a < b ? a : b));
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b));

  // Add padding
  const startDate = new Date(minDate);
  startDate.setDate(startDate.getDate() - 3);
  const endDate = new Date(maxDate);
  endDate.setDate(endDate.getDate() + 7);

  const totalDays = Math.max(daysBetween(startDate, endDate), 14);

  // Generate day labels
  const dayLabels = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  // Weeks
  const weekCount = Math.ceil(totalDays / 7);
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  });

  // Group tasks by section
  const sectionMap: Record<string, DbTask[]> = {};
  for (const sec of initialSections) {
    sectionMap[sec.id] = [];
  }
  sectionMap["_unsectioned"] = [];
  for (const t of tasksWithDates) {
    const key = t.sectionId && sectionMap[t.sectionId] ? t.sectionId : "_unsectioned";
    sectionMap[key].push(t);
  }

  // Build flat list with section headers
  type TimelineRow = { type: "section"; name: string } | { type: "task"; task: DbTask; colorIdx: number };
  const rows: TimelineRow[] = [];
  let colorIdx = 0;

  for (const sec of initialSections) {
    const secTasks = sectionMap[sec.id] ?? [];
    if (secTasks.length === 0) continue;
    rows.push({ type: "section", name: sec.name });
    for (const t of secTasks) {
      rows.push({ type: "task", task: t, colorIdx });
    }
    colorIdx++;
  }
  // Unsectioned tasks
  const unsectioned = sectionMap["_unsectioned"] ?? [];
  if (unsectioned.length > 0) {
    rows.push({ type: "section", name: "Other" });
    for (const t of unsectioned) {
      rows.push({ type: "task", task: t, colorIdx });
    }
  }

  // Show message if no tasks with dates
  if (tasksWithDates.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <ViewNav projectId={projectId} active="timeline" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">No tasks with dates</p>
            <p className="mt-1 text-sm text-gray-500">
              Add start dates and due dates to tasks to see them on the timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="timeline" />

      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px] p-6">
          {/* Week headers */}
          <div className="mb-1 flex">
            <div className="w-52 shrink-0" />
            <div className="flex flex-1">
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-gray-200 px-2 text-xs font-medium text-gray-500"
                  style={{ minWidth: `${(7 / totalDays) * 100}%` }}
                >
                  {week}
                </div>
              ))}
            </div>
          </div>

          {/* Day grid header */}
          <div className="mb-2 flex">
            <div className="w-52 shrink-0" />
            <div className="flex flex-1">
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-gray-100 text-center text-[10px] text-gray-400"
                >
                  {i % 2 === 0 ? label : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-1">
            {rows.map((row, i) => {
              if (row.type === "section") {
                return (
                  <div key={`section-${i}`} className="flex items-center py-1">
                    <div className="w-52 shrink-0 pr-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {row.name}
                      </h3>
                    </div>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                );
              }

              const { task, colorIdx: ci } = row;
              const taskStart = task.startDate
                ? new Date(task.startDate)
                : task.dueDate
                ? new Date(task.dueDate)
                : startDate;
              const taskEnd = task.dueDate
                ? new Date(task.dueDate)
                : taskStart;
              const startDay = daysBetween(startDate, taskStart);
              const durationDays = Math.max(daysBetween(taskStart, taskEnd), 1);
              const color = SECTION_COLORS[ci % SECTION_COLORS.length];

              return (
                <div key={task.id} className="flex items-center">
                  {/* Task label */}
                  <div className="w-52 shrink-0 pr-3">
                    <div className="flex items-center gap-2">
                      {task.assignee && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                          {task.assignee.name?.[0] ?? "?"}
                        </div>
                      )}
                      <span className="truncate text-sm font-medium text-gray-900">
                        {task.title}
                      </span>
                    </div>
                  </div>

                  {/* Gantt bar area */}
                  <div className="relative flex h-8 flex-1">
                    {/* Grid lines */}
                    {dayLabels.map((_, j) => (
                      <div
                        key={j}
                        className="absolute top-0 h-full border-l border-gray-50"
                        style={{ left: `${(j / totalDays) * 100}%` }}
                      />
                    ))}
                    {/* Bar */}
                    <div
                      className="absolute top-1 flex h-6 items-center rounded-md px-2 text-[10px] font-medium text-white"
                      style={{
                        left: `${(startDay / totalDays) * 100}%`,
                        width: `${(durationDays / totalDays) * 100}%`,
                        backgroundColor: color,
                        minWidth: "8px",
                      }}
                    >
                      {durationDays >= 3 && task.completed ? "Done" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dependency arrows (simple) */}
          {initialDependencies.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              <span className="font-medium">Dependencies:</span>{" "}
              {initialDependencies.map((dep, i) => {
                const blocker = initialTasks.find((t) => t.id === dep.blockingTaskId);
                const blocked = initialTasks.find((t) => t.id === dep.blockedTaskId);
                if (!blocker || !blocked) return null;
                return (
                  <span key={dep.id}>
                    {i > 0 && " | "}
                    {blocker.title} &rarr; {blocked.title}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
