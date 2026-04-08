"use client";

import React, { useState } from "react";
import {
  Star,
  Share2,
  MoreHorizontal,
  List,
  LayoutGrid,
  GanttChart,
  CalendarDays,
  FileText,
  Pencil,
  Archive,
  Trash2,
  Copy,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import type { Project, ProjectView, ProjectStatusType, User } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtendedView = ProjectView | "overview";

interface ViewTab {
  id: ExtendedView;
  label: string;
  icon: React.ElementType;
}

const VIEW_TABS: ViewTab[] = [
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "timeline", label: "Timeline", icon: GanttChart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "overview", label: "Overview", icon: FileText },
];

export interface ProjectHeaderProps {
  project?: Project;
  members?: User[];
  currentView?: ExtendedView;
  isFavorite?: boolean;
  onViewChange?: (view: ExtendedView) => void;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSettings?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROJECT: Project = {
  id: "p1",
  name: "Website Redesign",
  description: null,
  color: "#6366f1",
  icon: "",
  creatorId: "u1",
  favorite: false,
  ownerId: "u1",
  teamId: "t1",
  privacy: "public",
  defaultView: "board",
  status: "on_track",
  statusText: null,
  startDate: null,
  dueDate: "2026-05-15",
  archived: false,
  memberIds: ["u1", "u2", "u3", "u4"],
  sectionIds: [],
  createdAt: "",
  updatedAt: "",
};

const MOCK_MEMBERS: User[] = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", avatar: null },
  { id: "u2", name: "Bob Park", email: "bob@example.com", avatar: null },
  { id: "u3", name: "Carol Smith", email: "carol@example.com", avatar: null },
  { id: "u4", name: "David Lee", email: "david@example.com", avatar: null },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_MAP: Record<ProjectStatusType, { label: string; variant: "success" | "warning" | "high" | "default" | "info" }> = {
  on_track: { label: "On track", variant: "success" },
  at_risk: { label: "At risk", variant: "warning" },
  off_track: { label: "Off track", variant: "high" },
  on_hold: { label: "On hold", variant: "default" },
  complete: { label: "Complete", variant: "info" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectHeader({
  project: projectProp,
  members: membersProp,
  currentView: currentViewProp,
  isFavorite: isFavoriteProp,
  onViewChange,
  onToggleFavorite,
  onShare,
  onEdit,
  onArchive,
  onDelete,
  onDuplicate,
  onSettings,
  className,
}: ProjectHeaderProps) {
  const project = projectProp ?? MOCK_PROJECT;
  const members = membersProp ?? MOCK_MEMBERS;
  const [activeView, setActiveView] = useState<ExtendedView>((currentViewProp ?? project.defaultView) as ExtendedView);
  const [favorite, setFavorite] = useState(isFavoriteProp ?? false);

  const statusCfg = STATUS_BADGE_MAP[project.status as ProjectStatusType];

  function handleViewChange(view: ExtendedView) {
    setActiveView(view);
    onViewChange?.(view);
  }

  function handleToggleFavorite() {
    setFavorite(!favorite);
    onToggleFavorite?.();
  }

  const MAX_VISIBLE_AVATARS = 4;
  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = Math.max(members.length - MAX_VISIBLE_AVATARS, 0);

  return (
    <div className={cn("border-b border-gray-200 bg-white", className)}>
      {/* Top row: project name + actions */}
      <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Project color icon */}
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="truncate text-xl font-bold text-gray-900">{project.name}</h1>

          {/* Status badge */}
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Member avatars (stacked) */}
          <div className="flex items-center -space-x-2 mr-2">
            {visibleMembers.map((member) => (
              <Tooltip key={member.id} content={member.name}>
                <span className="relative inline-block ring-2 ring-white rounded-full">
                  <Avatar size="sm" name={member.name} src={member.avatar ?? undefined} />
                </span>
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Tooltip content={`${remainingCount} more member${remainingCount > 1 ? "s" : ""}`}>
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white">
                  +{remainingCount}
                </span>
              </Tooltip>
            )}
          </div>

          {/* Favorite toggle */}
          <Tooltip content={favorite ? "Remove from favorites" : "Add to favorites"}>
            <span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleFavorite}
              >
                <Star
                  className={cn(
                    "h-4 w-4 transition-colors",
                    favorite ? "fill-amber-400 text-amber-400" : "text-gray-400"
                  )}
                />
              </Button>
            </span>
          </Tooltip>

          {/* Share button */}
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>

          {/* More menu */}
          <DropdownMenu>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Edit project
              </DropdownItem>
              <DropdownItem onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
                Duplicate project
              </DropdownItem>
              <DropdownItem onClick={onSettings}>
                <Settings className="h-4 w-4" />
                Project settings
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={onArchive}>
                <Archive className="h-4 w-4" />
                Archive project
              </DropdownItem>
              <DropdownItem destructive onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete project
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>
        </div>
      </div>

      {/* View switcher tabs */}
      <div className="flex items-center gap-1 px-6">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-indigo-600 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => handleViewChange(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
