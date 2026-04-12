"use client";

import { useState } from "react";
import { X, Users as UsersIcon, Trash2, Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = ["owner", "admin", "editor", "commenter", "viewer"];

interface PermissionsModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

export function PermissionsModal({ open, projectId, onClose }: PermissionsModalProps) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === projectId));
  const users = useAppStore((s) => s.users);
  const projectMembers = useAppStore((s) =>
    s.projectMembers.filter((m) => m.projectId === projectId)
  );
  const addProjectMember = useAppStore((s) => s.addProjectMember);
  const removeProjectMember = useAppStore((s) => s.removeProjectMember);
  const updateProjectMember = useAppStore((s) => s.updateProjectMember);
  const updateProject = useAppStore((s) => s.updateProject);

  const [newUserId, setNewUserId] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("editor");

  if (!open) return null;

  const visibility: string =
    ((project as any)?.visibility as string | undefined) ?? "team-only";

  const nonMembers = users.filter(
    (u) => !projectMembers.some((m) => m.userId === u.id)
  );

  async function handleAdd() {
    if (!newUserId) return;
    await addProjectMember(projectId, newUserId, newRole);
    setNewUserId("");
    setNewRole("editor");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Manage project permissions
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Visibility --------------------------------------------------- */}
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Visibility
          </h4>
          <div className="space-y-1.5">
            {[
              { v: "public", label: "Public", desc: "Anyone in the workspace" },
              { v: "team-only", label: "Team only", desc: "Members of the team" },
              { v: "private", label: "Private", desc: "Only members you invite" },
            ].map((opt) => (
              <label
                key={opt.v}
                className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.v}
                  checked={visibility === opt.v}
                  onChange={() =>
                    updateProject(projectId, { visibility: opt.v } as any)
                  }
                  className="mt-0.5 h-3.5 w-3.5 accent-indigo-600"
                />
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Members ------------------------------------------------------ */}
        <div className="max-h-80 overflow-auto px-5 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Members ({projectMembers.length})
          </h4>
          {projectMembers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No members yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {projectMembers.map((m) => {
                const u = users.find((x) => x.id === m.userId);
                return (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {u?.name ?? m.userId}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {u?.email ?? ""}
                      </div>
                    </div>
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        updateProjectMember(projectId, m.userId, v)
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => removeProjectMember(projectId, m.userId)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add member --------------------------------------------------- */}
        <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Add member
          </h4>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Select value={newUserId} onValueChange={setNewUserId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {nonMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                  {nonMembers.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-gray-400">
                      All users already members.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={!newUserId}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default PermissionsModal;
