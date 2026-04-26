"use client";

import * as React from "react";
import { MoreHorizontal, X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const MEMBER_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-indigo-100 text-indigo-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-rose-100 text-rose-600",
];

interface MembersRowProps {
  projectId: string;
  max?: number;
}

export function MembersRow({ projectId, max = 4 }: MembersRowProps) {
  const users = useAppStore((s) => s.users);
  const projectMembers = useAppStore((s) =>
    s.projectMembers.filter((m) => m.projectId === projectId)
  );
  const project = useAppStore((s) => s.projects.find((p) => p.id === projectId));

  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Build the list with the owner first if they aren't already a member.
  const ownerId = project?.creatorId;
  const memberIds = new Set(projectMembers.map((m) => m.userId));
  const orderedIds: string[] = [];
  if (ownerId && !memberIds.has(ownerId)) orderedIds.push(ownerId);
  for (const m of projectMembers) orderedIds.push(m.userId);

  const ordered = orderedIds
    .map((uid) => users.find((u) => u.id === uid))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  if (ordered.length === 0) {
    return null;
  }

  const visible = ordered.slice(0, max);
  const overflow = Math.max(0, ordered.length - visible.length);

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <div className="flex -space-x-2">
        {visible.map((u, idx) => (
          <div
            key={u.id}
            title={u.name}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold",
              MEMBER_COLORS[idx % MEMBER_COLORS.length]
            )}
          >
            {u.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        ))}
        {overflow > 0 && (
          <div
            title={`+${overflow} more`}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-semibold text-gray-600"
          >
            +{overflow}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Show all members"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Members ({ordered.length})
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="max-h-72 space-y-1 overflow-auto">
            {ordered.map((u, idx) => {
              const isOwner = u.id === ownerId;
              const role = isOwner
                ? "owner"
                : projectMembers.find((m) => m.userId === u.id)?.role ?? "member";
              return (
                <li
                  key={u.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5"
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
                      MEMBER_COLORS[idx % MEMBER_COLORS.length]
                    )}
                  >
                    {u.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {u.name}
                    </div>
                    <div className="truncate text-[11px] text-gray-500">
                      {u.email}
                    </div>
                  </div>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {role}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 border-t border-gray-100 pt-2 text-[11px] text-gray-400">
            Read-only list. Use the Overview tab to manage members.
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersRow;
