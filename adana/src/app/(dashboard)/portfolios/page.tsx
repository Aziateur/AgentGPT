"use client";

import { useState, useEffect } from "react";
import type { Portfolio, ProjectStatusType } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockPortfolios = [
  {
    id: "pf1",
    name: "Product Development",
    description: "All product engineering projects",
    ownerId: "demo-user",
    color: "#4f46e5",
    projectIds: ["p1", "p2", "p5"],
    memberIds: ["demo-user", "user-2"],
    privacy: "public" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [
      { name: "Website Redesign", status: "on_track" as ProjectStatusType, progress: 62, color: "#4f46e5" },
      { name: "Mobile App v2", status: "at_risk" as ProjectStatusType, progress: 33, color: "#059669" },
      { name: "Design System", status: "on_track" as ProjectStatusType, progress: 48, color: "#7c3aed" },
    ],
  },
  {
    id: "pf2",
    name: "Marketing Initiatives",
    description: "Marketing team projects and campaigns",
    ownerId: "user-5",
    color: "#d97706",
    projectIds: ["p3"],
    memberIds: ["demo-user", "user-5", "user-6"],
    privacy: "public" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [
      { name: "Q1 Marketing Campaign", status: "on_track" as ProjectStatusType, progress: 75, color: "#d97706" },
    ],
  },
  {
    id: "pf3",
    name: "Infrastructure",
    description: "DevOps and platform projects",
    ownerId: "user-3",
    color: "#dc2626",
    projectIds: ["p4"],
    memberIds: ["demo-user", "user-3"],
    privacy: "private" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [
      { name: "Data Pipeline Upgrade", status: "off_track" as ProjectStatusType, progress: 12, color: "#dc2626" },
    ],
  },
];

// -- Helpers ------------------------------------------------------------------

const statusDot: Record<ProjectStatusType, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
  on_hold: "bg-gray-400",
  complete: "bg-blue-500",
};

// -- Component ----------------------------------------------------------------

export default function PortfoliosPage() {
  const [portfolios] = useState(mockPortfolios);

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Portfolio
        </button>
      </div>

      {/* Portfolio list */}
      <div className="space-y-6">
        {portfolios.map((portfolio) => {
          const avgProgress = portfolio.projects.length
            ? Math.round(
                portfolio.projects.reduce((sum, p) => sum + p.progress, 0) /
                  portfolio.projects.length
              )
            : 0;

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
                    {avgProgress}%
                  </p>
                  <p className="text-xs text-gray-500">avg progress</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>

              {/* Projects within portfolio */}
              <div className="divide-y divide-gray-50">
                {portfolio.projects.map((project, i) => (
                  <div
                    key={i}
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
                        className={`h-2 w-2 rounded-full ${statusDot[project.status]}`}
                      />
                      <span className="text-xs capitalize text-gray-500">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs text-gray-500">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                <span className="text-xs text-gray-400">
                  {portfolio.projects.length} project{portfolio.projects.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-400">
                  {portfolio.memberIds.length} member{portfolio.memberIds.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
