"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// -- Mock data ----------------------------------------------------------------

interface BoardTask {
  id: string;
  name: string;
  priority: string;
  assignee: string | null;
  dueDate: string | null;
  commentCount: number;
}

interface Column {
  id: string;
  name: string;
  tasks: BoardTask[];
}

const initialColumns: Column[] = [
  {
    id: "todo",
    name: "To Do",
    tasks: [
      { id: "t1", name: "Design homepage wireframes", priority: "high", assignee: "S", dueDate: "Apr 5", commentCount: 2 },
      { id: "t2", name: "Create color palette", priority: "medium", assignee: "A", dueDate: "Apr 7", commentCount: 0 },
      { id: "t5", name: "Write unit tests", priority: "low", assignee: null, dueDate: null, commentCount: 0 },
    ],
  },
  {
    id: "in_progress",
    name: "In Progress",
    tasks: [
      { id: "t3", name: "Implement navigation component", priority: "high", assignee: "D", dueDate: "Apr 8", commentCount: 1 },
      { id: "t6", name: "Build auth flow", priority: "medium", assignee: "J", dueDate: "Apr 10", commentCount: 3 },
    ],
  },
  {
    id: "review",
    name: "In Review",
    tasks: [
      { id: "t7", name: "API endpoint for tasks", priority: "high", assignee: "A", dueDate: "Apr 4", commentCount: 5 },
    ],
  },
  {
    id: "done",
    name: "Done",
    tasks: [
      { id: "t4", name: "Set up project structure", priority: "medium", assignee: "T", dueDate: null, commentCount: 0 },
      { id: "t8", name: "Configure CI pipeline", priority: "low", assignee: "D", dueDate: null, commentCount: 1 },
    ],
  },
];

// -- Helpers ------------------------------------------------------------------

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
  none: "bg-gray-300",
};

const columnColor: Record<string, string> = {
  todo: "bg-gray-400",
  in_progress: "bg-blue-500",
  review: "bg-purple-500",
  done: "bg-green-500",
};

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

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [columns] = useState<Column[]>(initialColumns);

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="board" />

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {columns.map((col) => (
            <div
              key={col.id}
              className="w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-4 py-3">
                <div className={`h-2.5 w-2.5 rounded-full ${columnColor[col.id] ?? "bg-gray-400"}`} />
                <h3 className="text-sm font-semibold text-gray-900">
                  {col.name}
                </h3>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                  {col.tasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 px-3 pb-3">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {task.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
                      <span className="text-xs capitalize text-gray-500">
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-500">
                            {task.dueDate}
                          </span>
                        </>
                      )}
                      {task.commentCount > 0 && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-400">
                            {task.commentCount}
                            <svg className="ml-0.5 inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </span>
                        </>
                      )}
                      <span className="ml-auto" />
                      {task.assignee && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                          {task.assignee}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add task */}
                <button className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add task
                </button>
              </div>
            </div>
          ))}

          {/* Add column */}
          <button className="flex h-fit w-72 shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-gray-400 transition hover:border-gray-300 hover:text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add section
          </button>
        </div>
      </div>
    </div>
  );
}
