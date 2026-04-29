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
  SlidersHorizontal,
  Tag as TagIcon,
  MessageSquare,
  LayoutTemplate,
} from "lucide-react";
import { useAppStore as useDataStore } from "@/store/app-store";

// -- Types --------------------------------------------------------------------

export type SearchEntityType =
  | "task"
  | "project"
  | "person"
  | "portfolio"
  | "goal"
  | "message"
  | "tag"
  | "template";

type CategoryKey = "task" | "project" | "person" | "portfolio" | "goal" | "more";

interface RecentItem {
  type: SearchEntityType;
  id: string;
  title: string;
  at: number;
}

interface ResultItem {
  type: SearchEntityType;
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

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "task", label: "Tasks" },
  { key: "project", label: "Projects" },
  { key: "person", label: "People" },
  { key: "portfolio", label: "Portfolios" },
  { key: "goal", label: "Goals" },
  { key: "more", label: "More" },
];

const MORE_SUBMENU: { key: SearchEntityType; label: string; icon: React.ReactNode }[] = [
  { key: "message", label: "Messages", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: "tag", label: "Tags", icon: <TagIcon className="h-3.5 w-3.5" /> },
  { key: "template", label: "Templates", icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
];

const TYPE_ICON: Record<SearchEntityType, typeof CheckSquare> = {
  task: CheckSquare,
  project: FolderKanban,
  person: UserIcon,
  portfolio: Briefcase,
  goal: Target,
  message: MessageSquare,
  tag: TagIcon,
  template: LayoutTemplate,
};

const TYPE_COLOR: Record<SearchEntityType, string> = {
  task: "bg-blue-50 text-blue-600",
  project: "bg-purple-50 text-purple-600",
  person: "bg-green-50 text-green-600",
  portfolio: "bg-orange-50 text-orange-600",
  goal: "bg-teal-50 text-teal-600",
  message: "bg-sky-50 text-sky-600",
  tag: "bg-pink-50 text-pink-600",
  template: "bg-amber-50 text-amber-600",
};

// -- Recents helpers ----------------------------------------------------------

function loadRecents(): RecentItem[] {
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

function saveRecents(items: RecentItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, MAX_RECENTS)));
  } catch {
    // ignore
  }
}

export function pushSearchRecent(item: Omit<RecentItem, "at">) {
  const existing = loadRecents();
  const filtered = existing.filter((r) => !(r.type === item.type && r.id === item.id));
  filtered.unshift({ ...item, at: Date.now() });
  saveRecents(filtered);
}

// -- Component ----------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenAdvanced: () => void;
  anchorEl?: HTMLElement | null;
}

