"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import type { ProjectView } from "@/types";

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
// Header component
// ---------------------------------------------------------------------------

export function Header() {
  const {
    currentUser,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    selectedProjectView,
    setProjectView,
  } = useAppStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const userInitials = currentUser
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "?";

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-surface-dark">
      {/* Left: Breadcrumb ------------------------------------------------- */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          My Workspace
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-gray-500 dark:text-gray-400">Projects</span>
      </div>

      {/* Center: Global search bar ---------------------------------------- */}
      <div className="flex max-w-md flex-1 justify-center px-4">
        <motion.div
          animate={{ width: searchFocused ? 420 : 320 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
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
          {viewOptions.map((view) => (
            <button
              key={view.type}
              onClick={() => setProjectView(view.type)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                selectedProjectView === view.type
                  ? "bg-adana-50 text-adana-700 dark:bg-adana-900/30 dark:text-adana-300"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
              aria-label={`Switch to ${view.label} view`}
            >
              {view.icon}
              <span className="hidden lg:inline">{view.label}</span>
            </button>
          ))}
        </div>

        {/* Create button */}
        <button className="flex h-8 items-center gap-1.5 rounded-lg bg-adana-600 px-3 text-sm font-medium text-white transition-colors hover:bg-adana-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
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
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-adana-600 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            aria-label="User menu"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-full w-full object-cover"
              />
            ) : (
              userInitials
            )}
          </button>

          {avatarMenuOpen && (
            <>
              {/* Invisible backdrop to close the dropdown */}
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
                <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
