"use client";

import { useState } from "react";
import {
  Users,
  FolderKanban,
  MoreHorizontal,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

// -- Props --------------------------------------------------------------------

export interface TeamMember {
  id: string;
  name: string;
  initial: string;
  role: string;
  color: string;
}

export interface TeamCardProps {
  id: string;
  name: string;
  description: string;
  color: string;
  members: TeamMember[];
  projectCount: number;
  onClick?: (teamId: string) => void;
  className?: string;
}

// -- Component ----------------------------------------------------------------

export function TeamCard({
  id,
  name,
  description,
  color,
  members,
  projectCount,
  onClick,
  className,
}: TeamCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md ${className || ""}`}
      onClick={() => onClick?.(id)}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{description}</p>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-3.5 w-3.5" /> Leave team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <FolderKanban className="h-3.5 w-3.5" />
          {projectCount} project{projectCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Member avatars */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium ${m.color}`}
              title={`${m.name} - ${m.role}`}
            >
              {m.initial}
            </div>
          ))}
          {members.length > 5 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
              +{members.length - 5}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-gray-500" />
      </div>
    </div>
  );
}
