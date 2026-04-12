"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "@/lib/project-templates";
import { applyProjectTemplate } from "@/lib/project-templates-apply";
import { useAppStore } from "@/store/app-store";
import { generateProjectFromPrompt } from "@/lib/ai-generate-project";

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
type CreateTab = "blank" | "template" | "ai";

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
  const createProject = useAppStore((s) => s.createProject);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState<CreateTab>("blank");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#4f46e5");
  const [busy, setBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

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

  function resetForm() {
    setShowCreateModal(false);
    setNewProjectName("");
    setNewProjectDesc("");
    setNewProjectColor("#4f46e5");
    setSelectedTemplateId(null);
    setCreateTab("blank");
    setAiPrompt("");
    setAiError(null);
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    setAiError(null);
    try {
      const newId = await generateProjectFromPrompt(aiPrompt.trim());
      if (newId) {
        resetForm();
        router.push(`/project/list?id=${newId}`);
      } else {
        setAiError("Generation returned no project.");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    setBusy(true);
    try {
      if (createTab === "template" && selectedTemplateId) {
        const p = await applyProjectTemplate(selectedTemplateId, newProjectName.trim());
        resetForm();
        if (p) router.push(`/project/${p.defaultView || "list"}?id=${p.id}`);
        return;
      }
      const p = await createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || null,
        color: newProjectColor,
      });
      resetForm();
      router.push(`/project/${p.defaultView || "list"}?id=${p.id}`);
    } finally {
      setBusy(false);
    }
  }

  function handlePickTemplate(id: string) {
    setSelectedTemplateId(id);
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      if (!newProjectName.trim()) setNewProjectName(tpl.name);
      setNewProjectColor(tpl.color);
    }
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
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">New Project</h2>

            {/* Tabs */}
            <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
              {(["blank", "template", "ai"] as CreateTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setCreateTab(t)}
                  className={`relative px-3 py-2 text-sm font-medium transition ${
                    createTab === t ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "blank" ? "Blank" : t === "template" ? "From template" : "AI"}
                  {createTab === t && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
                  )}
                </button>
              ))}
            </div>

            {createTab === "template" && (
              <div className="mb-4 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {PROJECT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handlePickTemplate(tpl.id)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                      selectedTemplateId === tpl.id
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: tpl.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{tpl.name}</span>
                    </div>
                    <span className="mt-1 text-xs text-gray-500">{tpl.description}</span>
                    <span className="mt-2 text-[10px] uppercase text-gray-400">
                      {tpl.sections.length} sections · {tpl.tasks.length} tasks
                    </span>
                  </button>
                ))}
              </div>
            )}

            {createTab === "ai" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                  Uses your default AI provider from <span className="font-medium">/settings/ai</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Describe the project you want
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Launch a new mobile app including design, development, QA, and marketing phases."
                    rows={5}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    autoFocus
                  />
                </div>
                {aiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {aiError}
                  </div>
                )}
              </div>
            )}

            {createTab !== "ai" && (
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
              {createTab === "blank" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
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
                </>
              )}
            </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              {createTab === "ai" ? (
                <button
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || busy || isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {busy && (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {busy ? "Generating..." : "Generate"}
                </button>
              ) : (
              <button
                onClick={handleCreateProject}
                disabled={
                  !newProjectName.trim() ||
                  busy ||
                  isPending ||
                  (createTab === "template" && !selectedTemplateId)
                }
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy || isPending ? "Creating..." : "Create Project"}
              </button>
              )}
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
                href={`/project/${project.defaultView || "list"}?id=${project.id}`}
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
