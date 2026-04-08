"use client";

import { useState } from "react";
import {
  Plus,
  Users,
  FolderKanban,
  Mail,
  Search,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

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
  const { users, projects, loading } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeam, setExpandedTeam] = useState<string | null>("team-1");

  // Build a synthetic "team" from store.users grouped into one default team
  // since teams aren't in the Supabase store
  const allTeam = {
    id: "team-1",
    name: "Workspace Team",
    description: "All members of this workspace",
    memberCount: users.length,
    projectCount: projects.length,
    members: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: "member",
    })),
  };

  const teams = [allTeam];

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          <Users className="h-4 w-4" />
          {users.length} members
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
        <p className="text-sm font-medium text-indigo-800">Teams Management</p>
        <p className="mt-1 text-sm text-indigo-600">
          Full team creation and management features are coming soon. Below you can see all workspace members.
        </p>
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
          <p className="text-sm font-medium text-gray-900">No teams found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const members = team.members;
            return (
              <div key={team.id} className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                {/* Team header */}
                <div
                  className="flex cursor-pointer items-center gap-4 px-6 py-4"
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                    {team.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900">{team.name}</h2>
                    {team.description && (
                      <p className="text-xs text-gray-500">{team.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {team.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {team.projectCount} projects
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map((m, idx) => (
                      <div
                        key={m.id}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium ${colorForIndex(idx)}`}
                        title={m.name}
                      >
                        {m.name?.[0] || "?"}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition ${isExpanded ? "rotate-90" : ""}`} />
                </div>

                {/* Expanded member list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="flex items-center justify-between px-6 py-3">
                      <span className="text-xs font-medium text-gray-500">Members</span>
                    </div>
                    {members.length === 0 ? (
                      <div className="px-6 py-4 text-center text-xs text-gray-400">
                        No members yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {members.map((member, idx) => (
                          <li key={member.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${colorForIndex(idx)}`}>
                              {member.name?.[0] || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            )}
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
    </div>
  );
}
