"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  CheckSquare,
  FolderKanban,
  User as UserIcon,
  Briefcase,
  Target,
  Clock,
  Bookmark,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

// -- Types --------------------------------------------------------------------

export type GlobalEntityType =
  | "task"
  | "project"
  | "person"
  | "portfolio"
  | "goal"
  | "more";

type TabKey = "all" | GlobalEntityType;

interface RecentItem {
  type: GlobalEntityType;
  id: string;
  title: string;
  at: number;
}

interface ResultItem {
  type: GlobalEntityType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

// -- Constants ----------------------------------------------------------------

const RECENTS_KEY = "adana:recents";
const MAX_RECENTS = 20;

const PREBUILT_SAVED_SEARCHES: Array<{
  id: string;
  name: string;
  query: string;
  filter: string;
}> = [
  { id: "builtin-created", name: "Tasks I've created", query: "", filter: "created_by_me" },
  { id: "builtin-assigned-others", name: "Tasks I've assigned to others", query: "", filter: "assigned_by_me" },
  { id: "builtin-completed", name: "Recently completed tasks", query: "", filter: "recently_completed" },
  { id: "builtin-deleted", name: "Deleted", query: "", filter: "deleted" },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "task", label: "Tasks" },
  { key: "project", label: "Projects" },
  { key: "person", label: "People" },
  { key: "portfolio", label: "Portfolios" },
  { key: "goal", label: "Goals" },
  { key: "more", label: "More" },
];

const TYPE_ICON: Record<GlobalEntityType, typeof CheckSquare> = {
  task: CheckSquare,
  project: FolderKanban,
  person: UserIcon,
  portfolio: Briefcase,
  goal: Target,
  more: MoreHorizontal,
};

const TYPE_COLOR: Record<GlobalEntityType, string> = {
  task: "bg-blue-50 text-blue-600",
  project: "bg-purple-50 text-purple-600",
  person: "bg-green-50 text-green-600",
  portfolio: "bg-orange-50 text-orange-600",
  goal: "bg-teal-50 text-teal-600",
  more: "bg-gray-50 text-gray-600",
};

// -- Recents helpers ----------------------------------------------------------

export function loadRecents(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function saveRecents(items: RecentItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      RECENTS_KEY,
      JSON.stringify(items.slice(0, MAX_RECENTS))
    );
  } catch {
    // ignore
  }
}

export function pushRecent(item: Omit<RecentItem, "at">) {
  const existing = loadRecents();
  const filtered = existing.filter(
    (r) => !(r.type === item.type && r.id === item.id)
  );
  filtered.unshift({ ...item, at: Date.now() });
  saveRecents(filtered);
}

