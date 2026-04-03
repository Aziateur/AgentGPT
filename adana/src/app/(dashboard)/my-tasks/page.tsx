"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Task } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockTasks: Task[] = [
  {
    id: "t1",
    name: "Design homepage wireframes",
    description: null,
    htmlDescription: null,
    status: "in_progress",
    priority: "high",
    type: "task",
    completed: false,
    completedAt: null,
    assigneeId: "demo-user",
    projectId: "p1",
    sectionId: null,
    parentTaskId: null,
    order: 0,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    startDate: null,
    estimatedMinutes: 120,
    actualMinutes: null,
    tagIds: [],
    followerIds: [],
    subtaskIds: [],
    dependencyIds: [],
    approvalStatus: null,
    approverIds: [],
    likes: 0,
    attachmentCount: 0,
    commentCount: 2,
    customFieldValues: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t2",
    name: "Set up CI/CD pipeline",
    description: null,
    htmlDescription: null,
    status: "not_started",
    priority: "medium",
    type: "task",
    completed: false,
    completedAt: null,
    assigneeId: "demo-user",
    projectId: "p2",
    sectionId: null,
    parentTaskId: null,
    order: 1,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    startDate: null,
    estimatedMinutes: 60,
    actualMinutes: null,
    tagIds: [],
    followerIds: [],
    subtaskIds: [],
    dependencyIds: [],
    approvalStatus: null,
    approverIds: [],
    likes: 1,
    attachmentCount: 0,
    commentCount: 0,
    customFieldValues: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t3",
    name: "Write API documentation",
    description: null,
    htmlDescription: null,
    status: "not_started",
    priority: "low",
    type: "task",
    completed: false,
    completedAt: null,
    assigneeId: "demo-user",
    projectId: "p1",
    sectionId: null,
    parentTaskId: null,
    order: 2,
    dueDate: new Date(Date.now() + 604800000).toISOString(),
    startDate: null,
    estimatedMinutes: 90,
    actualMinutes: null,
    tagIds: [],
    followerIds: [],
    subtaskIds: [],
    dependencyIds: [],
    approvalStatus: null,
    approverIds: [],
    likes: 0,
    attachmentCount: 1,
    commentCount: 3,
    customFieldValues: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t4",
    name: "Review pull requests",
    description: null,
    htmlDescription: null,
    status: "not_started",
    priority: "medium",
    type: "task",
    completed: false,
    completedAt: null,
    assigneeId: "demo-user",
    projectId: "p2",
    sectionId: null,
    parentTaskId: null,
    order: 3,
    dueDate: new Date(Date.now() + 259200000).toISOString(),
    startDate: null,
    estimatedMinutes: 30,
    actualMinutes: null,
    tagIds: [],
    followerIds: [],
    subtaskIds: [],
    dependencyIds: [],
    approvalStatus: null,
    approverIds: [],
    likes: 0,
    attachmentCount: 0,
    commentCount: 1,
    customFieldValues: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t5",
    name: "Update onboarding flow",
    description: null,
    htmlDescription: null,
    status: "completed",
    priority: "high",
    type: "task",
    completed: true,
    completedAt: new Date(Date.now() - 3600000).toISOString(),
    assigneeId: "demo-user",
    projectId: "p1",
    sectionId: null,
    parentTaskId: null,
    order: 4,
    dueDate: new Date(Date.now() - 172800000).toISOString(),
    startDate: null,
    estimatedMinutes: 45,
    actualMinutes: 50,
    tagIds: [],
    followerIds: [],
    subtaskIds: [],
    dependencyIds: [],
    approvalStatus: null,
    approverIds: [],
    likes: 2,
    attachmentCount: 0,
    commentCount: 0,
    customFieldValues: [],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

type TabKey = "recently_assigned" | "today" | "upcoming" | "later";

function categorizeTasks(tasks: Task[]) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);

  const recentlyAssigned = tasks
    .filter((t) => !t.completed)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const today = tasks.filter(
    (t) =>
      !t.completed &&
      t.dueDate &&
      (new Date(t.dueDate) <= todayEnd || isOverdue(t.dueDate))
  );

  const upcoming = tasks.filter(
    (t) =>
      !t.completed &&
      t.dueDate &&
      new Date(t.dueDate) > todayEnd &&
      new Date(t.dueDate) <= weekEnd
  );

  const later = tasks.filter(
    (t) =>
      !t.completed &&
      (!t.dueDate || new Date(t.dueDate) > weekEnd)
  );

  return { recently_assigned: recentlyAssigned, today, upcoming, later };
}

// -- Component ----------------------------------------------------------------

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTab, setActiveTab] = useState<TabKey>("recently_assigned");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "name">("due_date");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { getMyTasks } = await import("@/app/actions/task-actions");
        const fetched = await getMyTasks();
        if (fetched?.length) setTasks(fetched);
      } catch {
        // keep mock data
      }
    }
    load();
  }, []);

  const categorized = categorizeTasks(tasks);
  const displayTasks = categorized[activeTab];

  const sorted = [...displayTasks].sort((a, b) => {
    if (sortBy === "due_date") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2, none: 3 };
      return order[a.priority] - order[b.priority];
    }
    return a.name.localeCompare(b.name);
  });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "recently_assigned", label: "Recently Assigned", count: categorized.recently_assigned.length },
    { key: "today", label: "Today", count: categorized.today.length },
    { key: "upcoming", label: "Upcoming", count: categorized.upcoming.length },
    { key: "later", label: "Later", count: categorized.later.length },
  ];

  function handleAddTask() {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: `t-${Date.now()}`,
      name: newTaskName.trim(),
      description: null,
      htmlDescription: null,
      status: "not_started",
      priority: "none",
      type: "task",
      completed: false,
      completedAt: null,
      assigneeId: "demo-user",
      projectId: null,
      sectionId: null,
      parentTaskId: null,
      order: tasks.length,
      dueDate: null,
      startDate: null,
      estimatedMinutes: null,
      actualMinutes: null,
      tagIds: [],
      followerIds: [],
      subtaskIds: [],
      dependencyIds: [],
      approvalStatus: null,
      approverIds: [],
      likes: 0,
      attachmentCount: 0,
      commentCount: 0,
      customFieldValues: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskName("");
    setShowAddTask(false);
  }

  function toggleComplete(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: t.completed ? null : new Date().toISOString(),
              status: t.completed ? "not_started" : "completed",
            }
          : t
      )
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="due_date">Sort by due date</option>
            <option value="priority">Sort by priority</option>
            <option value="name">Sort by name</option>
          </select>
          <button
            onClick={() => setShowAddTask(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        </div>
      </div>

      {/* Quick add */}
      {showAddTask && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <input
            autoFocus
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Task name..."
            className="flex-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            onClick={handleAddTask}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddTask(false)}
            className="rounded px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {tab.count}
              </span>
            )}
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {sorted.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No tasks here</p>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === "today"
                ? "Nothing due today. Enjoy your day!"
                : "No tasks in this category."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
              >
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {task.completed && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      task.completed ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {task.name}
                  </p>
                </div>
                {task.priority !== "none" && (
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                )}
                {task.dueDate && (
                  <span
                    className={`shrink-0 text-xs ${
                      !task.completed && isOverdue(task.dueDate)
                        ? "font-medium text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
