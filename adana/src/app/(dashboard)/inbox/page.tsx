"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Notification, NotificationType } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "demo-user",
    type: "task_assigned",
    title: "New task assigned",
    message: 'Sarah assigned you "Design homepage wireframes"',
    read: false,
    taskId: "t1",
    projectId: "p1",
    actorId: "user-2",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "n2",
    userId: "demo-user",
    type: "comment_added",
    title: "New comment",
    message: 'Alex commented on "API Integration": "Looks good, but we need to handle edge cases."',
    read: false,
    taskId: "t2",
    projectId: "p2",
    actorId: "user-3",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "n3",
    userId: "demo-user",
    type: "task_completed",
    title: "Task completed",
    message: 'Jordan completed "Set up staging environment"',
    read: true,
    taskId: "t3",
    projectId: "p1",
    actorId: "user-4",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "n4",
    userId: "demo-user",
    type: "due_date_approaching",
    title: "Due date approaching",
    message: '"Write API documentation" is due tomorrow',
    read: false,
    taskId: "t3",
    projectId: "p1",
    actorId: null,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "n5",
    userId: "demo-user",
    type: "project_status_update",
    title: "Project update",
    message: 'Taylor updated "Mobile App v2" status to At Risk',
    read: true,
    taskId: null,
    projectId: "p2",
    actorId: "user-5",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: "n6",
    userId: "demo-user",
    type: "mention",
    title: "You were mentioned",
    message: 'Alex mentioned you in "Sprint Planning Notes"',
    read: true,
    taskId: "t4",
    projectId: "p1",
    actorId: "user-3",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "n7",
    userId: "demo-user",
    type: "approval_request",
    title: "Approval requested",
    message: 'Jordan requested your approval on "Deploy to production"',
    read: false,
    taskId: "t5",
    projectId: "p2",
    actorId: "user-4",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

// -- Helpers ------------------------------------------------------------------

const typeIcon: Record<NotificationType, string> = {
  task_assigned: "bg-blue-100 text-blue-600",
  task_completed: "bg-green-100 text-green-600",
  comment_added: "bg-purple-100 text-purple-600",
  due_date_approaching: "bg-orange-100 text-orange-600",
  project_status_update: "bg-indigo-100 text-indigo-600",
  mention: "bg-yellow-100 text-yellow-600",
  approval_request: "bg-pink-100 text-pink-600",
  approval_response: "bg-teal-100 text-teal-600",
};

const typeLabel: Record<NotificationType, string> = {
  task_assigned: "Assigned",
  task_completed: "Completed",
  comment_added: "Comment",
  due_date_approaching: "Due Soon",
  project_status_update: "Status",
  mention: "Mention",
  approval_request: "Approval",
  approval_response: "Approval",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type FilterKey = "all" | NotificationType;

// -- Component ----------------------------------------------------------------

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const { getNotifications } = await import("@/app/actions/notification-actions");
        const fetched = await getNotifications();
        if (fetched?.length) setNotifications(fetched);
      } catch {
        // keep mock data
      }
    }
    load();
  }, []);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "task_assigned", label: "Assigned" },
    { key: "comment_added", label: "Comments" },
    { key: "task_completed", label: "Completed" },
    { key: "due_date_approaching", label: "Due Soon" },
    { key: "mention", label: "Mentions" },
    { key: "approval_request", label: "Approvals" },
  ];

  const visible = notifications.filter((n) => {
    if (!showArchived && archivedIds.has(n.id)) return false;
    if (filter !== "all" && n.type !== filter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read && !archivedIds.has(n.id)).length;

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function archive(id: string) {
    setArchivedIds((prev) => new Set([...prev, id]));
  }

  function getLinkHref(n: Notification) {
    if (n.taskId && n.projectId) return `/projects/${n.projectId}/list`;
    if (n.projectId) return `/projects/${n.projectId}/overview`;
    return "/inbox";
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
            onClick={markAllRead}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Mark all read
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              showArchived
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {showArchived ? "Hide archived" : "Show archived"}
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
            {visible.map((n) => (
              <li
                key={n.id}
                className={`group flex items-start gap-3 px-5 py-4 transition ${
                  !n.read ? "bg-indigo-50/40" : "hover:bg-gray-50"
                } ${archivedIds.has(n.id) ? "opacity-50" : ""}`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${typeIcon[n.type]}`}
                >
                  {typeLabel[n.type][0]}
                </div>

                {/* Content */}
                <Link href={getLinkHref(n)} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
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
                  {!archivedIds.has(n.id) && (
                    <button
                      onClick={() => archive(n.id)}
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
                  )}
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
