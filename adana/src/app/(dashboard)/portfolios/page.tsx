"use client";

import Link from "next/link";
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
  const store = useAppStore();
  const { projects, tasks, loading } = store;
  const getMyPortfolios = (store as any).getMyPortfolios as undefined | (() => any[]);
  const portfoliosExt: any[] = getMyPortfolios ? getMyPortfolios() : ((store as any).portfoliosExt ?? []);
  const portfolioProjects: any[] = (store as any).portfolioProjects ?? [];
  const createPortfolio = (store as any).createPortfolio as (d: any) => Promise<any>;
  const deletePortfolio = (store as any).deletePortfolio as (id: string) => Promise<void>;
  const addProjectToPortfolio = (store as any).addProjectToPortfolio as (pid: string, projId: string) => Promise<void>;
  const removeProjectFromPortfolio = (store as any).removeProjectFromPortfolio as (pid: string, projId: string) => Promise<void>;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [addingToPortfolio, setAddingToPortfolio] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const p = await createPortfolio({
        name: newName.trim(),
        description: newDescription.trim() || null,
        color: newColor,
      });
      // Auto-link all current projects
      for (const proj of projects) {
        try { await addProjectToPortfolio(p.id, proj.id); } catch {}
      }
    } catch (err) {
      console.error("Failed to create portfolio", err);
    }
    setNewName("");
    setNewDescription("");
    setNewColor(PALETTE[0]);
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this portfolio?")) return;
    try { await deletePortfolio(id); } catch (err) { console.error(err); }
  };

  const handleAddProject = async (portfolioId: string, projectId: string) => {
    try { await addProjectToPortfolio(portfolioId, projectId); } catch (err) { console.error(err); }
    setAddingToPortfolio(null);
  };

  const handleRemoveProject = async (portfolioId: string, projectId: string) => {
    try { await removeProjectFromPortfolio(portfolioId, projectId); } catch (err) { console.error(err); }
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
    portfoliosExt.length > 0
      ? portfoliosExt.map((pf: any): ProjectGroup => {
          const linkIds = portfolioProjects
            .filter((pp: any) => pp.portfolioId === pf.id)
            .map((pp: any) => pp.projectId);
          const linkedProjects = projects
            .filter((p) => linkIds.includes(p.id))
            .map((p) => {
              const pt = tasks.filter((t: Task) => t.projectId === p.id);
              const completed = pt.filter((t: Task) => t.completed).length;
              return {
                id: p.id,
                name: p.name,
                color: p.color,
                taskCount: pt.length,
                completedCount: completed,
                status: (p as any).status ?? "on_track",
              };
            });
          return {
            id: pf.id,
            name: pf.name,
            description: pf.description ?? "",
            color: pf.color,
            projects: linkedProjects,
          };
        })
      : [
          {
            id: "default",
            name: "All Projects",
            description: "Overview of all workspace projects — create a portfolio to group projects",
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
              {portfolio.id !== "default" && (
                <>
                  <Link
                    href={`/portfolio?id=${portfolio.id}`}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    View details
                  </Link>
                  <button
                    onClick={() => setAddingToPortfolio(addingToPortfolio === portfolio.id ? null : portfolio.id)}
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    + Project
                  </button>
                  <button
                    onClick={() => handleDelete(portfolio.id)}
                    className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    title="Delete portfolio"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {addingToPortfolio === portfolio.id && portfolio.id !== "default" && (
              <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-6 py-3">
                {projects
                  .filter((p) => !portfolio.projects.find((pp) => pp.id === p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAddProject(portfolio.id, p.id)}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      + {p.name}
                    </button>
                  ))}
                {projects.filter((p) => !portfolio.projects.find((pp) => pp.id === p.id)).length === 0 && (
                  <span className="text-xs text-gray-400">No more projects to add.</span>
                )}
              </div>
            )}

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
                      {portfolio.id !== "default" && (
                        <button
                          onClick={() => handleRemoveProject(portfolio.id, project.id)}
                          className="text-xs text-gray-400 hover:text-red-600"
                          title="Remove from portfolio"
                        >
                          ×
                        </button>
                      )}
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
