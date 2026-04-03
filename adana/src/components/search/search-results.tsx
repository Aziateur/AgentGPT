"use client";

import * as React from "react";
import {
  Search,
  CheckCircle2,
  FolderKanban,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Tag,
  X,
  SearchX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

interface SearchResultTask {
  kind: "task";
  id: string;
  name: string;
  projectName: string;
  status: "not_started" | "in_progress" | "completed";
  assigneeName: string | null;
  dueDate: string | null;
}

interface SearchResultProject {
  kind: "project";
  id: string;
  name: string;
  status: string;
  memberCount: number;
  taskCount: number;
}

interface SearchResultPerson {
  kind: "person";
  id: string;
  name: string;
  email: string;
  role: string;
}

type SearchResult = SearchResultTask | SearchResultProject | SearchResultPerson;

const mockResults: SearchResult[] = [
  // Tasks
  {
    kind: "task",
    id: "t1",
    name: "Design new landing page",
    projectName: "Website Redesign",
    status: "in_progress",
    assigneeName: "Sarah Chen",
    dueDate: "2026-04-15",
  },
  {
    kind: "task",
    id: "t2",
    name: "Fix login authentication bug",
    projectName: "Mobile App v2",
    status: "not_started",
    assigneeName: "James Wilson",
    dueDate: "2026-04-08",
  },
  {
    kind: "task",
    id: "t3",
    name: "Write design system documentation",
    projectName: "Design System",
    status: "completed",
    assigneeName: "Emily Park",
    dueDate: "2026-03-28",
  },
  {
    kind: "task",
    id: "t4",
    name: "Design email templates",
    projectName: "Marketing",
    status: "in_progress",
    assigneeName: null,
    dueDate: null,
  },
  // Projects
  {
    kind: "project",
    id: "p1",
    name: "Website Redesign",
    status: "On Track",
    memberCount: 5,
    taskCount: 48,
  },
  {
    kind: "project",
    id: "p2",
    name: "Design System",
    status: "Off Track",
    memberCount: 3,
    taskCount: 40,
  },
  // People
  {
    kind: "person",
    id: "u1",
    name: "Sarah Chen",
    email: "sarah@example.com",
    role: "Design Lead",
  },
  {
    kind: "person",
    id: "u2",
    name: "Emily Park",
    email: "emily@example.com",
    role: "Frontend Engineer",
  },
];

const STATUS_BADGE: Record<string, "default" | "info" | "success"> = {
  not_started: "default",
  in_progress: "info",
  completed: "success",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchResults() {
  const [query, setQuery] = React.useState("design");
  const [showFilters, setShowFilters] = React.useState(false);

  // Advanced filter state
  const [filterStatus, setFilterStatus] = React.useState<string>("");
  const [filterAssignee, setFilterAssignee] = React.useState("");
  const [filterProject, setFilterProject] = React.useState("");
  const [filterDateFrom, setFilterDateFrom] = React.useState("");
  const [filterDateTo, setFilterDateTo] = React.useState("");
  const [filterTag, setFilterTag] = React.useState("");

  // Filter results by query
  const filteredResults = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return mockResults.filter((r) => {
      let matches = false;
      if (r.kind === "task") {
        matches =
          r.name.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          (r.assigneeName?.toLowerCase().includes(q) ?? false);
        if (filterStatus && r.status !== filterStatus) return false;
        if (
          filterAssignee &&
          !r.assigneeName?.toLowerCase().includes(filterAssignee.toLowerCase())
        )
          return false;
        if (
          filterProject &&
          !r.projectName.toLowerCase().includes(filterProject.toLowerCase())
        )
          return false;
      } else if (r.kind === "project") {
        matches = r.name.toLowerCase().includes(q);
      } else if (r.kind === "person") {
        matches =
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q);
      }
      return matches;
    });
  }, [query, filterStatus, filterAssignee, filterProject]);

  const tasks = filteredResults.filter(
    (r): r is SearchResultTask => r.kind === "task"
  );
  const projects = filteredResults.filter(
    (r): r is SearchResultProject => r.kind === "project"
  );
  const people = filteredResults.filter(
    (r): r is SearchResultPerson => r.kind === "person"
  );

  const hasResults = filteredResults.length > 0;
  const hasQuery = query.trim().length > 0;

  const clearFilters = () => {
    setFilterStatus("");
    setFilterAssignee("");
    setFilterProject("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterTag("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search tasks, projects, people..."
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Advanced Filters
            {showFilters ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          {(filterStatus || filterAssignee || filterProject) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs"
              >
                <option value="">All</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Assignee
              </label>
              <input
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs"
                placeholder="Name..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Project
              </label>
              <input
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs"
                placeholder="Project name..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Date From
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Date To
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Tags
              </label>
              <input
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs"
                placeholder="Tag name..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasQuery && (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-500">
              Type to search across tasks, projects, and people.
            </p>
          </div>
        )}

        {hasQuery && !hasResults && (
          <div className="py-16 text-center">
            <SearchX className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm font-medium text-gray-700">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try a different search term or adjust your filters.
            </p>
          </div>
        )}

        {hasResults && (
          <div className="space-y-6">
            {/* Tasks */}
            {tasks.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Tasks
                  </h3>
                  <span className="text-xs text-gray-400">{tasks.length}</span>
                </div>
                <div className="space-y-1">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4 shrink-0",
                          task.status === "completed"
                            ? "text-green-500"
                            : "text-gray-300"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm",
                            task.status === "completed"
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          )}
                        >
                          {task.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {task.projectName}
                        </p>
                      </div>
                      {task.assigneeName && (
                        <Avatar size="xs" name={task.assigneeName} />
                      )}
                      <Badge variant={STATUS_BADGE[task.status] ?? "default"}>
                        {STATUS_LABEL[task.status]}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Projects
                  </h3>
                  <span className="text-xs text-gray-400">
                    {projects.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <FolderKanban className="h-4 w-4 shrink-0 text-indigo-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {proj.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {proj.memberCount} members &middot; {proj.taskCount}{" "}
                          tasks
                        </p>
                      </div>
                      <Badge variant="default">{proj.status}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            {people.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    People
                  </h3>
                  <span className="text-xs text-gray-400">
                    {people.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {people.map((person) => (
                    <button
                      key={person.id}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <Avatar size="sm" name={person.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {person.name}
                        </p>
                        <p className="text-xs text-gray-500">{person.email}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {person.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
