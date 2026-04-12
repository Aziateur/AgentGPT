"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import type { Task, Project } from "@/types";



const priorityColor: Record<string, string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-600 bg-blue-50",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// -- Page ------------------------------------------------------------------

export default function HomePage() {
  const store = useAppStore();
  const { initialized, loading, currentUser, tasks } = store;
  const getVisibleProjects = (store as any).getVisibleProjects as undefined | (() => Project[]);
  const projects = getVisibleProjects ? getVisibleProjects() : store.projects;

  if (!initialized || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const user = currentUser ?? { id: "demo", name: "Demo User", email: "demo@adana.dev" };

  const allTasks = tasks as Task[];

  const upcomingTasks = allTasks
    .filter((t) => !t.completed && t.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5);

  const completedCount = allTasks.filter((t) => t.completed).length;
  const overdueCount = allTasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate as string) < new Date()
  ).length;

  const allProjects = projects as Project[];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {(user.name as string).split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening across your projects.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/my-tasks"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          + Create task
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          + Create project
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={allTasks.length} />
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="Overdue" value={overdueCount} accent={overdueCount > 0} />
        <StatCard label="Projects" value={allProjects.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link href="/my-tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {upcomingTasks.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">
                No upcoming tasks. You&apos;re all caught up!
              </li>
            )}
            {upcomingTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <div className="h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
                </div>
                {task.priority ? (
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority] || ""}`}>
                    {task.priority}
                  </span>
                ) : null}
                {task.dueDate ? (
                  <span className="shrink-0 text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {allProjects.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">
                No projects yet. Create one to get started.
              </li>
            )}
            {allProjects.slice(0, 5).map((project) => (
              <li key={project.id as string}>
                <Link
                  href={`/project/list?id=${project.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded"
                    style={{ backgroundColor: project.color || "#6366f1" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{project.name}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {mockActivity.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
              <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-indigo-100 text-center text-xs font-medium leading-6 text-indigo-600">
                {a.actor[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">{a.actor}</span> {a.action}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

const mockActivity = [
  { id: "a1", actor: "Sarah", action: 'completed "Design homepage wireframes"', time: "2 hours ago" },
  { id: "a2", actor: "Alex", action: 'commented on "API Integration"', time: "3 hours ago" },
  { id: "a3", actor: "Jordan", action: 'created project "Q2 Roadmap"', time: "5 hours ago" },
  { id: "a4", actor: "Demo User", action: 'moved "Setup CI/CD" to In Progress', time: "Yesterday" },
  { id: "a5", actor: "Taylor", action: 'assigned you "Write API docs"', time: "Yesterday" },
];
