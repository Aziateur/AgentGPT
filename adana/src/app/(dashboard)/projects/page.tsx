"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Project, ProjectStatusType } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Website Redesign",
    description: "Redesign the marketing website with new branding",
    color: "#4f46e5",
    icon: null,
    ownerId: "demo-user",
    teamId: "team-1",
    privacy: "public",
    defaultView: "board",
    status: "on_track",
    statusText: "Going well",
    startDate: null,
    dueDate: null,
    archived: false,
    memberIds: ["demo-user", "user-2", "user-3"],
    sectionIds: ["s1", "s2"],
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Mobile App v2",
    description: "Next version of the mobile application",
    color: "#059669",
    icon: null,
    ownerId: "demo-user",
    teamId: "team-1",
    privacy: "public",
    defaultView: "list",
    status: "at_risk",
    statusText: "Behind schedule",
    startDate: null,
    dueDate: null,
    archived: false,
    memberIds: ["demo-user", "user-4"],
    sectionIds: [],
    createdAt: new Date(Date.now() - 1296000000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Q1 Marketing Campaign",
    description: "Plan and execute Q1 campaigns",
    color: "#d97706",
    icon: null,
    ownerId: "user-5",
    teamId: "team-2",
    privacy: "public",
    defaultView: "board",
    status: "on_track",
    statusText: null,
    startDate: null,
    dueDate: null,
    archived: false,
    memberIds: ["demo-user", "user-5", "user-6"],
    sectionIds: [],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p4",
    name: "Data Pipeline Upgrade",
    description: "Migrate to new ETL framework",
    color: "#dc2626",
    icon: null,
    ownerId: "user-3",
    teamId: "team-1",
    privacy: "private",
    defaultView: "list",
    status: "off_track",
    statusText: "Blocked by infra team",
    startDate: null,
    dueDate: null,
    archived: false,
    memberIds: ["demo-user", "user-3"],
    sectionIds: [],
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p5",
    name: "Design System",
    description: "Build a shared component library",
    color: "#7c3aed",
    icon: null,
    ownerId: "demo-user",
    teamId: "team-1",
    privacy: "public",
    defaultView: "board",
    status: "on_track",
    statusText: null,
    startDate: null,
    dueDate: null,
    archived: false,
    memberIds: ["demo-user", "user-2"],
    sectionIds: [],
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p6",
    name: "Customer Onboarding",
    description: "Revamp the onboarding experience for new customers",
    color: "#0891b2",
    icon: null,
    ownerId: "user-6",
    teamId: "team-2",
    privacy: "public",
    defaultView: "board",
    status: "complete",
    statusText: "Shipped!",
    startDate: null,
    dueDate: null,
    archived: false,
    memberIds: ["demo-user", "user-5", "user-6"],
    sectionIds: [],
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// -- Helpers ------------------------------------------------------------------

const statusColor: Record<ProjectStatusType, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
  on_hold: "bg-gray-400",
  complete: "bg-blue-500",
};

const statusLabel: Record<ProjectStatusType, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  on_hold: "On Hold",
  complete: "Complete",
};

// Fake task count / progress per project for demo
const projectMeta: Record<string, { taskCount: number; progress: number }> = {
  p1: { taskCount: 24, progress: 62 },
  p2: { taskCount: 18, progress: 33 },
  p3: { taskCount: 12, progress: 75 },
  p4: { taskCount: 8, progress: 12 },
  p5: { taskCount: 31, progress: 48 },
  p6: { taskCount: 15, progress: 100 },
};

type SortKey = "name" | "recent" | "status";
type StatusFilter = "all" | ProjectStatusType;

// -- Component ----------------------------------------------------------------

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { getProjects } = await import("@/app/actions/project-actions");
        const fetched = await getProjects();
        if (fetched?.length) setProjects(fetched);
      } catch {
        // keep mock data
      }
    }
    load();
  }, []);

  const filtered = projects
    .filter((p) => !p.archived)
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter(
      (p) =>
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "on_track", label: "On Track" },
    { key: "at_risk", label: "At Risk" },
    { key: "off_track", label: "Off Track" },
    { key: "on_hold", label: "On Hold" },
    { key: "complete", label: "Complete" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === f.key
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-900">No projects found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different filter or create a new project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => {
            const meta = projectMeta[project.id] ?? { taskCount: 0, progress: 0 };
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/${project.defaultView}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Color bar */}
                <div
                  className="mb-3 h-1.5 w-12 rounded-full"
                  style={{ backgroundColor: project.color }}
                />

                {/* Name + status */}
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${statusColor[project.status]}`} />
                    <span className="text-xs text-gray-500">
                      {statusLabel[project.status]}
                    </span>
                  </div>
                </div>

                {project.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{meta.taskCount} tasks</span>
                    <span>{meta.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${meta.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>

                {/* Members */}
                <div className="mt-4 flex items-center">
                  <div className="flex -space-x-2">
                    {project.memberIds.slice(0, 4).map((_, i) => (
                      <div
                        key={i}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-medium text-gray-600"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {project.memberIds.length > 4 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
                        +{project.memberIds.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
