"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ProjectIconGlyph } from "./sidebar-project-icon";
import { cn } from "@/lib/utils";

export interface StarredItem {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  /** Either a project (with sub-sections) or a portfolio. */
  kind: "project" | "portfolio";
  /** Optional sub-items (project sections) used when expanded. */
  subItems?: Array<{ id: string; name: string }>;
  /** Route to navigate to on click (list view for projects, etc.). */
  href: string;
  /** Route for the "See details" hover button (project overview, etc.). */
  detailsHref: string;
  /** Whether this row is currently active. */
  active?: boolean;
}

interface SidebarStarredRowProps {
  item: StarredItem;
}

function StarredRow({ item }: SidebarStarredRowProps) {
  const [open, setOpen] = useState(false);
  const hasSubs = (item.subItems?.length ?? 0) > 0;

  return (
    <div>
      <div
        className={cn(
          "group/row flex items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors",
          "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
          item.active && "bg-sidebar-active text-sidebar-text-active"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-sidebar-text"
          aria-label={open ? "Collapse" : "Expand"}
          disabled={!hasSubs}
        >
          {hasSubs ? (
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                open && "rotate-90"
              )}
            />
          ) : null}
        </button>
        <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-2">
          <ProjectIconGlyph icon={item.icon} color={item.color} size={16} />
          <span className="truncate">{item.name}</span>
        </Link>
        <Link
          href={item.detailsHref}
          aria-label={`See details for ${item.name}`}
          title="See details"
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-sidebar-text opacity-0 transition-opacity hover:bg-sidebar-hover hover:text-sidebar-text-active group-hover/row:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      {open && hasSubs && (
        <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-hover pl-2">
          {item.subItems!.map((s) => (
            <li key={s.id}>
              <Link
                href={`${item.href}#section-${s.id}`}
                className="block truncate rounded px-1.5 py-0.5 text-[12px] text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SidebarStarredListProps {
  items: StarredItem[];
  collapsed: boolean;
}

export function SidebarStarredList({ items, collapsed }: SidebarStarredListProps) {
  if (collapsed) {
    return (
      <div className="space-y-1 px-1.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            title={item.name}
            className={cn(
              "flex justify-center rounded-md py-1",
              item.active && "bg-sidebar-active"
            )}
          >
            <ProjectIconGlyph icon={item.icon} color={item.color} size={16} />
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-0.5 px-1.5">
      {items.map((item) => (
        <StarredRow key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
