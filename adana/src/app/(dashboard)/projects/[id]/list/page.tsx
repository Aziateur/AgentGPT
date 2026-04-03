"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Task } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockSections = [
  { id: "s1", name: "To Do", tasks: ["t1", "t2"] },
  { id: "s2", name: "In Progress", tasks: ["t3"] },
  { id: "s3", name: "Done", tasks: ["t4"] },
];

const mockTasks: Task[] = [
  {
    id: "t1", name: "Design homepage wireframes", description: null, htmlDescription: null,
    status: "not_started", priority: "high", type: "task", completed: false, completedAt: null,
    assigneeId: "demo-user", projectId: "p1", sectionId: "s1", parentTaskId: null, order: 0,
    dueDate: new Date(Date.now() + 86400000).toISOString(), startDate: null,
    estimatedMinutes: 120, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [],
    dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0,
    attachmentCount: 0, commentCount: 2, customFieldValues: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "t2", name: "Create color palette", description: null, htmlDescription: null,
    status: "not_started", priority: "medium", type: "task", completed: false, completedAt: null,
    assigneeId: "user-2", projectId: "p1", sectionId: "s1", parentTaskId: null, order: 1,
    dueDate: new Date(Date.now() + 172800000).toISOString(), startDate: null,
    estimatedMinutes: 60, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [],
    dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0,
    attachmentCount: 0, commentCount: 0, customFieldValues: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "t3", name: "Implement navigation component", description: null, htmlDescription: null,
    status: "in_progress", priority: "high", type: "task", completed: false, completedAt: null,
    assigneeId: "demo-user", projectId: "p1", sectionId: "s2", parentTaskId: null, order: 0,
    dueDate: new Date(Date.now() + 259200000).toISOString(), startDate: null,
    estimatedMinutes: 180, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [],
    dependencyIds: [], approvalStatus: null, approverIds: [], likes: 1,
    attachmentCount: 0, commentCount: 1, customFieldValues: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "t4", name: "Set up project structure", description: null, htmlDescription: null,
    status: "completed", priority: "medium", type: "task", completed: true,
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    assigneeId: "user-3", projectId: "p1", sectionId: "s3", parentTaskId: null, order: 0,
    dueDate: null, startDate: null, estimatedMinutes: 30, actualMinutes: 25,
    tagIds: [], followerIds: [], subtaskIds: [], dependencyIds: [],
    approvalStatus: null, approverIds: [], likes: 3, attachmentCount: 0, commentCount: 0,
    customFieldValues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

// -- Helpers ------------------------------------------------------------------

const priorityColor: Record<string, string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-600 bg-blue-50",
  none: "text-gray-500 bg-gray-50",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

export default function ProjectListPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const { getTasks } = await import("@/app/actions/task-actions");
        const fetched = await getTasks(projectId);
        if (fetched?.length) setTasks(fetched);
      } catch {
        // keep mock data
      }
    }
    load();
  }, [projectId]);

  const filteredTasks = filterPriority === "all"
    ? tasks
    : tasks.filter((t) => t.priority === filterPriority);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="list" />

      {/* Filters */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-6 py-2">
        <span className="text-xs font-medium text-gray-500">Filter:</span>
        {["all", "high", "medium", "low"].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
              filterPriority === p
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Task list */}
        <div className="flex-1 overflow-auto p-6">
          {mockSections.map((section) => {
            const sectionTasks = filteredTasks.filter((t) => t.sectionId === section.id);
            return (
              <div key={section.id} className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {section.name}
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {sectionTasks.length}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white">
                  {sectionTasks.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                      No tasks in this section
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {sectionTasks.map((task) => (
                        <li
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-gray-50 ${
                            selectedTaskId === task.id ? "bg-indigo-50" : ""
                          }`}
                        >
                          <div
                            className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                              task.completed
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300"
                            }`}
                          />
                          <span
                            className={`flex-1 truncate text-sm ${
                              task.completed
                                ? "text-gray-400 line-through"
                                : "font-medium text-gray-900"
                            }`}
                          >
                            {task.name}
                          </span>
                          {task.priority !== "none" && (
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}>
                              {task.priority}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.commentCount > 0 && (
                            <span className="text-xs text-gray-400">
                              {task.commentCount} comments
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedTask && (
          <div className="w-96 shrink-0 border-l border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {selectedTask.name}
              </h3>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium capitalize text-gray-900">
                  {selectedTask.status.replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Priority</dt>
                <dd>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[selectedTask.priority]}`}>
                    {selectedTask.priority}
                  </span>
                </dd>
              </div>
              {selectedTask.dueDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Due date</dt>
                  <dd className="text-gray-900">{formatDate(selectedTask.dueDate)}</dd>
                </div>
              )}
              {selectedTask.estimatedMinutes && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Estimate</dt>
                  <dd className="text-gray-900">{selectedTask.estimatedMinutes}m</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Comments</dt>
                <dd className="text-gray-900">{selectedTask.commentCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Likes</dt>
                <dd className="text-gray-900">{selectedTask.likes}</dd>
              </div>
            </dl>
            {selectedTask.description && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">{selectedTask.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
