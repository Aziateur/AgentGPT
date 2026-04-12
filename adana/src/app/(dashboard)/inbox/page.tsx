"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Archive,
  Bookmark,
  BookmarkCheck,
  Circle,
  LayoutGrid,
  List as ListIcon,
  Plus,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

// -- Helpers ------------------------------------------------------------------

function timeAgo(iso: string | Date) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const typeIcon: Record<string, string> = {
  task_assigned: "bg-blue-100 text-blue-600",
  assigned: "bg-blue-100 text-blue-600",
  task_completed: "bg-green-100 text-green-600",
  completed: "bg-green-100 text-green-600",
  comment_added: "bg-purple-100 text-purple-600",
  commented: "bg-purple-100 text-purple-600",
  due_date_approaching: "bg-orange-100 text-orange-600",
  project_status_update: "bg-indigo-100 text-indigo-600",
  mention: "bg-yellow-100 text-yellow-600",
  mentioned: "bg-yellow-100 text-yellow-600",
  approval_request: "bg-pink-100 text-pink-600",
  approval_response: "bg-teal-100 text-teal-600",
  dependency_resolved: "bg-green-100 text-green-600",
};

const typeLabel: Record<string, string> = {
  task_assigned: "Assigned",
  assigned: "Assigned",
  task_completed: "Completed",
  completed: "Completed",
  comment_added: "Comment",
  commented: "Comment",
  due_date_approaching: "Due Soon",
  project_status_update: "Status",
  mention: "Mention",
  mentioned: "Mention",
  approval_request: "Approval",
  approval_response: "Approval",
  dependency_resolved: "Resolved",
};

const BOOKMARKS_KEY = "adana:notification-bookmarks";

function loadBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveBookmarks(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

type TabKey = "activity" | "bookmarks" | "archive";
type SortDir = "newest" | "oldest";
type ViewMode = "list" | "card";

// -- Component ----------------------------------------------------------------

export default function InboxPage() {
  const store = useAppStore();
  const { loading, markNotificationRead, markAllNotificationsRead, archiveNotification } = store;
  const getMyNotifications = (store as any).getMyNotifications as undefined | (() => any[]);
  const notifications = getMyNotifications ? getMyNotifications() : store.notifications;

  const [tab, setTab] = useState<TabKey>("activity");
  const [sortDir, setSortDir] = useState<SortDir>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [plusTooltip, setPlusTooltip] = useState(false);

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveBookmarks(next);
      return next;
    });
  }

  const visible = useMemo(() => {
    const list = (notifications as any[]).filter((n) => {
      if (tab === "archive") return n.archived;
      if (tab === "bookmarks") return bookmarks.has(n.id) && !n.archived;
      return !n.archived;
    });
    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortDir === "newest" ? db - da : da - db;
    });
    return list;
  }, [notifications, tab, sortDir, bookmarks]);

  const unreadCount = (notifications as any[]).filter((n) => !n.read && !n.archived).length;

  function toggleRead(id: string) {
    const n = (notifications as any[]).find((notif) => notif.id === id);
    if (n && !n.read) markNotificationRead(id);
  }

  function getLinkHref(n: any) {
    if (n.linkUrl) return n.linkUrl;
    return "/inbox";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <div className="mt-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "activity", label: "Activity" },
    { key: "bookmarks", label: "Bookmarks" },
    { key: "archive", label: "Archive" },
  ];

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsRead}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Tabs + controls */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setPlusTooltip(true)}
            onMouseLeave={() => setPlusTooltip(false)}
          >
            <button
              disabled
              aria-label="Add custom inbox"
              className="-mb-px ml-1 flex h-8 w-8 cursor-not-allowed items-center justify-center rounded text-gray-400"
            >
              <Plus className="h-4 w-4" />
            </button>
            {plusTooltip && (
              <div className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow">
                Custom inboxes coming soon
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2">
          {/* Sort arrows */}
          <button
            onClick={() => setSortDir((d) => (d === "newest" ? "oldest" : "newest"))}
            title={sortDir === "newest" ? "Newest first" : "Oldest first"}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {sortDir === "newest" ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {sortDir === "newest" ? "Newest" : "Oldest"}
            </span>
            <ArrowDownUp className="h-3 w-3 text-gray-400" />
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={`flex h-6 w-6 items-center justify-center rounded ${
                viewMode === "list" ? "bg-indigo-100 text-indigo-700" : "text-gray-500"
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              title="Card view"
              className={`flex h-6 w-6 items-center justify-center rounded ${
                viewMode === "card" ? "bg-indigo-100 text-indigo-700" : "text-gray-500"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mb-3 text-5xl">🎉</div>
          <p className="text-base font-medium text-gray-900">
            Hooray, you&apos;re up to date.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {visible.map((n: any) => {
              const isBookmarked = bookmarks.has(n.id);
              return (
                <li
                  key={n.id}
                  className={`group flex items-start gap-3 px-5 py-3 transition ${
                    !n.read ? "bg-indigo-50/40" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      typeIcon[n.type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {(typeLabel[n.type] || n.type)?.[0]?.toUpperCase() || "N"}
                  </div>

                  <Link href={getLinkHref(n)} className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {n.message && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </Link>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleBookmark(n.id)}
                      title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                      className={`rounded p-1 transition ${
                        isBookmarked
                          ? "text-yellow-500"
                          : "text-gray-300 opacity-0 hover:text-gray-600 group-hover:opacity-100"
                      }`}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleRead(n.id)}
                      title={n.read ? "Read" : "Mark as read"}
                      className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                    >
                      <Circle
                        className="h-4 w-4"
                        fill={n.read ? "none" : "currentColor"}
                      />
                    </button>
                    <button
                      onClick={() => archiveNotification(n.id)}
                      title="Archive"
                      className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>

                  {!n.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((n: any) => {
            const isBookmarked = bookmarks.has(n.id);
            const actorInitial =
              (typeLabel[n.type] || n.type || "N")?.[0]?.toUpperCase() || "N";
            return (
              <div
                key={n.id}
                className={`group flex flex-col gap-2 rounded-xl border p-4 shadow-sm transition ${
                  !n.read
                    ? "border-indigo-200 bg-indigo-50/40"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      typeIcon[n.type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {actorInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={getLinkHref(n)}>
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {n.title}
                      </p>
                    </Link>
                    <p className="mt-1 text-xs text-gray-400">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBookmark(n.id)}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                    className={`rounded p-1 transition ${
                      isBookmarked
                        ? "text-yellow-500"
                        : "text-gray-300 hover:text-gray-600"
                    }`}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {n.message && (
                  <p className="line-clamp-3 text-sm text-gray-600">{n.message}</p>
                )}
                <div className="mt-auto flex items-center justify-end gap-1">
                  <button
                    onClick={() => toggleRead(n.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title={n.read ? "Read" : "Mark as read"}
                  >
                    <Circle
                      className="h-4 w-4"
                      fill={n.read ? "none" : "currentColor"}
                    />
                  </button>
                  <button
                    onClick={() => archiveNotification(n.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
