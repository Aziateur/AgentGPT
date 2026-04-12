"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import type { GoalExt, GoalContribution, Project } from "@/types";

// -- Types --------------------------------------------------------------------

interface GoalNode {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  period: string | null;
  parentId: string | null;
  ownerInitial: string;
  ownerName: string;
  subGoals: GoalNode[];
}

// -- Helpers ------------------------------------------------------------------

const statusColor: Record<string, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-yellow-100 text-yellow-700",
  off_track: "bg-red-100 text-red-700",
  achieved: "bg-blue-100 text-blue-700",
  partial: "bg-purple-100 text-purple-700",
  missed: "bg-gray-100 text-gray-700",
  dropped: "bg-gray-100 text-gray-400",
};

const statusLabel: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  achieved: "Achieved",
  partial: "Partial",
  missed: "Missed",
  dropped: "Dropped",
};

const statusProgressColor: Record<string, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
  achieved: "bg-blue-500",
  partial: "bg-purple-500",
  missed: "bg-gray-400",
  dropped: "bg-gray-300",
};

type StatusFilterKey = "all" | string;

// -- Sub-components -----------------------------------------------------------

function GoalCard({
  goal,
  depth = 0,
  linkedProjects,
  allProjects,
  onDelete,
  onUpdateStatus,
  onUpdateProgress,
  onAddSubGoal,
  onLinkProject,
}: {
  goal: GoalNode;
  depth?: number;
  linkedProjects: Project[];
  allProjects: Project[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onAddSubGoal: (parentId: string) => void;
  onLinkProject: (goalId: string, projectId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const progress = goal.progress;

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {/* Expand toggle */}
          {goal.subGoals && goal.subGoals.length > 0 ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className={`h-4 w-4 transition ${expanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{goal.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[goal.status] || "bg-gray-100 text-gray-600"}`}>
                {statusLabel[goal.status] || goal.status}
              </span>
              {goal.period && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {goal.period}
                </span>
              )}
            </div>
            {goal.description && (
              <p className="mt-1 text-xs text-gray-500">{goal.description}</p>
            )}

            {/* Linked projects */}
            {linkedProjects.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {linkedProjects.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: p.color || "#4c6ef5" }}
                    />
                    {p.name}
                  </span>
                ))}
              </div>
            )}

            {/* Progress */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${statusProgressColor[goal.status] || "bg-gray-400"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  onUpdateProgress(goal.id, n);
                }}
                className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600 focus:outline-none"
              />
              <span className="text-xs font-medium text-gray-600">%</span>
            </div>

            {/* Owner + actions */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600">
                  {goal.ownerInitial}
                </div>
                <span className="text-xs text-gray-500">{goal.ownerName}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAddSubGoal(goal.id)}
                  className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                  title="Add sub-goal"
                >
                  + Add sub-goal
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowProjectDropdown((v) => !v)}
                    className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                    title="Link project"
                  >
                    🔗 Link project
                  </button>
                  {showProjectDropdown && (
                    <div className="absolute right-0 z-10 mt-1 max-h-56 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {allProjects.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-400">No projects</div>
                      ) : (
                        allProjects.map((p) => {
                          const already = linkedProjects.some((lp) => lp.id === p.id);
                          return (
                            <button
                              key={p.id}
                              disabled={already}
                              onClick={() => {
                                if (!already) onLinkProject(goal.id, p.id);
                                setShowProjectDropdown(false);
                              }}
                              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                                already
                                  ? "cursor-not-allowed text-gray-300"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: p.color || "#4c6ef5" }}
                              />
                              <span className="truncate">{p.name}</span>
                              {already && <span className="ml-auto text-[9px]">linked</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <select
                  value={goal.status}
                  onChange={(e) => onUpdateStatus(goal.id, e.target.value)}
                  className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 focus:outline-none"
                >
                  {Object.entries(statusLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button
                  onClick={() => onDelete(goal.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete goal"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-goals */}
      {expanded && goal.subGoals && goal.subGoals.length > 0 && (
        <div className="mt-2 space-y-2">
          {goal.subGoals.map((sub) => (
            <GoalCard
              key={sub.id}
              goal={sub}
              depth={depth + 1}
              linkedProjects={[]}
              allProjects={allProjects}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onUpdateProgress={onUpdateProgress}
              onAddSubGoal={onAddSubGoal}
              onLinkProject={onLinkProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -- Main component -----------------------------------------------------------

export default function GoalsPage() {
  const goalsExt = useAppStore((s) => s.goalsExt);
  const projects = useAppStore((s) => s.projects);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const createGoal = useAppStore((s) => s.createGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const linkGoalToProject = useAppStore((s) => s.linkGoalToProject);
  const goalContributions = useAppStore(
    (s) => ((s as unknown as { goalContributions?: GoalContribution[] }).goalContributions) ?? []
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("on_track");
  const [newPeriod, setNewPeriod] = useState("");
  const [newParentId, setNewParentId] = useState<string | null>(null);

  // Build goal tree from flat list
  const tree = useMemo<GoalNode[]>(() => {
    const byId = new Map<string, GoalNode>();
    const toNode = (g: GoalExt): GoalNode => {
      const owner = users.find((u) => u.id === g.ownerId);
      const ownerName = owner?.name || currentUser?.name || "You";
      return {
        id: g.id,
        name: g.name,
        description: g.description ?? null,
        status: g.status,
        progress: g.progress ?? 0,
        period: g.timePeriod ?? null,
        parentId: g.parentId ?? null,
        ownerInitial: (ownerName || "?").charAt(0).toUpperCase(),
        ownerName,
        subGoals: [],
      };
    };
    for (const g of goalsExt) byId.set(g.id, toNode(g));
    const roots: GoalNode[] = [];
    for (const g of goalsExt) {
      const node = byId.get(g.id)!;
      if (g.parentId && byId.has(g.parentId)) {
        byId.get(g.parentId)!.subGoals.push(node);
      } else {
        roots.push(node);
      }
    }
    return { tree: roots, goalsById: byId };
  }, [goalsExt, users, currentUser]);

  const linkedProjectsByGoal = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const c of goalContributions) {
      if (!c.projectId) continue;
      const p = projects.find((pr) => pr.id === c.projectId);
      if (!p) continue;
      const arr = map.get(c.goalId) ?? [];
      arr.push(p);
      map.set(c.goalId, arr);
    }
    return map;
  }, [goalContributions, projects]);

  const openCreateModal = (parentId: string | null) => {
    setNewName("");
    setNewDescription("");
    setNewStatus("on_track");
    setNewPeriod("");
    setNewParentId(parentId);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createGoal({
      name: newName.trim(),
      description: newDescription.trim() || null,
      status: newStatus,
      timePeriod: newPeriod.trim() || null,
      parentId: newParentId,
      ownerId: currentUser?.id ?? null,
    });
    setShowCreateModal(false);
    setNewParentId(null);
  };

  const handleDelete = (id: string) => {
    void deleteGoal(id);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    void updateGoal(id, { status });
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    void updateGoal(id, { progress });
  };

  const handleLinkProject = (goalId: string, projectId: string) => {
    void linkGoalToProject(goalId, projectId);
  };

  // Filter: only top-level goals pass through status filter for grouping
  const filtered = tree.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  });

  // Group by time period (top-level only)
  const grouped = useMemo(() => {
    const groups = new Map<string, GoalNode[]>();
    for (const g of filtered) {
      const key = g.period || "No period";
      const arr = groups.get(key) ?? [];
      arr.push(g);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const flatGoalsForSelect: GoalExt[] = goalsExt;

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <button
          onClick={() => openCreateModal(null)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          {(["all", "on_track", "at_risk", "off_track", "achieved"] as StatusFilterKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : statusLabel[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Goals tree */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-900">
            {goalsExt.length === 0 ? "No goals yet" : "No goals match this filter"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {goalsExt.length === 0
              ? "Create your first goal to start tracking OKRs."
              : "Try a different filter or create a new goal."}
          </p>
          {goalsExt.length === 0 && (
            <button
              onClick={() => openCreateModal(null)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create first goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([period, periodGoals]) => (
            <div key={period}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {period}
              </h2>
              <div className="space-y-4">
                {periodGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    linkedProjects={linkedProjectsByGoal.get(goal.id) ?? []}
                    allProjects={projects}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateProgress={handleUpdateProgress}
                    onAddSubGoal={openCreateModal}
                    onLinkProject={handleLinkProject}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create goal modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {newParentId ? "Create Sub-Goal" : "Create Goal"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Increase Revenue by 30%"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe this goal..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Parent Goal</label>
                <select
                  value={newParentId ?? ""}
                  onChange={(e) => setNewParentId(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">None (top-level)</option>
                  {flatGoalsForSelect.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {Object.entries(statusLabel).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Period</label>
                  <input
                    type="text"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="e.g. Q2_2026"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewParentId(null);
                }}
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

// Intentional dead reference to keep `goalsById` calc usable if extended.
// (Actual use lives in the memo above.)
export const __DEAD__ = (_: Map<string, GoalNode>) => _;
