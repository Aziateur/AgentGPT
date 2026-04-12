"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search as SearchIcon,
  FileText,
  FolderKanban,
  CheckSquare,
  X,
  Bookmark,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/lib/supabase";
import type { SavedSearch } from "@/types";

// -- Types --------------------------------------------------------------------

interface SearchResult {
  id: string;
  type: "task" | "project";
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
}

const typeIcon: Record<string, typeof FileText> = {
  task: CheckSquare,
  project: FolderKanban,
};

const typeColor: Record<string, string> = {
  task: "bg-blue-50 text-blue-600",
  project: "bg-purple-50 text-purple-600",
};

type TabKey = "all" | "task" | "project";
type StatusFilter = "all" | "complete" | "incomplete";

interface AdvancedFilters {
  projectIds: string[];
  assigneeIds: string[];
  status: StatusFilter;
  priorities: string[];
  dueFrom: string;
  dueTo: string;
}

const EMPTY_FILTERS: AdvancedFilters = {
  projectIds: [],
  assigneeIds: [],
  status: "all",
  priorities: [],
  dueFrom: "",
  dueTo: "",
};

const PRIORITY_OPTIONS = ["high", "medium", "low", "none"];

// -- Component ----------------------------------------------------------------

export default function SearchPage() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const loading = useAppStore((s) => s.loading);
  const savedSearchesFromStore = useAppStore((s) => s.savedSearches);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [filters, setFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    setSavedSearches(savedSearchesFromStore);
  }, [savedSearchesFromStore]);

  function toggleIn<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  // -- Filter logic ----------------------------------------------------------
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) {
        return false;
      }
      if (filters.projectIds.length && (!t.projectId || !filters.projectIds.includes(t.projectId))) {
        return false;
      }
      if (filters.assigneeIds.length && (!t.assigneeId || !filters.assigneeIds.includes(t.assigneeId))) {
        return false;
      }
      if (filters.status === "complete" && !t.completed) return false;
      if (filters.status === "incomplete" && t.completed) return false;
      if (filters.priorities.length) {
        const p = t.priority ?? "none";
        if (!filters.priorities.includes(p)) return false;
      }
      if (filters.dueFrom && (!t.dueDate || new Date(t.dueDate) < new Date(filters.dueFrom))) {
        return false;
      }
      if (filters.dueTo && (!t.dueDate || new Date(t.dueDate) > new Date(filters.dueTo))) {
        return false;
      }
      return true;
    });
  }, [tasks, query, filters]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const results: SearchResult[] = useMemo(() => {
    const out: SearchResult[] = [];
    for (const task of filteredTasks) {
      const project = projects.find((p) => p.id === task.projectId);
      out.push({
        id: task.id,
        type: "task",
        title: task.title,
        subtitle: project ? project.name : "No project",
        meta:
          task.priority && task.priority !== "none"
            ? `${task.priority} priority`
            : undefined,
        href: project ? `/project/list?id=${project.id}` : "/my-tasks",
      });
    }
    for (const project of filteredProjects) {
      const count = tasks.filter((t) => t.projectId === project.id).length;
      out.push({
        id: project.id,
        type: "project",
        title: project.name,
        subtitle: `${count} task${count !== 1 ? "s" : ""}`,
        href: `/project/list?id=${project.id}`,
      });
    }
    return out;
  }, [filteredTasks, filteredProjects, projects, tasks]);

  const filtered = results.filter((r) => activeTab === "all" || r.type === activeTab);

  const tabCounts = {
    all: results.length,
    task: results.filter((r) => r.type === "task").length,
    project: results.filter((r) => r.type === "project").length,
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: tabCounts.all },
    { key: "task", label: "Tasks", count: tabCounts.task },
    { key: "project", label: "Projects", count: tabCounts.project },
  ];

  function handleResultClick(result: SearchResult) {
    router.push(result.href);
  }

  // -- Saved searches --------------------------------------------------------
  async function handleSaveSearch() {
    const name = window.prompt("Name this search:");
    if (!name || !name.trim()) return;
    const saved: SavedSearch = {
      id: crypto.randomUUID(),
      name: name.trim(),
      query,
      filters: JSON.stringify(filters),
      userId: currentUser.id || "",
      createdAt: new Date().toISOString(),
    };
    setSavedSearches((prev) => [...prev, saved]);
    try {
      await supabase.from("saved_searches").insert({
        id: saved.id,
        name: saved.name,
        query: saved.query,
        filters: filters,
        user_id: saved.userId,
        created_at: saved.createdAt,
      });
    } catch (err) {
      console.error("saveSearch failed", err);
    }
  }

  async function handleDeleteSaved(id: string) {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    try {
      await supabase.from("saved_searches").delete().eq("id", id);
    } catch (err) {
      console.error("deleteSavedSearch failed", err);
    }
  }

  function handleLoadSaved(s: SavedSearch) {
    setQuery(s.query);
    try {
      const parsed = typeof s.filters === "string" ? JSON.parse(s.filters) : s.filters;
      setFilters({ ...EMPTY_FILTERS, ...(parsed || {}) });
    } catch {
      setFilters(EMPTY_FILTERS);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_240px]">
        {/* Left: Filter panel */}
        <aside className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Project</p>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.projectIds.includes(p.id)}
                    onChange={() =>
                      setFilters((f) => ({ ...f, projectIds: toggleIn(f.projectIds, p.id) }))
                    }
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
              {projects.length === 0 && <p className="text-xs text-gray-400">No projects</p>}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Assignee</p>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.assigneeIds.includes(u.id)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        assigneeIds: toggleIn(f.assigneeIds, u.id),
                      }))
                    }
                  />
                  <span className="truncate">{u.name}</span>
                </label>
              ))}
              {users.length === 0 && <p className="text-xs text-gray-400">No users</p>}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Status</p>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value as StatusFilter }))
              }
              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
            >
              <option value="all">All</option>
              <option value="incomplete">Incomplete</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Priority</p>
            <div className="space-y-1">
              {PRIORITY_OPTIONS.map((pr) => (
                <label key={pr} className="flex items-center gap-2 text-xs capitalize text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.priorities.includes(pr)}
                    onChange={() =>
                      setFilters((f) => ({ ...f, priorities: toggleIn(f.priorities, pr) }))
                    }
                  />
                  {pr}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Due date</p>
            <input
              type="date"
              value={filters.dueFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dueFrom: e.target.value }))}
              className="mb-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
            />
            <input
              type="date"
              value={filters.dueTo}
              onChange={(e) => setFilters((f) => ({ ...f, dueTo: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
            />
          </div>

          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="w-full rounded-lg border border-gray-200 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            Clear filters
          </button>
        </aside>

        {/* Middle: Search + results */}
        <div>
          {/* Search input */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks and projects..."
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-28 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleSaveSearch}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
              >
                <Bookmark className="h-3 w-3" /> Save
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className="ml-1 text-xs text-gray-400">{tab.count}</span>
                {activeTab === tab.key && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <SearchIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-900">
                {query || Object.values(filters).some((v) => (Array.isArray(v) ? v.length : v && v !== "all"))
                  ? "No results found"
                  : "Start typing to search"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try different keywords or adjust filters.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <ul className="divide-y divide-gray-100">
                {filtered.map((result) => {
                  const Icon = typeIcon[result.type];
                  return (
                    <li
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="flex cursor-pointer items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeColor[result.type]}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{result.title}</p>
                        <p className="text-xs text-gray-500">{result.subtitle}</p>
                      </div>
                      {result.meta && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {result.meta}
                        </span>
                      )}
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-gray-500">
                        {result.type}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Saved searches */}
        <aside className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Saved searches</h3>
          {savedSearches.length === 0 ? (
            <p className="text-xs text-gray-400">
              No saved searches yet. Click Save after a query.
            </p>
          ) : (
            <ul className="space-y-1">
              {savedSearches.map((s) => (
                <li
                  key={s.id}
                  className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleLoadSaved(s)}
                    className="min-w-0 flex-1 truncate text-left text-gray-700 hover:text-indigo-600"
                  >
                    {s.name}
                  </button>
                  <button
                    onClick={() => handleDeleteSaved(s.id)}
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Delete saved search"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