export function SearchPalette({ open, onClose, onOpenAdvanced }: Props) {
  const router = useRouter();
  const store = useDataStore();
  const tasks = (store as any).tasks as any[] | undefined;
  const projects = (store as any).projects as any[] | undefined;
  const users = (store as any).users as any[] | undefined;
  const portfoliosExt = (store as any).portfoliosExt as any[] | undefined;
  const goalsExt = (store as any).goalsExt as any[] | undefined;
  const savedSearches = (store as any).savedSearches as any[] | undefined;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [moreSub, setMoreSub] = useState<SearchEntityType | null>(null);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setRecents(loadRecents());
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveCategory(null);
      setMoreSub(null);
      setActiveIdx(0);
    }
  }, [open]);

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

  const results = useMemo<ResultItem[]>(() => {
    if (!open) return [];
    const q = query.trim().toLowerCase();
    const acc: ResultItem[] = [];

    const cat = activeCategory;
    const sub = moreSub;

    const includeTask = !cat || cat === "task";
    const includeProject = !cat || cat === "project";
    const includePerson = !cat || cat === "person";
    const includePortfolio = !cat || cat === "portfolio";
    const includeGoal = !cat || cat === "goal";
    const includeMore = !cat || cat === "more";

    if (includeTask) {
      (tasks || []).forEach((t: any) => {
        if (!q || (t.title || "").toLowerCase().includes(q)) {
          acc.push({
            type: "task",
            id: t.id,
            title: t.title,
            subtitle: t.description || undefined,
            href: `/search?q=${encodeURIComponent(t.title || "")}&type=task`,
          });
        }
      });
    }
    if (includeProject) {
      (projects || []).forEach((p: any) => {
        if (!q || (p.name || "").toLowerCase().includes(q)) {
          acc.push({
            type: "project",
            id: p.id,
            title: p.name,
            subtitle: p.description || undefined,
            href: `/project/list?id=${p.id}`,
          });
        }
      });
    }
    if (includePerson) {
      (users || []).forEach((u: any) => {
        const name = u.name || "";
        if (!q || name.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)) {
          acc.push({
            type: "person",
            id: u.id,
            title: name,
            subtitle: u.email,
            href: `/search?q=${encodeURIComponent(name)}&type=person`,
          });
        }
      });
    }
    if (includePortfolio) {
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
    if (includeGoal) {
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
    if (includeMore && (!sub || sub === "tag")) {
      const tags = (store as any).tags as any[] | undefined;
      (tags || []).forEach((t: any) => {
        if (!q || (t.name || "").toLowerCase().includes(q)) {
          acc.push({
            type: "tag",
            id: t.id,
            title: t.name,
            href: `/search?q=${encodeURIComponent(t.name || "")}&type=tag`,
          });
        }
      });
    }

    return acc.slice(0, 50);
  }, [open, query, activeCategory, moreSub, tasks, projects, users, portfoliosExt, goalsExt, store]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, activeCategory, moreSub]);

  function openResult(r: ResultItem) {
    pushSearchRecent({ type: r.type, id: r.id, title: r.title });
    router.push(r.href);
    onClose();
  }

  function openRecent(r: RecentItem) {
    const href =
      r.type === "project"
        ? `/project/list?id=${r.id}`
        : r.type === "task"
          ? `/search?q=${encodeURIComponent(r.title)}&type=task`
          : r.type === "portfolio"
            ? `/portfolios`
            : r.type === "goal"
              ? `/goals`
              : `/search?q=${encodeURIComponent(r.title)}`;
    pushSearchRecent({ type: r.type, id: r.id, title: r.title });
    router.push(href);
    onClose();
  }

  function openSavedSearch(s: { id: string; name: string; query: string; filter: string }) {
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-auto mt-[6vh] flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-surface-dark">
        {/* Search input row */}
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
            onClick={() => {
              onClose();
              onOpenAdvanced();
            }}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
            aria-label="Advanced search"
            title="Advanced search"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveCategory(null);
              setMoreSub(null);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeCategory === null
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setActiveCategory(c.key);
                if (c.key !== "more") setMoreSub(null);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategory === c.key
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* More submenu */}
        {activeCategory === "more" && (
          <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50/50 px-3 py-1.5 dark:border-gray-700 dark:bg-surface-dark-secondary">
            {MORE_SUBMENU.map((s) => (
              <button
                key={s.key}
                onClick={() => setMoreSub(s.key)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  moreSub === s.key
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto">
          {hasQuery || activeCategory ? (
            <div className="p-2">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  {hasQuery ? `No results for "${query}"` : "No items in this category."}
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
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TYPE_COLOR[r.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {r.title}
                            </p>
                            {r.subtitle && (
                              <p className="truncate text-xs text-gray-500">{r.subtitle}</p>
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
                  <p className="px-2 py-4 text-sm text-gray-400">No recent items yet.</p>
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
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${TYPE_COLOR[r.type]}`}>
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
                <ul className="flex flex-wrap gap-1.5 px-2">
                  {allSaved.map((s) => (
                    <li key={`saved-${s.id}`}>
                      <button
                        onClick={() => openSavedSearch(s)}
                        className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-indigo-900/20"
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-700">
          <span className="mr-3">↑↓ navigate</span>
          <span className="mr-3">↵ open</span>
          <span className="mr-3">esc close</span>
          <span>
            <MoreHorizontal className="inline h-3 w-3" /> funnel for advanced filters
          </span>
        </div>
      </div>
    </div>
  );
}
