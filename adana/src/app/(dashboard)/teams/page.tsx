"use client";

import { useState } from "react";
import {
  Plus,
  Users,
  FolderKanban,
  MoreHorizontal,
  Mail,
  Search,
  UserPlus,
  ChevronRight,
} from "lucide-react";

// -- Mock data ----------------------------------------------------------------

interface MockTeamMember {
  id: string;
  name: string;
  initial: string;
  role: string;
  email: string;
  color: string;
}

interface MockTeam {
  id: string;
  name: string;
  description: string;
  members: MockTeamMember[];
  projectCount: number;
  color: string;
}

const mockTeams: MockTeam[] = [
  {
    id: "team-1",
    name: "Engineering",
    description: "Core product engineering team responsible for building and maintaining the platform.",
    color: "#4f46e5",
    projectCount: 8,
    members: [
      { id: "u1", name: "Alex Kim", initial: "A", role: "Lead Engineer", email: "alex@adana.io", color: "bg-blue-100 text-blue-600" },
      { id: "u2", name: "Sarah Chen", initial: "S", role: "Senior Engineer", email: "sarah@adana.io", color: "bg-purple-100 text-purple-600" },
      { id: "u3", name: "Jordan Lee", initial: "J", role: "Engineer", email: "jordan@adana.io", color: "bg-green-100 text-green-600" },
      { id: "u4", name: "Demo User", initial: "D", role: "Engineer", email: "demo@adana.io", color: "bg-indigo-100 text-indigo-600" },
    ],
  },
  {
    id: "team-2",
    name: "Design",
    description: "Product design and user experience team.",
    color: "#7c3aed",
    projectCount: 5,
    members: [
      { id: "u5", name: "Taylor Swift", initial: "T", role: "Design Lead", email: "taylor@adana.io", color: "bg-orange-100 text-orange-600" },
      { id: "u2b", name: "Sarah Chen", initial: "S", role: "UI Designer", email: "sarah@adana.io", color: "bg-purple-100 text-purple-600" },
      { id: "u6", name: "Morgan Davis", initial: "M", role: "UX Researcher", email: "morgan@adana.io", color: "bg-pink-100 text-pink-600" },
    ],
  },
  {
    id: "team-3",
    name: "Marketing",
    description: "Growth and marketing team managing campaigns and brand.",
    color: "#d97706",
    projectCount: 3,
    members: [
      { id: "u7", name: "Casey Brown", initial: "C", role: "Marketing Lead", email: "casey@adana.io", color: "bg-yellow-100 text-yellow-600" },
      { id: "u8", name: "Riley Garcia", initial: "R", role: "Content Writer", email: "riley@adana.io", color: "bg-red-100 text-red-600" },
    ],
  },
  {
    id: "team-4",
    name: "Operations",
    description: "Infrastructure, DevOps, and internal tools.",
    color: "#059669",
    projectCount: 4,
    members: [
      { id: "u3b", name: "Jordan Lee", initial: "J", role: "DevOps Lead", email: "jordan@adana.io", color: "bg-green-100 text-green-600" },
      { id: "u9", name: "Quinn Patel", initial: "Q", role: "SRE", email: "quinn@adana.io", color: "bg-teal-100 text-teal-600" },
    ],
  },
];

// -- Component ----------------------------------------------------------------

export default function TeamsPage() {
  const [teams] = useState(mockTeams);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </button>
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
          <p className="mt-1 text-sm text-gray-500">Try a different search or create a new team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((team) => {
            const isExpanded = expandedTeam === team.id;
            return (
              <div key={team.id} className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                {/* Team header */}
                <div
                  className="flex cursor-pointer items-center gap-4 px-6 py-4"
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900">{team.name}</h2>
                    <p className="text-xs text-gray-500">{team.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {team.members.length} members
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {team.projectCount} projects
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium ${m.color}`}
                        title={m.name}
                      >
                        {m.initial}
                      </div>
                    ))}
                    {team.members.length > 4 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
                        +{team.members.length - 4}
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
                      <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                        <UserPlus className="h-3 w-3" />
                        Invite
                      </button>
                    </div>
                    <ul className="divide-y divide-gray-50">
                      {team.members.map((member) => (
                        <li key={member.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${member.color}`}>
                            {member.initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                          <a href={`mailto:${member.email}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create team modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Team</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="What does this team do?"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
