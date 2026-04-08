"use client";

import { useState, useEffect, useCallback } from "react";
import { mockGoals } from "@/lib/mock-data";

// -- Types --------------------------------------------------------------------

interface GoalData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  ownerId: string;
  owner: { id: string; name: string; avatar: string | null };
  parentId: string | null;
  subGoals?: GoalData[];
  _count?: { projects: number; subGoals: number };
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
type PeriodFilterKey = "all" | string;

// -- Sub-components -----------------------------------------------------------

function GoalCard({
  goal,
  depth = 0,
  onDelete,
  onUpdateStatus,
}: {
  goal: GoalData;
  depth?: number;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
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
              <h3 className="text-sm font-semibold text-gray-900">
                {goal.name}
              </h3>
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

            {/* Progress */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${statusProgressColor[goal.status] || "bg-gray-400"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {progress}%
              </span>
            </div>

            {/* Owner + actions */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600">
                  {goal.owner?.name?.[0] || "?"}
                </div>
                <span className="text-xs text-gray-500">{goal.owner?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1">
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
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -- Main component -----------------------------------------------------------

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("on_track");
  const [newPeriod, setNewPeriod] = useState("");

  const loadGoals = useCallback(() => {
    setGoals(mockGoals as GoalData[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    // Client-side only for demo
    setNewName("");
    setNewDescription("");
    setNewStatus("on_track");
    setNewPeriod("");
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleUpdateStatus = (id: string, status: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status } : g))
    );
  };

  const filtered = goals.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <button
          onClick={() => setShowCreateModal(true)}
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
          <p className="text-sm font-medium text-gray-900">No goals found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different filter or create a new goal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Create goal modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Goal</h2>
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
