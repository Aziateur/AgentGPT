"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Users,
  FolderKanban,
  Search,
  ChevronRight,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

// -- Helpers ------------------------------------------------------------------

const memberColors = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-indigo-100 text-indigo-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-yellow-100 text-yellow-600",
  "bg-teal-100 text-teal-600",
  "bg-red-100 text-red-600",
];

function colorForIndex(i: number) {
  return memberColors[i % memberColors.length];
}

// -- Component ----------------------------------------------------------------

export default function TeamsPage() {
  const {
    users,
    projects,
    teams,
    teamMembers,
    currentUser,
    loading,
    createTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addMemberForTeam, setAddMemberForTeam] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      teams.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [teams, searchQuery]
  );

  const membersByTeam = (teamId: string) =>
    teamMembers.filter((tm) => tm.teamId === teamId);

  const projectsByTeam = (teamId: string) =>
    projects.filter((p) => p.teamId === teamId);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTeam({
      name: newName.trim(),
      description: newDesc.trim() || null,
      ownerId: currentUser.id || null,
    });
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <Button variant="primary" onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>
          New team
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teams..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Teams list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-900">No teams yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first team to start collaborating.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const tMembers = membersByTeam(team.id);
            const tProjects = projectsByTeam(team.id);
            const notInTeamUsers = users.filter(
              (u) => !tMembers.some((m) => m.userId === u.id)
            );
            return (
              <div
                key={team.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Team header */}
                <div
                  className="flex cursor-pointer items-center gap-4 px-6 py-4"
                  onClick={() =>
                    setExpandedTeam(isExpanded ? null : team.id)
                  }
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                    {team.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {team.name}
                    </h2>
                    {team.description && (
                      <p className="text-xs text-gray-500">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {tMembers.length} members
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {tProjects.length} projects
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {tMembers.slice(0, 4).map((m, idx) => {
                      const u = users.find((x) => x.id === m.userId);
                      return (
                        <div
                          key={m.userId}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium ${colorForIndex(
                            idx
                          )}`}
                          title={u?.name || m.userId}
                        >
                          {u?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      );
                    })}
                    {tMembers.length > 4 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
                        +{tMembers.length - 4}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete team "${team.name}"?`)) {
                        deleteTeam(team.id);
                      }
                    }}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete team"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight
                    className={`h-4 w-4 text-gray-400 transition ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Members */}
                    <div className="flex items-center justify-between px-6 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Members
                      </span>
                      {notInTeamUsers.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setAddMemberForTeam(
                                addMemberForTeam === team.id ? null : team.id
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Add member
                          </button>
                          {addMemberForTeam === team.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                              {notInTeamUsers.map((u) => (
                                <button
                                  key={u.id}
                                  onClick={async () => {
                                    await addTeamMember(team.id, u.id, "member");
                                    setAddMemberForTeam(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                                    {u.name?.[0]?.toUpperCase() || "?"}
                                  </div>
                                  <span className="flex-1 truncate">
                                    {u.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {tMembers.length === 0 ? (
                      <div className="px-6 py-4 text-center text-xs text-gray-400">
                        No members yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {tMembers.map((tm, idx) => {
                          const u = users.find((x) => x.id === tm.userId);
                          return (
                            <li
                              key={tm.userId}
                              className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50"
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${colorForIndex(
                                  idx
                                )}`}
                              >
                                {u?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {u?.name || tm.userId}
                                </p>
                                {u?.email && (
                                  <p className="text-xs text-gray-500">
                                    {u.email}
                                  </p>
                                )}
                              </div>
                              <select
                                value={tm.role}
                                onChange={(e) => {
                                  removeTeamMember(team.id, tm.userId).then(() =>
                                    addTeamMember(team.id, tm.userId, e.target.value)
                                  );
                                }}
                                className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                              </select>
                              <button
                                onClick={() =>
                                  removeTeamMember(team.id, tm.userId)
                                }
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Projects */}
                    <div className="border-t border-gray-100 px-6 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Projects
                      </span>
                    </div>
                    {tProjects.length === 0 ? (
                      <div className="px-6 pb-4 text-xs text-gray-400">
                        No projects in this team.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50 pb-2">
                        {tProjects.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-3 px-6 py-2 hover:bg-gray-50"
                          >
                            <div
                              className="h-3 w-3 rounded"
                              style={{ backgroundColor: p.color }}
                            />
                            <span className="text-sm text-gray-900">
                              {p.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create team modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create a new team"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Team name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              placeholder="e.g. Marketing"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              placeholder="What is this team about?"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!newName.trim()}
            >
              Create team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
