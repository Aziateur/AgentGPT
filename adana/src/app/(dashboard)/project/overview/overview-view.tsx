"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserPlus, Trash2, Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";

// -- Helpers ------------------------------------------------------------------

type ProjectStatusType = "on_track" | "at_risk" | "off_track" | "on_hold" | "complete";

const statusColor: Record<string, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-yellow-100 text-yellow-700",
  off_track: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
  complete: "bg-blue-100 text-blue-700",
};

const statusLabel: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  on_hold: "On Hold",
  complete: "Complete",
};

const memberColors = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-indigo-100 text-indigo-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
];

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "overview", label: "Overview" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/project/${v.key}?id=${projectId}`}
          className={`relative px-3 py-2.5 text-sm font-medium transition ${
            active === v.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {v.label}
          {active === v.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
          )}
        </Link>
      ))}
    </div>
  );
}

// -- Page ---------------------------------------------------------------------

export default function OverviewViewClient() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id") as string;

  const {
    projects,
    users,
    projectMembers,
    projectStatusUpdates,
    currentUser,
    getProjectTasks,
    updateProject,
    addProjectMember,
    removeProjectMember,
    postProjectStatus,
  } = useAppStore();

  const project = projects.find((p) => p.id === id);
  const allTasks = getProjectTasks(id);

  // Brief (local buffer for textarea, synced when project changes)
  const [briefDraft, setBriefDraft] = useState<string>("");
  useEffect(() => {
    setBriefDraft((project?.briefMd as string) ?? "");
  }, [project?.id, project?.briefMd]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showPostStatus, setShowPostStatus] = useState(false);
  const [newStatusType, setNewStatusType] = useState<ProjectStatusType>("on_track");
  const [newStatusText, setNewStatusText] = useState("");

  // Members
  const members = useMemo(
    () =>
      projectMembers
        .filter((pm) => pm.projectId === id)
        .map((pm) => ({
          ...pm,
          user: users.find((u) => u.id === pm.userId),
        })),
    [projectMembers, users, id]
  );

  const owner = project ? users.find((u) => u.id === project.creatorId) : null;

  const notMemberUsers = users.filter(
    (u) => !members.some((m) => m.userId === u.id)
  );

  // Status updates
  const statusHistory = useMemo(
    () =>
      projectStatusUpdates
        .filter((s) => s.projectId === id)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [projectStatusUpdates, id]
  );
  const latestStatus = statusHistory[0];
  const latestStatusType = (latestStatus?.status ?? "on_track") as string;

  // Stats
  const now = new Date();
  const inOneWeek = new Date();
  inOneWeek.setDate(inOneWeek.getDate() + 7);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: Task) => t.completed).length;
  const overdueTasks = allTasks.filter((t: Task) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  }).length;
  const upcomingWeekTasks = allTasks.filter((t: Task) => {
    if (t.completed || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= now && d <= inOneWeek;
  }).length;

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Project not found.</p>
      </div>
    );
  }

  const handleBriefBlur = () => {
    if (briefDraft !== ((project.briefMd as string) ?? "")) {
      updateProject(project.id, { briefMd: briefDraft } as Record<string, unknown>);
    }
  };

  const handlePostStatus = async () => {
    await postProjectStatus(project.id, newStatusType, newStatusText.trim() || undefined);
    setNewStatusText("");
    setNewStatusType("on_track");
    setShowPostStatus(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={id} active="overview" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          {/* Project header */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: project.color }}
                  />
                  <h1 className="text-xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[latestStatusType] ?? statusColor.on_track}`}
                  >
                    {statusLabel[latestStatusType] ?? latestStatusType}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {project.description}
                  </p>
                )}
                {owner && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span>Owner:</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                      {owner.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="font-medium text-gray-700">{owner.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{completedTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{overdueTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Due this week</p>
              <p className="mt-1 text-2xl font-bold text-indigo-600">{upcomingWeekTasks}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">Overall Progress</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Members */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Members ({members.length})
              </h3>
              {notMemberUsers.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add member
                  </button>
                  {showAddMember && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                      {notMemberUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={async () => {
                            await addProjectMember(project.id, u.id, "member");
                            setShowAddMember(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="flex-1 truncate">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {members.length === 0 ? (
              <div className="px-5 py-4 text-sm text-gray-400">
                No members yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-4">
                {members.map((m, idx) => (
                  <div
                    key={m.userId}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${memberColors[idx % memberColors.length]}`}
                    >
                      {m.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {m.user?.name || m.userId}
                    </span>
                    <span className="text-[10px] text-gray-400">{m.role}</span>
                    <button
                      onClick={() => removeProjectMember(project.id, m.userId)}
                      className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove member"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brief */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Project Brief</h3>
            </div>
            <div className="p-4">
              <textarea
                value={briefDraft}
                onChange={(e) => setBriefDraft(e.target.value)}
                onBlur={handleBriefBlur}
                rows={6}
                placeholder="Describe the goals, context, and key resources for this project..."
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Status updates */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Status Updates
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPostStatus(!showPostStatus)}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                Post status
              </Button>
            </div>

            {showPostStatus && (
              <div className="space-y-3 border-b border-gray-100 bg-gray-50 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={newStatusType}
                    onChange={(e) => setNewStatusType(e.target.value as ProjectStatusType)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="on_track">On Track</option>
                    <option value="at_risk">At Risk</option>
                    <option value="off_track">Off Track</option>
                    <option value="on_hold">On Hold</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Update (optional)
                  </label>
                  <textarea
                    value={newStatusText}
                    onChange={(e) => setNewStatusText(e.target.value)}
                    rows={3}
                    placeholder="What's happening on this project..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPostStatus(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handlePostStatus}>
                    Post
                  </Button>
                </div>
              </div>
            )}

            {statusHistory.length === 0 ? (
              <div className="px-5 py-4 text-sm text-gray-400">
                No status updates yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {statusHistory.slice(0, 5).map((s) => {
                  const author = users.find((u) => u.id === s.authorId);
                  return (
                    <li key={s.id} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[s.status] ?? statusColor.on_track}`}
                        >
                          {statusLabel[s.status] ?? s.status}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {author?.name || "Someone"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(s.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {s.text && (
                        <p className="mt-1 text-sm text-gray-600">{s.text}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
