"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import type { Notification } from "@/types";
import { mockNotifications } from "@/lib/mock-data";

// -- Helpers ------------------------------------------------------------------

function timeAgo(iso: string | Date) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
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

type FilterKey = "all" | string;

// -- Component ----------------------------------------------------------------

export default function InboxPage() {
  const store = useAppStore();
  const { loading, markNotificationRead, markAllNotificationsRead, archiveNotification } = store;
  const getMyNotifications = (store as any).getMyNotifications as undefined | (() => any[]);
  // Prefer DB-backed user-filtered stream; fall back to legacy array.
  const notifications = getMyNotifications ? getMyNotifications() : store.notifications;
  const [filter, setFilter] = useState<FilterKey>("all");

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "assigned", label: "Assigned" },
    { key: "commented", label: "Comments" },
    { key: "completed", label: "Completed" },
    { key: "mentioned", label: "Mentions" },
  ];

  const visible = notifications.filter((n: Notification) => {
    if (n.archived) return false;
    if (filter !== "all" && n.type !== filter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read && !n.archived).length;

  function toggleRead(id: string) {
    const n = notifications.find((notif: Notification) => notif.id === id);
    if (n && !n.read) {
      markNotificationRead(id);
    }
  }

  function getLinkHref(n: Notification) {
    if (n.linkUrl) return n.linkUrl;
    return "/inbox";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Inbox</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filter === f.key
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-900">All caught up!</p>
            <p className="mt-1 text-sm text-gray-500">
              No notifications to show. Check back later.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((n: Notification) => (
              <li
                key={n.id}
                className={`group flex items-start gap-3 px-5 py-4 transition ${
                  !n.read ? "bg-indigo-50/40" : "hover:bg-gray-50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${typeIcon[n.type] || "bg-gray-100 text-gray-600"}`}
                >
                  {(typeLabel[n.type] || n.type)?.[0]?.toUpperCase() || "N"}
                </div>

                {/* Content */}
                <Link href={getLinkHref(n)} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.message && (
                    <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                </Link>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => toggleRead(n.id)}
                    title={n.read ? "Mark unread" : "Mark read"}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill={n.read ? "none" : "currentColor"} stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => archiveNotification(n.id)}
                    title="Archive"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </button>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
