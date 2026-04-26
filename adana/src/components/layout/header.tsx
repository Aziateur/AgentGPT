"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  List,
  LayoutGrid,
  GanttChart,
  Calendar,
  Plus,
  Sun,
  Moon,
  ChevronRight,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useAppStore as useDataStore } from "@/store/app-store";
import { cn, isUserOOO } from "@/lib/utils";
import type { ProjectView } from "@/types";
import { InviteModal } from "@/components/invite-modal";
import { GlobalCreateMenu } from "@/components/layout/header-global-create-menu";
import { SearchPalette } from "@/components/layout/header-search-palette";
import { AdvancedSearchDialog } from "@/components/layout/header-advanced-search-dialog";
import { HelpMenu } from "@/components/layout/header-help-menu";
import { ShortcutsModal } from "@/components/layout/header-shortcuts-modal";
import { ProfileMenu } from "@/components/layout/header-profile-menu";

// ---------------------------------------------------------------------------
// View switcher configuration
// ---------------------------------------------------------------------------

const viewOptions: { type: ProjectView; icon: React.ReactNode; label: string }[] = [
  { type: "list", icon: <List className="h-4 w-4" />, label: "List" },
  { type: "board", icon: <LayoutGrid className="h-4 w-4" />, label: "Board" },
  { type: "timeline", icon: <GanttChart className="h-4 w-4" />, label: "Timeline" },
  { type: "calendar", icon: <Calendar className="h-4 w-4" />, label: "Calendar" },
];

// ---------------------------------------------------------------------------
// Breadcrumb label from pathname
// ---------------------------------------------------------------------------

function getBreadcrumbLabel(pathname: string): string {
  if (pathname === "/" || pathname === "/home") return "Home";
  if (pathname === "/my-tasks") return "My Tasks";
  if (pathname === "/inbox") return "Inbox";
  if (pathname === "/portfolios") return "Portfolios";
  if (pathname === "/goals") return "Goals";
  if (pathname === "/reporting") return "Reporting";
  if (pathname === "/search") return "Search";
  if (pathname === "/teams") return "Teams";
  if (pathname === "/projects" && !pathname.includes("/project/")) return "Projects";

  const projectViewMatch = pathname.match(/\/project\/(list|board|timeline|calendar|overview)/);
  if (projectViewMatch) {
    return projectViewMatch[1].charAt(0).toUpperCase() + projectViewMatch[1].slice(1);
  }

  if (pathname.startsWith("/project/")) return "Project";
  if (pathname.startsWith("/teams/")) return "Team";
  return "Page";
}

// ---------------------------------------------------------------------------
// Header component
// ---------------------------------------------------------------------------

