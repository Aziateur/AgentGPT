"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types";
import { getMyTasks as getMockTasks, mockTasks } from "@/lib/mock-data";

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

type TabKey = "today" | "upcoming" | "later";

// -- Component ----------------------------------------------------------------

export default function MyTasksPage() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [laterTasks, setLaterTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "title">("due_date");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(() => {
    const result = getMockTasks();
    setTodayTasks(result.today as Task[]);
    setUpcomingTasks(result.upcoming as Task[]);
    setLaterTasks(result.later as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const categorized: Record<TabKey, Task[]> = {
    today: todayTasks,
    upcoming: upcomingTasks,
    later: laterTasks,
  };

  const displayTasks = categorized[activeTab];

  const sorted = [...displayTasks].sort((a, b) => {
    if (sortBy === "due_date") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "priority") {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
      return (order[a.priority || "none"] ?? 3) - (order[b.priority || "none"] ?? 3);
    }
    return (a.title || "").localeCompare(b.title || "");
  });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "today", label: "Today", count: todayTasks.length },
    { key: "upcoming", label: "Upcoming", count: upcomingTasks.length },
    { key: "later", label: "Later", count: laterTasks.length },
  ];

  function handleAddTask() {
    if (!newTaskName.trim()) return;
    // Client-side only for demo
    setNewTaskName("");
    setShowAddTask(false);
  }

  function handleToggleComplete(taskId: string) {
    // Client-side toggle for demo
    setTodayTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t));
    setUpcomingTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t));
    setLaterTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
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
            <option value="title">Sort by name</option>
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
                  onClick={() => handleToggleComplete(task.id)}
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
                    {task.title}
                  </p>
                  {!!(task as Record<string, unknown>).project && (
                    <p className="text-xs text-gray-400">
                      {((task as Record<string, unknown>).project as { name: string })?.name}
                    </p>
                  )}
                </div>
                {task.priority && task.priority !== "none" && (
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority] || ""}`}
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
