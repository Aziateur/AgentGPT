"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { mockTasks, mockProjects } from "@/lib/mock-data";
import {
  Search as SearchIcon,
  FileText,
  FolderKanban,
  Users,
  CheckSquare,
  X,
  SlidersHorizontal,
  Clock,
  Bookmark,
} from "lucide-react";

// -- Types --------------------------------------------------------------------

interface SearchResult {
  id: string;
  type: "task" | "project" | "person";
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
}

interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
}

const typeIcon: Record<string, typeof FileText> = {
  task: CheckSquare,
  project: FolderKanban,
  person: Users,
};

const typeColor: Record<string, string> = {
  task: "bg-blue-50 text-blue-600",
  project: "bg-purple-50 text-purple-600",
  person: "bg-green-50 text-green-600",
};

type TabKey = "all" | "task" | "project" | "person";

// -- Component ----------------------------------------------------------------

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load saved searches on mount
  useEffect(() => {
    // No saved searches in demo mode
  }, []);

  const doSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const q = searchQuery.toLowerCase();
    const mapped: SearchResult[] = [];

    for (const task of mockTasks) {
      if (task.title.toLowerCase().includes(q)) {
        mapped.push({
          id: task.id,
          type: "task",
          title: task.title,
          subtitle: task.projectId,
          meta: task.priority ? `${task.priority} priority` : undefined,
          href: `/projects/${task.projectId}/list`,
        });
      }
    }

    for (const project of mockProjects) {
      if (project.name.toLowerCase().includes(q)) {
        mapped.push({
          id: project.id,
          type: "project",
          title: project.name,
          subtitle: `${project._count.tasks} tasks, ${project._count.members} members`,
          href: `/projects/${project.id}/list`,
        });
      }
    }

    setResults(mapped);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const filtered = results.filter((r) => {
    if (activeTab === "all") return true;
    return r.type === activeTab;
  });

  const tabCounts = {
    all: results.length,
    task: results.filter((r) => r.type === "task").length,
    project: results.filter((r) => r.type === "project").length,
    person: results.filter((r) => r.type === "person").length,
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: tabCounts.all },
    { key: "task", label: "Tasks", count: tabCounts.task },
    { key: "project", label: "Projects", count: tabCounts.project },
    { key: "person", label: "People", count: tabCounts.person },
  ];

  function handleSaveSearch() {
    if (!query.trim()) return;
    // No-op for demo
  }

  function handleResultClick(result: SearchResult) {
    router.push(result.href);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, projects, and people..."
          autoFocus
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-20 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <>
              <button
                onClick={handleSaveSearch}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Save search"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                onClick={() => setQuery("")}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Saved searches (when empty) */}
      {!query && savedSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Bookmark className="h-3.5 w-3.5" />
            Saved Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((s) => (
              <button
                key={s.id}
                onClick={() => setQuery(s.query)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
            {query ? "No results found" : "Start typing to search"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {query
              ? "Try different keywords or remove filters."
              : "Search tasks, projects, and people across your workspace."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {filtered.map((result) => {
              const Icon = typeIcon[result.type];
              return (
                <li
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="flex cursor-pointer items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeColor[result.type]}`}>
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
  );
}
