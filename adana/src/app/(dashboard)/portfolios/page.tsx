"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import type { Task } from "@/types";

// -- Helpers ------------------------------------------------------------------

const PALETTE = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#65a30d",
];

type ProjectGroup = {
  id: string;
  name: string;
  description: string;
  color: string;
  projects: {
    id: string;
    name: string;
    color: string;
    taskCount: number;
    completedCount: number;
    status: string;
  }[];
};

// -- Component ----------------------------------------------------------------

export default function PortfoliosPage() {
  const { projects, tasks, loading } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  // Local portfolios stored in state (since not in Supabase)
  const [localPortfolios, setLocalPortfolios] = useState<ProjectGroup[]>([]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    // Create a portfolio that groups all current projects
    const newPortfolio: ProjectGroup = {
      id: `portfolio-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      color: newColor,
      projects: projects.map((p) => {
        const projectTasks = tasks.filter((t: Task) => t.projectId === p.id);
        const completedCount = projectTasks.filter((t: Task) => t.completed).length;
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          taskCount: projectTasks.length,
          completedCount,
          status: "on_track",
        };
      }),
    };
    setLocalPortfolios((prev) => [newPortfolio, ...prev]);
    setNewName("");
    setNewDescription("");
    setNewColor(PALETTE[0]);
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Compute stats for the default "All Projects" view
  const allProjectStats = projects.map((p) => {
    const projectTasks = tasks.filter((t: Task) => t.projectId === p.id);
    const completedCount = projectTasks.filter((t: Task) => t.completed).length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      taskCount: projectTasks.length,
      completedCount,
      completionRate:
        projectTasks.length > 0
          ? Math.round((completedCount / projectTasks.length) * 100)
          : 0,
    };
  });

  const displayPortfolios: ProjectGroup[] =
    localPortfolios.length > 0
      ? localPortfolios
      : [
          {
            id: "default",
            name: "All Projects",
            description: "Overview of all workspace projects",
            color: "#4f46e5",
            projects: allProjectStats.map((p) => ({
              ...p,
              status: "on_track",
            })),
          },
        ];

  const statusDot: Record<string, string> = {
    on_track: "bg-green-500",
    at_risk: "bg-yellow-500",
    off_track: "bg-red-500",
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Portfolio
        </button>
      </div>

      {/* Portfolio list */}
      <div className="space-y-6">
        {displayPortfolios.map((portfolio) => (
          <div key={portfolio.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Portfolio header */}
            <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: portfolio.color }} />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900">{portfolio.name}</h2>
                {portfolio.description && (
                  <p className="text-xs text-gray-500">{portfolio.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {portfolio.projects.length} project{portfolio.projects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Projects within portfolio */}
            {portfolio.projects.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {portfolio.projects.map((project) => {
                  const completionRate =
                    project.taskCount > 0
                      ? Math.round((project.completedCount / project.taskCount) * 100)
                      : 0;
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                    >
                      <div className="h-2.5 w-2.5 rounded" style={{ backgroundColor: project.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-900">{project.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusDot[project.status] || "bg-gray-400"}`} />
                        <span className="text-xs capitalize text-gray-500">
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-gray-700">
                          {completionRate}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{project.taskCount} tasks</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-4 text-center text-xs text-gray-400">
                No projects in this portfolio yet.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create portfolio modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Portfolio</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Product Development"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is this portfolio for?"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                <div className="flex gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`h-7 w-7 rounded-full transition ${newColor === c ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
