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
  LogOut,
  Settings,
  User as UserIcon,
  Sparkles,
  HelpCircle,
  CheckCircle,
  FolderOpen,
  Briefcase,
  Target,
  MessageSquare,
  UserPlus,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useAppStore as useDataStore } from "@/store/app-store";
import { cn, isUserOOO } from "@/lib/utils";
import type { ProjectView } from "@/types";
import { SmartChat } from "@/components/ai/smart-chat";
import { getDefaultProvider } from "@/lib/ai/settings";
import { GlobalSearchOverlay } from "@/components/search/global-search-overlay";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { InviteModal } from "@/components/invite-modal";

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
// Simple toast helper (inline, no deps)
// ---------------------------------------------------------------------------

function showToast(message: string) {
  if (typeof document === "undefined") return;
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className =
    "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-gray-700";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.3s";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 1600);
}

// ---------------------------------------------------------------------------
// Header component
// ---------------------------------------------------------------------------

export function Header() {
  const {
    currentUser,
    searchQuery,
    setSearchQuery,
    selectedProjectView,
    setProjectView,
  } = useAppStore();
  const theme = useDataStore((s) => (s as any).theme) ?? "light";
  const toggleTheme = useDataStore((s) => (s as any).toggleTheme);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const createBtnRef = useRef<HTMLButtonElement | null>(null);

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

  const providerReady = typeof window !== "undefined" ? getDefaultProvider() != null : false;

  // Close create menu on outside click
  useEffect(() => {
    if (!createMenuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!createBtnRef.current) return;
      const target = e.target as Node;
      if (!createBtnRef.current.parentElement?.contains(target)) {
        setCreateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [createMenuOpen]);

  function handleCreateTask() {
    setCreateMenuOpen(false);
    window.dispatchEvent(new CustomEvent("adana:create-task"));
  }

  function handleCreateProject() {
    setCreateMenuOpen(false);
    router.push("/projects?new=1");
    window.dispatchEvent(new CustomEvent("adana:create-project"));
  }

  function handleCreatePortfolio() {
    setCreateMenuOpen(false);
    router.push("/portfolios");
    window.dispatchEvent(new CustomEvent("adana:create-portfolio"));
  }

  function handleCreateGoal() {
    setCreateMenuOpen(false);
    router.push("/goals");
    window.dispatchEvent(new CustomEvent("adana:create-goal"));
  }

  function handleComingSoon(label: string) {
    setCreateMenuOpen(false);
    showToast(`${label}: Coming soon`);
  }

  function handleHelp() {
    window.dispatchEvent(new CustomEvent("adana:toggle-cheatsheet"));
  }

  const createOptions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }> = [
    { icon: <CheckCircle className="h-4 w-4 text-red-500" />, label: "Task", onClick: handleCreateTask },
    { icon: <FolderOpen className="h-4 w-4 text-indigo-500" />, label: "Project", onClick: handleCreateProject },
    { icon: <Briefcase className="h-4 w-4 text-purple-500" />, label: "Portfolio", onClick: handleCreatePortfolio },
    { icon: <Target className="h-4 w-4 text-green-500" />, label: "Goal", onClick: handleCreateGoal },
    { icon: <MessageSquare className="h-4 w-4 text-blue-500" />, label: "Message", onClick: () => handleComingSoon("Message") },
    { icon: <UserPlus className="h-4 w-4 text-orange-500" />, label: "Invite", onClick: () => handleComingSoon("Invite") },
  ];

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-surface-dark">
        {/* Left: Breadcrumb ------------------------------------------------- */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            My Workspace
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400">{breadcrumbLabel}</span>
        </div>

        {/* Center: Create + AI + Search ----------------------------------- */}
        <div className="flex max-w-2xl flex-1 items-center justify-center gap-2 px-4">
          {/* Create dropdown */}
          <div className="relative">
            <button
              ref={createBtnRef}
              onClick={() => setCreateMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-colors hover:bg-orange-600"
              aria-label="Create"
              aria-expanded={createMenuOpen}
            >
              <Plus className="h-4 w-4" />
            </button>
            {createMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-11 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-surface-dark"
              >
                <div className="border-b border-gray-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-700">
                  Create
                </div>
                {createOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={opt.onClick}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* AI sparkle button */}
          <button
            onClick={() => setAiPanelOpen((v) => !v)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
              aiPanelOpen
                ? "border-adana-300 bg-adana-50 text-adana-700 dark:border-adana-700 dark:bg-adana-900/30 dark:text-adana-300"
                : "border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
            aria-label="Toggle AI assistant"
          >
            <Sparkles className="h-4 w-4" />
          </button>

          {/* Global search bar */}
          <motion.div
            animate={{ width: searchFocused ? 420 : 320 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="global-search"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                setSearchFocused(true);
                e.currentTarget.blur();
                setGlobalSearchOpen(true);
              }}
              onClick={() => setGlobalSearchOpen(true)}
              onBlur={() => setSearchFocused(false)}
              readOnly
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className={cn(
                "h-9 w-full rounded-lg border bg-gray-50 pl-9 pr-3 text-sm outline-none transition-colors",
                "placeholder:text-gray-400",
                "dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200",
                searchFocused
                  ? "border-adana-400 bg-white ring-2 ring-adana-100 dark:ring-adana-900/30"
                  : "border-gray-200 hover:border-gray-300"
              )}
            />
          </motion.div>
        </div>

        {/* Right: View switcher + actions ----------------------------------- */}
        <div className="flex items-center gap-2">
          {/* View switcher */}
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

          {/* Help / keyboard shortcuts */}
          <button
            onClick={handleHelp}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
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

          {/* User avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-adana-600 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              aria-label="User menu"
            >
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
            </button>

            {avatarMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAvatarMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-surface-dark"
                >
                  {currentUser && (
                    <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentUser.email}
                      </p>
                    </div>
                  )}
                  <WorkspaceSwitcher />
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      router.push("/settings/profile");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      router.push("/settings/admin");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4" />
                    Admin console
                  </button>
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      setInviteOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite teammates
                  </button>
                  <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                  <button
                    onClick={() => {
                      useDataStore.getState().logout();
                      useAppStore.getState().setCurrentUser(null);
                      router.push("/login");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global search overlay ---------------------------------------- */}
      <GlobalSearchOverlay
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />

      {/* AI side drawer ------------------------------------------------ */}
      {aiPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setAiPanelOpen(false)}
          />
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-screen w-[400px] flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-surface-dark"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-adana-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Adana AI
                </span>
              </div>
              <button
                onClick={() => setAiPanelOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close AI panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {providerReady ? (
                <SmartChat className="h-full" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <Sparkles className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No AI provider configured.
                  </p>
                  <button
                    onClick={() => {
                      setAiPanelOpen(false);
                      router.push("/settings/ai");
                    }}
                    className="text-sm font-medium text-adana-600 hover:underline dark:text-adana-400"
                  >
                    Configure an AI provider in /settings/ai
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
