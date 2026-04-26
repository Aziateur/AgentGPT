"use client";

import Link from "next/link";
import { ProjectIconGlyph } from "./sidebar-project-icon";
import { cn } from "@/lib/utils";

export interface SidebarProjectRow {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  href: string;
  active?: boolean;
}

interface SidebarProjectsListProps {
  projects: SidebarProjectRow[];
  collapsed: boolean;
  emptyLabel?: string;
}

export function SidebarProjectsList({
  projects,
  collapsed,
  emptyLabel = "No projects yet",
}: SidebarProjectsListProps) {
  if (projects.length === 0) {
    if (collapsed) return null;
    return (
      <p className="px-3 py-2 text-[11px] italic text-sidebar-text">{emptyLabel}</p>
    );
  }

  if (collapsed) {
    return (
      <div className="space-y-1 px-1.5">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            title={p.name}
            className={cn(
              "flex justify-center rounded-md py-1",
              p.active && "bg-sidebar-active"
            )}
          >
            <ProjectIconGlyph icon={p.icon} color={p.color} size={16} />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-0.5 px-1.5">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={p.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors",
              "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
              p.active && "bg-sidebar-active text-sidebar-text-active"
            )}
          >
            <ProjectIconGlyph icon={p.icon} color={p.color} size={16} />
            <span className="truncate">{p.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
