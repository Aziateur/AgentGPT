"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Settings2,
  StickyNote,
  Paperclip,
  BarChart3,
  Bookmark,
  Plus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomizePanel } from "./customize-panel";
import { PermissionsModal } from "./permissions-modal";
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
import { useAppStore } from "@/store/app-store";
import type { Project, ProjectView, ProjectStatusType, User, SavedView } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtendedView = ProjectView | "overview" | "note" | "files" | "dashboard" | "workload";

interface ViewTab {
  id: ExtendedView;
  label: string;
  icon: React.ElementType;
}

const VIEW_TABS: ViewTab[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "timeline", label: "Timeline", icon: GanttChart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "workload", label: "Workload", icon: Users },
  { id: "note", label: "Note", icon: StickyNote },
  { id: "files", label: "Files", icon: Paperclip },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [savedViewName, setSavedViewName] = useState("");

  const savedViews = useAppStore((s) => s.savedViews);
  const createSavedView = useAppStore((s) => s.createSavedView);

  const searchParams = useSearchParams();
  const activeSavedViewId = searchParams?.get("view") ?? null;

  const projectSavedViews = savedViews.filter((v) => v.projectId === project.id);

  async function handleSelectSavedView(v: SavedView) {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v.id);
      window.history.replaceState({}, "", url.toString());
    } catch {}
    window.dispatchEvent(new CustomEvent("adana:apply-view", { detail: v }));
  }

  async function handleCreateSavedView() {
    const name = savedViewName.trim();
    if (!name) return;
    const viewType: SavedView["viewType"] =
      activeView === "list" || activeView === "board" || activeView === "timeline" || activeView === "calendar"
        ? activeView
        : "list";
    await createSavedView({
      name,
      projectId: project.id,
      viewType,
      filters: [],
      sort: [],
    });
    setSavedViewName("");
    setShowSavePopup(false);
  }

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

          {/* Customize button */}
          <Tooltip content="Customize">
            <span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomizeOpen((v) => !v)}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Customize
              </Button>
            </span>
          </Tooltip>

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
              <DropdownItem onClick={() => setPermissionsOpen(true)}>
                <Settings className="h-4 w-4" />
                Manage project permissions
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
      <div className="flex items-center gap-1 px-6 relative">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id && !activeSavedViewId;
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

        {/* Saved view tabs */}
        {projectSavedViews.map((v) => {
          const isActive = activeSavedViewId === v.id;
          return (
            <button
              key={v.id}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-indigo-600 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => handleSelectSavedView(v)}
              title={`Saved view (${v.viewType})`}
            >
              <Bookmark className="h-4 w-4" />
              {v.name}
            </button>
          );
        })}

        {/* Add saved view button */}
        <div className="relative">
          <button
            onClick={() => setShowSavePopup((s) => !s)}
            className="inline-flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-400 hover:text-indigo-600 border-b-2 border-transparent -mb-px"
            title="Save current view as tab"
          >
            <Plus className="h-4 w-4" />
          </button>
          {showSavePopup && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <p className="mb-2 text-xs font-semibold text-gray-700">Save current view</p>
              <input
                autoFocus
                value={savedViewName}
                onChange={(e) => setSavedViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSavedView();
                  if (e.key === "Escape") {
                    setShowSavePopup(false);
                    setSavedViewName("");
                  }
                }}
                placeholder="View name..."
                className="mb-2 w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => {
                    setShowSavePopup(false);
                    setSavedViewName("");
                  }}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSavedView}
                  className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customize side drawer */}
      <CustomizePanel
        projectId={project.id}
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />

      {/* Project permissions modal */}
      <PermissionsModal
        projectId={project.id}
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
      />
    </div>
  );
}
