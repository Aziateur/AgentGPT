"use client";

import React, { useState } from "react";
import {
  format,
  formatDistanceToNow,
} from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Target,
  Users,
  Calendar,
  TrendingUp,
  FileText,
  MessageSquare,
  Activity,
  LinkIcon,
  BarChart3,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import type {
  Project,
  ProjectStatusType,
  User,
  Goal,
  Form,
  Task,
} from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusUpdate {
  id: string;
  status: ProjectStatusType;
  text: string;
  authorId: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface ProjectOverviewProps {
  project?: Project;
  members?: User[];
  tasks?: Task[];
  goals?: Goal[];
  forms?: Form[];
  statusUpdates?: StatusUpdate[];
  activities?: ActivityItem[];
  onUpdateStatus?: () => void;
  onInviteMembers?: () => void;
  onEditProject?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", avatarUrl: null, bio: null, role: "owner", teamIds: ["t1"], createdAt: "", updatedAt: "" },
  { id: "u2", name: "Bob Park", email: "bob@example.com", avatarUrl: null, bio: null, role: "member", teamIds: ["t1"], createdAt: "", updatedAt: "" },
  { id: "u3", name: "Carol Smith", email: "carol@example.com", avatarUrl: null, bio: null, role: "member", teamIds: ["t1"], createdAt: "", updatedAt: "" },
  { id: "u4", name: "David Lee", email: "david@example.com", avatarUrl: null, bio: null, role: "member", teamIds: ["t1"], createdAt: "", updatedAt: "" },
];

const MOCK_PROJECT: Project = {
  id: "p1",
  name: "Website Redesign",
  description: "Complete overhaul of the company website with modern design, improved performance, and better user experience. This project includes front-end development, back-end API updates, and content migration.",
  color: "#6366f1",
  icon: null,
  ownerId: "u1",
  teamId: "t1",
  privacy: "public",
  defaultView: "board",
  status: "on_track",
  statusText: "Development is progressing well. Frontend is 70% complete and backend API is ready for integration.",
  startDate: "2026-03-01",
  dueDate: "2026-05-15",
  archived: false,
  memberIds: ["u1", "u2", "u3", "u4"],
  sectionIds: ["s1", "s2", "s3"],
  createdAt: "2026-02-20T10:00:00Z",
  updatedAt: "2026-04-02T14:30:00Z",
};

const MOCK_STATUS_UPDATES: StatusUpdate[] = [
  { id: "su1", status: "on_track", text: "Development is progressing well. Frontend is 70% complete and backend API is ready for integration.", authorId: "u1", createdAt: "2026-04-02T14:30:00Z" },
  { id: "su2", status: "on_track", text: "Sprint 3 completed on schedule. Authentication module shipped.", authorId: "u1", createdAt: "2026-03-25T10:00:00Z" },
  { id: "su3", status: "at_risk", text: "Design revisions needed based on stakeholder feedback. May push timeline by 3 days.", authorId: "u2", createdAt: "2026-03-18T16:00:00Z" },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: "a1", userId: "u2", action: "completed", target: "Implement auth flow", createdAt: "2026-04-02T16:20:00Z" },
  { id: "a2", userId: "u1", action: "added", target: "Design system tokens", createdAt: "2026-04-02T14:00:00Z" },
  { id: "a3", userId: "u3", action: "commented on", target: "Fix navigation bug", createdAt: "2026-04-02T11:30:00Z" },
  { id: "a4", userId: "u4", action: "completed", target: "Database schema v2", createdAt: "2026-04-01T17:45:00Z" },
  { id: "a5", userId: "u1", action: "updated status of", target: "Website Redesign", createdAt: "2026-04-01T10:00:00Z" },
];

const MOCK_GOALS: Goal[] = [
  { id: "g1", name: "Increase conversion rate by 20%", description: null, ownerId: "u1", teamId: "t1", status: "on_track", timeframe: "q2", year: 2026, startDate: null, dueDate: null, currentValue: 12, targetValue: 20, unit: "%", parentGoalId: null, subGoalIds: [], supportingProjectIds: ["p1"], supportingTaskIds: [], likes: 0, createdAt: "", updatedAt: "" },
  { id: "g2", name: "Launch new website by Q2", description: null, ownerId: "u1", teamId: "t1", status: "on_track", timeframe: "q2", year: 2026, startDate: null, dueDate: null, currentValue: 65, targetValue: 100, unit: "%", parentGoalId: null, subGoalIds: [], supportingProjectIds: ["p1"], supportingTaskIds: [], likes: 0, createdAt: "", updatedAt: "" },
];

