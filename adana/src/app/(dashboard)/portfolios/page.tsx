"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectStatusType } from "@/types";
import { mockPortfolios } from "@/lib/mock-data";

// -- Helpers ------------------------------------------------------------------

const statusDot: Record<ProjectStatusType, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
  on_hold: "bg-gray-400",
  complete: "bg-blue-500",
};

interface PortfolioData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  ownerId: string;
  owner: { id: string; name: string; avatar: string | null };
  _count: { projects: number };
  projects?: {
    project: {
      id: string;
      name: string;
      color: string;
      statuses: { status: string }[];
      _count: { tasks: number; members: number };
    };
  }[];
}

// -- Component ----------------------------------------------------------------

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#4f46e5");

  const loadPortfolios = useCallback(() => {
    setPortfolios(mockPortfolios as unknown as PortfolioData[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    setNewName("");
    setNewDescription("");
    setNewColor("#4f46e5");
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

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
      {portfolios.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-900">No portfolios yet</p>
          <p className="mt-1 text-sm text-gray-500">Create a portfolio to group your projects.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {portfolios.map((portfolio) => {
            const projects = (portfolio.projects || []).map((pp) => {
              const latestStatus = pp.project.statuses?.[0]?.status || "on_track";
              return {
                id: pp.project.id,
                name: pp.project.name,
                color: pp.project.color,
                status: latestStatus as ProjectStatusType,
                taskCount: pp.project._count?.tasks || 0,
              };
            });

            return (
              <div
                key={portfolio.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Portfolio header */}
                <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: portfolio.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {portfolio.name}
                    </h2>
                    {portfolio.description && (
                      <p className="text-xs text-gray-500">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Projects within portfolio */}
                {projects.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900">
                          {project.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${statusDot[project.status] || "bg-gray-400"}`}
                          />
                          <span className="text-xs capitalize text-gray-500">
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {project.taskCount} tasks
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-4 text-center text-xs text-gray-400">
                    No projects in this portfolio yet.
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                  <span className="text-xs text-gray-400">
                    Owner: {portfolio.owner?.name || "Unknown"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer rounded border border-gray-200"
                />
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
