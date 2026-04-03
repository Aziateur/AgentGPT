"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

// -- Mock data ----------------------------------------------------------------

interface TimelineTask {
  id: string;
  name: string;
  startDay: number; // offset from timeline start
  durationDays: number;
  color: string;
  assignee: string;
  progress: number;
}

const timelineTasks: TimelineTask[] = [
  { id: "t1", name: "Research & Discovery", startDay: 0, durationDays: 5, color: "#4f46e5", assignee: "S", progress: 100 },
  { id: "t2", name: "Design wireframes", startDay: 3, durationDays: 7, color: "#059669", assignee: "A", progress: 60 },
  { id: "t3", name: "Build navigation", startDay: 8, durationDays: 4, color: "#d97706", assignee: "D", progress: 30 },
  { id: "t4", name: "API integration", startDay: 10, durationDays: 8, color: "#dc2626", assignee: "J", progress: 10 },
  { id: "t5", name: "Testing", startDay: 16, durationDays: 5, color: "#7c3aed", assignee: "T", progress: 0 },
  { id: "t6", name: "Documentation", startDay: 18, durationDays: 4, color: "#0891b2", assignee: "A", progress: 0 },
  { id: "t7", name: "Launch prep", startDay: 21, durationDays: 3, color: "#be185d", assignee: "D", progress: 0 },
];

const totalDays = 28;

// -- View nav -----------------------------------------------------------------

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

// -- Component ----------------------------------------------------------------

export default function ProjectTimelinePage() {
  const params = useParams();
  const projectId = params.id as string;

  // Generate day labels starting from "today"
  const startDate = new Date();
  const dayLabels = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  // Weeks
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  });

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

          {/* Tasks */}
          <div className="space-y-2">
            {timelineTasks.map((task) => (
              <div key={task.id} className="flex items-center">
                {/* Task label */}
                <div className="w-52 shrink-0 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                      {task.assignee}
                    </div>
                    <span className="truncate text-sm font-medium text-gray-900">
                      {task.name}
                    </span>
                  </div>
                </div>

                {/* Gantt bar area */}
                <div className="relative flex h-8 flex-1">
                  {/* Grid lines */}
                  {dayLabels.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-l border-gray-50"
                      style={{ left: `${(i / totalDays) * 100}%` }}
                    />
                  ))}
                  {/* Bar */}
                  <div
                    className="absolute top-1 flex h-6 items-center rounded-md px-2 text-[10px] font-medium text-white"
                    style={{
                      left: `${(task.startDay / totalDays) * 100}%`,
                      width: `${(task.durationDays / totalDays) * 100}%`,
                      backgroundColor: task.color,
                    }}
                  >
                    {task.durationDays >= 3 && `${task.progress}%`}
                  </div>
                  {/* Progress fill */}
                  {task.progress > 0 && task.progress < 100 && (
                    <div
                      className="absolute top-1 h-6 rounded-l-md opacity-20"
                      style={{
                        left: `${(task.startDay / totalDays) * 100}%`,
                        width: `${((task.durationDays * task.progress) / 100 / totalDays) * 100}%`,
                        backgroundColor: "#000",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Today line */}
          <div className="pointer-events-none relative mt-2">
            <div className="absolute w-52 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