// -- Component ----------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchOverlay({ open, onClose }: Props) {
  const router = useRouter();
  const store = useAppStore();
  const tasks = (store as any).tasks as any[] | undefined;
  const projects = (store as any).projects as any[] | undefined;
  const users = (store as any).users as any[] | undefined;
  const portfoliosExt = (store as any).portfoliosExt as any[] | undefined;
  const goalsExt = (store as any).goalsExt as any[] | undefined;
  const savedSearches = (store as any).savedSearches as any[] | undefined;

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Seed recents with top 5 projects + top 5 tasks if empty.
  useEffect(() => {
    if (!open) return;
    const current = loadRecents();
    if (current.length === 0) {
      const seed: RecentItem[] = [];
      (projects || []).slice(0, 5).forEach((p) =>
        seed.push({ type: "project", id: p.id, title: p.name, at: Date.now() })
      );
      (tasks || []).slice(0, 5).forEach((t) =>
        seed.push({ type: "task", id: t.id, title: t.title, at: Date.now() })
      );
      if (seed.length > 0) {
        saveRecents(seed);
        setRecents(seed);
      } else {
        setRecents([]);
      }
    } else {
      setRecents(current);
    }
  }, [open, projects, tasks]);

  // Focus input when opened, reset state when closed.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery("");
      setTab("all");
      setActiveIdx(0);
    }
  }, [open]);

  // ESC handler
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Build results list based on query + tab
  const results = useMemo<ResultItem[]>(() => {
    if (!open) return [];
    const q = query.trim().toLowerCase();
    const acc: ResultItem[] = [];

    if (tab === "all" || tab === "task") {
      (tasks || []).forEach((t: any) => {
        if (!q || (t.title || "").toLowerCase().includes(q)) {
          acc.push({
            type: "task",
            id: t.id,
            title: t.title,
            subtitle: t.description || undefined,
            href: `/search?q=${encodeURIComponent(t.title || "")}`,
          });
        }
      });
    }
    if (tab === "all" || tab === "project") {
      (projects || []).forEach((p: any) => {
        if (!q || (p.name || "").toLowerCase().includes(q)) {
          acc.push({
            type: "project",
            id: p.id,
            title: p.name,
            subtitle: p.description || undefined,
            href: `/projects/${p.id}/list`,
          });
        }
      });
    }
    if (tab === "all" || tab === "person") {
      (users || []).forEach((u: any) => {
        const name = u.name || "";
        if (
          !q ||
          name.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        ) {
          acc.push({
            type: "person",
            id: u.id,
            title: name,
            subtitle: u.email,
            href: `/search?q=${encodeURIComponent(name)}`,
          });
        }
      });
    }
    if (tab === "all" || tab === "portfolio") {
      (portfoliosExt || []).forEach((p: any) => {
        if (!q || (p.name || "").toLowerCase().includes(q)) {
          acc.push({
            type: "portfolio",
            id: p.id,
            title: p.name,
            subtitle: p.description || undefined,
            href: `/portfolios`,
          });
        }
      });
    }
    if (tab === "all" || tab === "goal") {
      (goalsExt || []).forEach((g: any) => {
        if (!q || (g.name || "").toLowerCase().includes(q)) {
          acc.push({
            type: "goal",
            id: g.id,
            title: g.name,
            subtitle: g.description || undefined,
            href: `/goals`,
          });
        }
      });
    }

    return acc.slice(0, 40);
  }, [open, query, tab, tasks, projects, users, portfoliosExt, goalsExt]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, tab]);

  function openResult(r: ResultItem) {
    pushRecent({ type: r.type, id: r.id, title: r.title });
    router.push(r.href);
    onClose();
  }

  function openRecent(r: RecentItem) {
    const href =
      r.type === "project"
        ? `/projects/${r.id}/list`
        : r.type === "task"
          ? `/search?q=${encodeURIComponent(r.title)}`
          : r.type === "portfolio"
            ? `/portfolios`
            : r.type === "goal"
              ? `/goals`
              : `/search?q=${encodeURIComponent(r.title)}`;
    pushRecent({ type: r.type, id: r.id, title: r.title });
    router.push(href);
    onClose();
  }

  function openSavedSearch(s: {
    id: string;
    name: string;
    query: string;
    filter: string;
  }) {
    const params = new URLSearchParams();
    if (s.query) params.set("q", s.query);
    if (s.filter) params.set("filter", s.filter);
    router.push(`/search${params.toString() ? "?" + params.toString() : ""}`);
    onClose();
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIdx]) {
        openResult(results[activeIdx]);
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  }

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const allSaved = [
    ...PREBUILT_SAVED_SEARCHES,
    ...((savedSearches || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      query: s.query || "",
      filter: s.filters || "",
    })) as typeof PREBUILT_SAVED_SEARCHES),
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mx-auto mt-[6vh] flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-surface-dark">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search tasks, projects, people..."
            className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                tab === t.key
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto">
          {hasQuery ? (
            <div className="p-2">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  No results for &quot;{query}&quot;
                </p>
              ) : (
                <ul>
                  {results.map((r, i) => {
                    const Icon = TYPE_ICON[r.type] || FileText;
                    return (
                      <li key={`${r.type}-${r.id}`}>
                        <button
                          onClick={() => openResult(r)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${
                            i === activeIdx
                              ? "bg-indigo-50 dark:bg-indigo-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TYPE_COLOR[r.type]}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {r.title}
                            </p>
                            {r.subtitle && (
                              <p className="truncate text-xs text-gray-500">
                                {r.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">
                            {r.type}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {/* Recents */}
              <div>
                <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  Recents
                </div>
                {recents.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-gray-400">
                    No recent items yet.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {recents.slice(0, 10).map((r) => {
                      const Icon = TYPE_ICON[r.type] || FileText;
                      return (
                        <li key={`rec-${r.type}-${r.id}`}>
                          <button
                            onClick={() => openRecent(r)}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
                          >
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${TYPE_COLOR[r.type]}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                              {r.title}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Saved searches */}
              <div>
                <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved searches
                </div>
                <ul className="space-y-0.5">
                  {allSaved.map((s) => (
                    <li key={`saved-${s.id}`}>
                      <button
                        onClick={() => openSavedSearch(s)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                          <Bookmark className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                          {s.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-700">
          <span className="mr-3">↑↓ navigate</span>
          <span className="mr-3">↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
