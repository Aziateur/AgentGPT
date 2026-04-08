"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search as SearchIcon,
  FileText,
  FolderKanban,
  CheckSquare,
  X,
  Bookmark,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

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

// -- Component ----------------------------------------------------------------

export default function SearchPage() {
  const router = useRouter();
  const { tasks, projects, loading } = useAppStore();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Client-side search over store data
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const q = query.toLowerCase();
      const mapped: SearchResult[] = [];

      // Search tasks
      for (const task of tasks) {
        if (task.title.toLowerCase().includes(q)) {
          const project = projects.find((p) => p.id === task.projectId);
          mapped.push({
            id: task.id,
            type: "task",
            title: task.title,
            subtitle: project ? project.name : "No project",
            meta: task.priority && task.priority !== "none" ? `${task.priority} priority` : undefined,
            href: project ? `/projects/${project.id}/list` : "/my-tasks",
          });
        }
      }

      // Search projects
      for (const project of projects) {
        if (project.name.toLowerCase().includes(q) || (project.description || "").toLowerCase().includes(q)) {
          const taskCount = tasks.filter((t) => t.projectId === project.id).length;
          mapped.push({
            id: project.id,
            type: "project",
            title: project.name,
            subtitle: `${taskCount} task${taskCount !== 1 ? "s" : ""}`,
            href: `/projects/${project.id}/list`,
          });
        }
      }

      setResults(mapped);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tasks, projects]);

  const filtered = results.filter((r) => {
    if (activeTab === "all") return true;
    return r.type === activeTab;
  });

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

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks and projects..."
          autoFocus
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-20 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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
            {query ? "No results found" : "Start typing to search"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {query
              ? "Try different keywords or remove filters."
              : "Search tasks and projects across your workspace."}
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
