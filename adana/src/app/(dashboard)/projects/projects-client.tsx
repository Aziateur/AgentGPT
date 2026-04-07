"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/project-actions";

// -- Helpers ------------------------------------------------------------------

type ProjectStatusType = "on_track" | "at_risk" | "off_track" | "on_hold" | "complete";

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

type SortKey = "name" | "recent" | "status";
type StatusFilter = "all" | ProjectStatusType;

interface ProjectItem {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  archived: boolean;
  favorite: boolean;
  defaultView: string;
  creatorId: string;
  teamId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  memberCount: number;
  taskCount: number;
  creator?: { id: string; name: string; avatar: string | null } | null;
  statuses?: { status: string }[];
  [key: string]: unknown;
}

// -- Component ----------------------------------------------------------------

export function ProjectsPageClient({ projects }: { projects: ProjectItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#4f46e5");

  // Derive latest status for each project from its statuses array
  function getProjectStatus(p: ProjectItem): ProjectStatusType {
    const statuses = (p as unknown as { statuses?: { status: string }[] }).statuses;
    if (statuses && statuses.length > 0) {
      return statuses[0].status as ProjectStatusType;
    }
    return "on_track";
  }

  const filtered = projects
    .filter((p) => !p.archived)
    .filter((p) => statusFilter === "all" || getProjectStatus(p) === statusFilter)
    .filter(
      (p) =>
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "status") return getProjectStatus(a).localeCompare(getProjectStatus(b));
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

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    startTransition(async () => {
      const result = await createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        color: newProjectColor,
      });
      if (result && "project" in result && result.project) {
        setShowCreateModal(false);
        setNewProjectName("");
        setNewProjectDesc("");
        setNewProjectColor("#4f46e5");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">New Project</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="color"
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer rounded border border-gray-200"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            const status = getProjectStatus(project);
            const progress = project.taskCount > 0 ? 0 : 0; // would need completed count for real progress
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
                    <span className={`h-2 w-2 rounded-full ${statusColor[status] || "bg-gray-400"}`} />
                    <span className="text-xs text-gray-500">
                      {statusLabel[status] || "On Track"}
                    </span>
                  </div>
                </div>

                {project.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {project.description}
                  </p>
                )}

                {/* Task count */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{project.taskCount} tasks</span>
                    <span>{project.memberCount} members</span>
                  </div>
                </div>

                {/* Favorite star */}
                {project.favorite && (
                  <div className="mt-2 text-xs text-yellow-500">
                    &#9733; Favorite
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
