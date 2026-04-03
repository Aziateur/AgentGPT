"use client";

import { useState } from "react";
import {
  CheckCircle2,
  MessageSquare,
  UserPlus,
  Clock,
  AlertCircle,
  AtSign,
  ThumbsUp,
  TrendingUp,
  Archive,
  MailOpen,
  Mail,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockNotifications: Notification[] = [
  {
    id: "n1", userId: "demo-user", recipientId: "demo-user", type: "task_assigned",
    title: "New task assigned", message: 'Sarah assigned you "Design homepage wireframes"',
    read: false, taskId: "t1", projectId: "p1", actorId: "user-2", targetUrl: null,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "n2", userId: "demo-user", recipientId: "demo-user", type: "comment_added",
    title: "New comment", message: 'Alex commented on "API Integration": "Looks good, but we need to handle edge cases."',
    read: false, taskId: "t2", projectId: "p2", actorId: "user-3", targetUrl: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "n3", userId: "demo-user", recipientId: "demo-user", type: "task_completed",
    title: "Task completed", message: 'Jordan completed "Set up staging environment"',
    read: true, taskId: "t3", projectId: "p1", actorId: "user-4", targetUrl: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "n4", userId: "demo-user", recipientId: "demo-user", type: "due_date_approaching",
    title: "Due date approaching", message: '"Write API documentation" is due tomorrow',
    read: false, taskId: "t3", projectId: "p1", actorId: null, targetUrl: null,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "n5", userId: "demo-user", recipientId: "demo-user", type: "mention",
    title: "You were mentioned", message: 'Alex mentioned you in "Sprint Planning Notes"',
    read: true, taskId: "t4", projectId: "p1", actorId: "user-3", targetUrl: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "n6", userId: "demo-user", recipientId: "demo-user", type: "approval_request",
    title: "Approval requested", message: 'Jordan requested your approval on "Deploy to production"',
    read: false, taskId: "t5", projectId: "p2", actorId: "user-4", targetUrl: null,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

// -- Helpers ------------------------------------------------------------------

const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  task_assigned: { icon: UserPlus, color: "bg-blue-100 text-blue-600" },
  task_completed: { icon: CheckCircle2, color: "bg-green-100 text-green-600" },
  comment_added: { icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
  due_date_approaching: { icon: Clock, color: "bg-orange-100 text-orange-600" },
  task_due_soon: { icon: Clock, color: "bg-orange-100 text-orange-600" },
  task_overdue: { icon: AlertCircle, color: "bg-red-100 text-red-600" },
  project_status_update: { icon: TrendingUp, color: "bg-indigo-100 text-indigo-600" },
  mention: { icon: AtSign, color: "bg-yellow-100 text-yellow-600" },
  approval_request: { icon: ThumbsUp, color: "bg-pink-100 text-pink-600" },
  approval_response: { icon: ThumbsUp, color: "bg-teal-100 text-teal-600" },
  task_comment: { icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
  team_invite: { icon: UserPlus, color: "bg-blue-100 text-blue-600" },
  goal_update: { icon: TrendingUp, color: "bg-green-100 text-green-600" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, Notification[]> = {};

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) {
      label = "Today";
    } else if (d.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// -- Props --------------------------------------------------------------------

export interface NotificationListProps {
  className?: string;
}

// -- Component ----------------------------------------------------------------

export function NotificationList({ className }: NotificationListProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const visible = notifications.filter((n) => !archivedIds.has(n.id));
  const groups = groupByDate(visible);

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  function archive(id: string) {
    setArchivedIds((prev) => new Set([...prev, id]));
  }

  if (visible.length === 0) {
    return (
      <div className={`px-6 py-16 text-center ${className || ""}`}>
        <Archive className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-900">All caught up!</p>
        <p className="mt-1 text-sm text-gray-500">No new notifications.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {groups.map((group) => (
        <div key={group.label}>
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-2">
            <span className="text-xs font-semibold text-gray-500">{group.label}</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {group.items.map((n) => {
              const config = typeConfig[n.type] || { icon: AlertCircle, color: "bg-gray-100 text-gray-600" };
              const Icon = config.icon;
              return (
                <li
                  key={n.id}
                  className={`group flex items-start gap-3 px-5 py-3 transition ${
                    !n.read ? "bg-indigo-50/30" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => toggleRead(n.id)}
                      title={n.read ? "Mark unread" : "Mark read"}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      {n.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => archive(n.id)}
                      title="Archive"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Archive className="h-3.5 w-3.5" />
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
      ))}
    </div>
  );
}
