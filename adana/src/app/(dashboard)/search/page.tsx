"use client";

import { useState } from "react";
import {
  Search as SearchIcon,
  FileText,
  FolderKanban,
  Users,
  CheckSquare,
  X,
  SlidersHorizontal,
  Clock,
} from "lucide-react";

// -- Mock data ----------------------------------------------------------------

interface SearchResult {
  id: string;
  type: "task" | "project" | "person";
  title: string;
  subtitle: string;
  meta?: string;
}

const allResults: SearchResult[] = [
  { id: "r1", type: "task", title: "Design homepage wireframes", subtitle: "Website Redesign > To Do", meta: "High priority" },
  { id: "r2", type: "task", title: "Implement navigation component", subtitle: "Website Redesign > In Progress", meta: "Due Apr 8" },
  { id: "r3", type: "task", title: "Design system tokens", subtitle: "Design System > In Progress", meta: "Medium priority" },
  { id: "r4", type: "task", title: "API endpoint for tasks", subtitle: "API Integration > In Review", meta: "High priority" },
  { id: "r5", type: "task", title: "Write unit tests", subtitle: "Website Redesign > To Do" },
  { id: "r6", type: "task", title: "Deploy staging environment", subtitle: "Mobile App v2 > Done" },
  { id: "r7", type: "project", title: "Website Redesign", subtitle: "Engineering team, 24 tasks" },
  { id: "r8", type: "project", title: "Mobile App v2", subtitle: "Engineering team, 36 tasks" },
  { id: "r9", type: "project", title: "Design System", subtitle: "Design team, 18 tasks" },
  { id: "r10", type: "project", title: "Data Pipeline Upgrade", subtitle: "Operations team, 15 tasks" },
  { id: "r11", type: "person", title: "Sarah Chen", subtitle: "Senior Engineer, Engineering" },
  { id: "r12", type: "person", title: "Alex Kim", subtitle: "Lead Engineer, Engineering" },
  { id: "r13", type: "person", title: "Jordan Lee", subtitle: "Engineer, Engineering & Operations" },
  { id: "r14", type: "person", title: "Taylor Swift", subtitle: "Design Lead, Design" },
  { id: "r15", type: "person", title: "Demo User", subtitle: "Engineer, Engineering" },
];

const recentSearches = [
  "wireframes",
  "deploy",
  "Sarah Chen",
  "Mobile App",
];

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
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filtered = allResults.filter((r) => {
    const matchesQuery =
      query === "" ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchesTab = activeTab === "all" || r.type === activeTab;
    return matchesQuery && matchesTab;
  });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: allResults.filter((r) => query === "" || r.title.toLowerCase().includes(query.toLowerCase()) || r.subtitle.toLowerCase().includes(query.toLowerCase())).length },
    { key: "task", label: "Tasks", count: allResults.filter((r) => r.type === "task" && (query === "" || r.title.toLowerCase().includes(query.toLowerCase()))).length },
    { key: "project", label: "Projects", count: allResults.filter((r) => r.type === "project" && (query === "" || r.title.toLowerCase().includes(query.toLowerCase()))).length },
    { key: "person", label: "People", count: allResults.filter((r) => r.type === "person" && (query === "" || r.title.toLowerCase().includes(query.toLowerCase()))).length },
  ];

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
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-10 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Recent searches (when empty) */}
      {!query && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                {s}
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
        <div className="flex-1" />
        <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <SearchIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-900">No results found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try different keywords or remove filters.
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