export function Header() {
  const {
    currentUser,
    selectedProjectView,
    setProjectView,
  } = useAppStore();
  const theme = useDataStore((s) => (s as any).theme) ?? "light";
  const toggleTheme = useDataStore((s) => (s as any).toggleTheme);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const createBtnRef = useRef<HTMLButtonElement | null>(null);
  const helpBtnRef = useRef<HTMLButtonElement | null>(null);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);

  const isProjectPage = pathname.startsWith("/project/");
  const projectId = searchParams?.get("id");

  const breadcrumbLabel = getBreadcrumbLabel(pathname);

  const userInitials = currentUser
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "?";

  // Listen to global create event so other components can trigger create flows.
  // Also bind keyboard shortcuts.
  useEffect(() => {
    function onCreateProject() {
      router.push("/projects?new=1");
    }
    function onCreatePortfolio() {
      router.push("/portfolios?new=1");
    }
    function onCreateGoal() {
      router.push("/goals?new=1");
    }
    function onToggleCheatsheet() {
      setShortcutsOpen((v) => !v);
    }
    window.addEventListener("adana:create-project", onCreateProject);
    window.addEventListener("adana:create-portfolio", onCreatePortfolio);
    window.addEventListener("adana:create-goal", onCreateGoal);
    window.addEventListener("adana:toggle-cheatsheet", onToggleCheatsheet);
    return () => {
      window.removeEventListener("adana:create-project", onCreateProject);
      window.removeEventListener("adana:create-portfolio", onCreatePortfolio);
      window.removeEventListener("adana:create-goal", onCreateGoal);
      window.removeEventListener("adana:toggle-cheatsheet", onToggleCheatsheet);
    };
  }, [router]);

  // Header-owned keyboard shortcuts (don't intercept editable targets).
  useEffect(() => {
    function isEditable(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (target.isContentEditable) return true;
      return false;
    }

    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K -> open search palette
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchPaletteOpen(true);
        return;
      }

      // Cmd/Ctrl + / -> open shortcuts modal
      if (mod && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (isEditable(e.target)) return;

      // Cmd/Ctrl + 1/2/3 -> Home / My tasks / Inbox
      if (mod && (e.key === "1" || e.key === "2" || e.key === "3")) {
        e.preventDefault();
        if (e.key === "1") router.push("/home");
        if (e.key === "2") router.push("/my-tasks");
        if (e.key === "3") router.push("/inbox");
        return;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  function handleCreateTask() {
    window.dispatchEvent(new CustomEvent("adana:create-task"));
  }

  function handleCreateProject() {
    router.push("/projects?new=1");
    window.dispatchEvent(new CustomEvent("adana:create-project"));
  }

  function handleCreatePortfolio() {
    router.push("/portfolios?new=1");
    window.dispatchEvent(new CustomEvent("adana:create-portfolio"));
  }

  function handleCreateGoal() {
    router.push("/goals?new=1");
    window.dispatchEvent(new CustomEvent("adana:create-goal"));
  }

  function handleInvite() {
    setInviteOpen(true);
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-surface-dark">
        {/* Left: breadcrumb + create -------------------------------------- */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              My Workspace
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">{breadcrumbLabel}</span>
          </div>

          {/* Create pill ----------------------------------------------- */}
          <div className="relative">
            <button
              ref={createBtnRef}
              onClick={() => setCreateMenuOpen((v) => !v)}
              className="flex h-8 items-center gap-1.5 rounded-full bg-orange-500 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
              aria-label="Create"
              aria-expanded={createMenuOpen}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create</span>
              <ChevronDown className="h-3 w-3 opacity-80" />
            </button>
            <GlobalCreateMenu
              open={createMenuOpen}
              onClose={() => setCreateMenuOpen(false)}
              anchorRef={createBtnRef}
              onTaskClick={handleCreateTask}
              onProjectClick={handleCreateProject}
              onPortfolioClick={handleCreatePortfolio}
              onGoalClick={handleCreateGoal}
              onInviteClick={handleInvite}
            />
          </div>
        </div>

        {/* Center: Search bar --------------------------------------------- */}
        <div className="flex max-w-2xl flex-1 items-center justify-center px-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <button
              id="global-search"
              onClick={() => setSearchPaletteOpen(true)}
              className={cn(
                "h-9 w-full rounded-lg border bg-gray-50 pl-9 pr-9 text-left text-sm outline-none transition-colors",
                "border-gray-200 text-gray-400 hover:border-gray-300",
                "dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-400 dark:hover:border-gray-500"
              )}
            >
              Search
            </button>
            <button
              onClick={() => setAdvancedSearchOpen(true)}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600"
              aria-label="Advanced search"
              title="Advanced search"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: View switcher + actions --------------------------------- */}
        <div className="flex items-center gap-2">
          {/* View switcher (kept) */}
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-600">
            {viewOptions.map((view) => {
              const isActive = isProjectPage
                ? pathname.endsWith(`/${view.type}`)
                : selectedProjectView === view.type;

              return (
                <button
                  key={view.type}
                  onClick={() => {
                    setProjectView(view.type);
                    if (isProjectPage && projectId) {
                      router.push(`/project/${view.type}?id=${projectId}`);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-adana-50 text-adana-700 dark:bg-adana-900/30 dark:text-adana-300"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                  aria-label={`Switch to ${view.label} view`}
                >
                  {view.icon}
                  <span className="hidden lg:inline">{view.label}</span>
                </button>
              );
            })}
          </div>

          {/* Help button */}
          <div className="relative">
            <button
              ref={helpBtnRef}
              onClick={() => setHelpMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <HelpMenu
              open={helpMenuOpen}
              onClose={() => setHelpMenuOpen(false)}
              anchorRef={helpBtnRef}
              onOpenShortcuts={() => setShortcutsOpen(true)}
            />
          </div>

          {/* Theme toggle (kept) */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          {/* Profile avatar with chevron */}
          <div className="relative">
            <button
              ref={profileBtnRef}
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full pr-1 transition-opacity hover:opacity-90"
              aria-label="User menu"
            >
              <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-adana-600 text-xs font-semibold text-white">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitials
                )}
                {isUserOOO(currentUser) && (
                  <span
                    title="Out of office"
                    className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500 dark:border-surface-dark"
                  />
                )}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
            <ProfileMenu
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              anchorRef={profileBtnRef}
              onInviteClick={() => setInviteOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Search palette ------------------------------------------------- */}
      <SearchPalette
        open={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        onOpenAdvanced={() => setAdvancedSearchOpen(true)}
      />

      {/* Advanced search dialog ---------------------------------------- */}
      <AdvancedSearchDialog
        open={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
      />

      {/* Shortcuts modal ----------------------------------------------- */}
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Invite modal -------------------------------------------------- */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