const MOCK_FORMS: Form[] = [
  { id: "f1", name: "Bug Report Form", description: "Submit bugs found during testing", projectId: "p1", fields: [], active: true, createdById: "u1", submissionCount: 12, createdAt: "", updatedAt: "" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<ProjectStatusType, { label: string; color: string; icon: React.ElementType; badgeVariant: "success" | "warning" | "high" | "default" | "info" }> = {
  on_track: { label: "On track", color: "text-green-600", icon: CheckCircle2, badgeVariant: "success" },
  at_risk: { label: "At risk", color: "text-yellow-600", icon: AlertTriangle, badgeVariant: "warning" },
  off_track: { label: "Off track", color: "text-red-600", icon: XCircle, badgeVariant: "high" },
  on_hold: { label: "On hold", color: "text-gray-500", icon: Clock, badgeVariant: "default" },
  complete: { label: "Complete", color: "text-indigo-600", icon: CheckCircle2, badgeVariant: "info" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectOverview({
  project: projectProp,
  members: membersProp,
  tasks: tasksProp,
  goals: goalsProp,
  forms: formsProp,
  statusUpdates: statusUpdatesProp,
  activities: activitiesProp,
  onUpdateStatus,
  onInviteMembers,
  onEditProject,
  className,
}: ProjectOverviewProps) {
  const project = projectProp ?? MOCK_PROJECT;
  const members = membersProp ?? MOCK_USERS;
  const statusUpdates = statusUpdatesProp ?? MOCK_STATUS_UPDATES;
  const activities = activitiesProp ?? MOCK_ACTIVITIES;
  const goals = goalsProp ?? MOCK_GOALS;
  const forms = formsProp ?? MOCK_FORMS;

  // Mock task stats
  const totalTasks = tasksProp?.length ?? 24;
  const completedTasks = tasksProp?.filter((t) => t.completed).length ?? 16;
  const overdueTasks = tasksProp?.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length ?? 2;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusCfg = STATUS_CONFIG[project.status];
  const StatusIcon = statusCfg.icon;

  const usersMap: Record<string, User> = {};
  for (const u of members) usersMap[u.id] = u;

  return (
    <div className={cn("mx-auto max-w-4xl space-y-8 p-6", className)}>
      {/* Project header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onEditProject}>
            Edit
          </Button>
        </div>
      </div>

      {/* Status section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <StatusIcon className={cn("h-5 w-5", statusCfg.color)} />
            Project status
          </h2>
          <Button variant="primary" size="sm" onClick={onUpdateStatus}>
            Update status
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <Badge variant={statusCfg.badgeVariant}>{statusCfg.label}</Badge>
          {project.statusText && (
            <span className="text-sm text-gray-600">{project.statusText}</span>
          )}
        </div>

        {/* Recent status updates */}
        {statusUpdates.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent updates</h3>
            {statusUpdates.slice(0, 3).map((update) => {
              const author = usersMap[update.authorId];
              const cfg = STATUS_CONFIG[update.status];
              return (
                <div key={update.id} className="flex gap-3 text-sm">
                  <Avatar size="xs" name={author?.name ?? "?"} src={author?.avatarUrl ?? undefined} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{author?.name}</span>
                      <Badge variant={cfg.badgeVariant} className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-gray-600">{update.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Stats + Key dates row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Project stats */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            Stats
          </h2>
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium text-gray-900">{completionPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total</div>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
                <div className="text-xs text-gray-500 mt-0.5">Done</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
                <div className="text-xs text-gray-500 mt-0.5">Overdue</div>
              </div>
            </div>
          </div>
        </section>

        {/* Key dates */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            Key dates
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Start date</span>
              <span className="font-medium text-gray-900">
                {project.startDate ? format(new Date(project.startDate), "MMM d, yyyy") : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Due date</span>
              <span className="font-medium text-gray-900">
                {project.dueDate ? format(new Date(project.dueDate), "MMM d, yyyy") : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Created</span>
              <span className="font-medium text-gray-900">
                {format(new Date(project.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last updated</span>
              <span className="font-medium text-gray-900">
                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Members */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            Members
            <span className="text-sm font-normal text-gray-400">({members.length})</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={onInviteMembers}>
            <Plus className="h-4 w-4 mr-1" />
            Invite
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {members.map((member) => (
            <Tooltip key={member.id} content={`${member.name} (${member.role})`}>
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <Avatar size="sm" name={member.name} src={member.avatarUrl ?? undefined} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                  <div className="text-xs text-gray-500 truncate">{member.email}</div>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </section>

      {/* Linked goals */}
      {goals.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gray-400" />
            Linked goals
          </h2>
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = goal.targetValue > 0
                ? Math.round((goal.currentValue / goal.targetValue) * 100)
                : 0;
              return (
                <div key={goal.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{goal.name}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{progress}%</span>
                    </div>
                  </div>
                  <Badge variant={goal.status === "on_track" ? "success" : goal.status === "at_risk" ? "warning" : "default"}>
                    {goal.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Custom fields summary + Forms row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Custom fields summary */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            Custom fields
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Sprint</span>
              <Badge>Sprint 4</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Priority</span>
              <Badge variant="high">High</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Budget</span>
              <span className="font-medium text-gray-900">$45,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Team Lead</span>
              <div className="flex items-center gap-1.5">
                <Avatar size="xs" name="Alice Chen" />
                <span className="font-medium text-gray-900">Alice Chen</span>
              </div>
            </div>
          </div>
        </section>

        {/* Linked forms */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-400" />
            Forms
          </h2>
          {forms.length > 0 ? (
            <div className="space-y-2">
              {forms.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.name}</div>
                    {f.description && <div className="text-xs text-gray-500 mt-0.5">{f.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.active ? "success" : "default"}>
                      {f.active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-gray-400">{f.submissionCount} submissions</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No forms linked to this project.</p>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-400" />
          Recent activity
        </h2>
        <div className="space-y-3">
          {activities.map((item) => {
            const user = usersMap[item.userId];
            return (
              <div key={item.id} className="flex items-start gap-3">
                <Avatar size="xs" name={user?.name ?? "?"} src={user?.avatarUrl ?? undefined} />
                <div className="min-w-0 text-sm">
                  <span className="font-medium text-gray-900">{user?.name}</span>{" "}
                  <span className="text-gray-500">{item.action}</span>{" "}
                  <span className="font-medium text-gray-700">{item.target}</span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
