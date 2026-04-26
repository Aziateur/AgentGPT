"use client";

import * as React from "react";
import {
  X,
  ChevronRight,
  Lock,
  Paperclip,
  Slack,
  Eye,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUS_OPTIONS,
  StatusKey,
  getStatusOption,
} from "./status-pill";
import type { Project, ProjectStatusUpdateExt } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDDMMYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

interface StatusPayload {
  title?: string;
  status: string;
  summary?: string;
  nextSteps?: string;
  recipients?: string[];
  isPrivate?: boolean;
  remindWeekly?: boolean;
  ownerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  priority?: string | null;
  dateLabel?: string;
}

export function parseStatusText(text: string | null | undefined): StatusPayload | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as StatusPayload;
  } catch {
    /* not json - fall through */
  }
  return { status: "", summary: text };
}

export function buildStatusText(p: StatusPayload): string {
  return JSON.stringify(p);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StatusUpdateEditorProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  initialStatus?: StatusKey;
  /** When provided, render in read-only mode showing this update. */
  readonlyUpdate?: ProjectStatusUpdateExt | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusUpdateEditor({
  open,
  onClose,
  project,
  initialStatus = "on_track",
  readonlyUpdate = null,
}: StatusUpdateEditorProps) {
  const users = useAppStore((s) => s.users);
  const projectMembers = useAppStore((s) =>
    s.projectMembers.filter((m) => m.projectId === project.id)
  );
  const allTasks = useAppStore((s) =>
    s.tasks.filter((t) => t.projectId === project.id)
  );
  const projectStatusUpdates = useAppStore((s) =>
    s.projectStatusUpdates.filter((u) => u.projectId === project.id)
  );
  const postProjectStatus = useAppStore((s) => s.postProjectStatus);

  const readOnly = !!readonlyUpdate;
  const initial = readonlyUpdate
    ? parseStatusText(readonlyUpdate.text)
    : null;

  const [status, setStatus] = React.useState<StatusKey>(
    (initial?.status as StatusKey) || initialStatus
  );
  const todayLabel = formatDDMMYY(new Date());
  const [title, setTitle] = React.useState<string>(
    initial?.title || `${project.name} - ${todayLabel}`
  );
  const [summary, setSummary] = React.useState<string>(initial?.summary || "");
  const [nextSteps, setNextSteps] = React.useState<string>(
    initial?.nextSteps || ""
  );
  const [isPrivate, setIsPrivate] = React.useState<boolean>(
    !!initial?.isPrivate
  );
  const [remindWeekly, setRemindWeekly] = React.useState<boolean>(
    !!initial?.remindWeekly
  );
  const [ownerId, setOwnerId] = React.useState<string | null>(
    initial?.ownerId ?? project.creatorId ?? null
  );
  const [recipients, setRecipients] = React.useState<string[]>(
    initial?.recipients ?? projectMembers.map((m) => m.userId)
  );
  const [startDate, setStartDate] = React.useState<string>(
    initial?.startDate || ""
  );
  const [endDate, setEndDate] = React.useState<string>(initial?.endDate || "");
  const [priority, setPriority] = React.useState<string>(
    initial?.priority || "medium"
  );

  const [activeTab, setActiveTab] = React.useState<
    "previous" | "highlights" | "drafts"
  >("highlights");
  const [timeframeWeeks, setTimeframeWeeks] = React.useState<number>(2);
  const [posting, setPosting] = React.useState(false);

  // Visible-fields toggle
  const [showFields, setShowFields] = React.useState({
    owner: true,
    dates: true,
    priority: true,
    drafts: true,
    channel: true,
  });

  // Reset whenever opened anew with a different project / readonly
  React.useEffect(() => {
    if (!open) return;
    if (readonlyUpdate) {
      const p = parseStatusText(readonlyUpdate.text);
      setStatus((p?.status as StatusKey) || initialStatus);
      setTitle(p?.title || `${project.name} - ${todayLabel}`);
      setSummary(p?.summary || readonlyUpdate.text || "");
      setNextSteps(p?.nextSteps || "");
      setIsPrivate(!!p?.isPrivate);
      setRemindWeekly(!!p?.remindWeekly);
      setOwnerId(p?.ownerId ?? project.creatorId ?? null);
      setRecipients(p?.recipients ?? []);
      setStartDate(p?.startDate || "");
      setEndDate(p?.endDate || "");
      setPriority(p?.priority || "medium");
    } else {
      setStatus(initialStatus);
      setTitle(`${project.name} - ${todayLabel}`);
      setSummary("");
      setNextSteps("");
      setIsPrivate(false);
      setRemindWeekly(false);
      setOwnerId(project.creatorId ?? null);
      setRecipients(projectMembers.map((m) => m.userId));
      setStartDate("");
      setEndDate("");
      setPriority("medium");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, readonlyUpdate?.id, initialStatus, project.id]);

  // Highlights metrics (computed within timeframe)
  const cutoff = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - timeframeWeeks * 7);
    return d;
  }, [timeframeWeeks]);

  const milestonesCompleted = React.useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.taskType === "milestone" &&
          t.completed &&
          t.completedAt &&
          new Date(t.completedAt) >= cutoff
      ).length,
    [allTasks, cutoff]
  );
  const tasksCompleted = React.useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.completed && t.completedAt && new Date(t.completedAt) >= cutoff
      ).length,
    [allTasks, cutoff]
  );
  const approvalsCompleted = React.useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.taskType === "approval" &&
          t.completed &&
          t.completedAt &&
          new Date(t.completedAt) >= cutoff
      ).length,
    [allTasks, cutoff]
  );

  const incompleteByAssignee = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allTasks) {
      if (t.completed) continue;
      const aid = t.assigneeId || "unassigned";
      counts.set(aid, (counts.get(aid) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([aid, count]) => ({
      name:
        aid === "unassigned"
          ? "Unassigned"
          : users.find((u) => u.id === aid)?.name?.split(" ")[0] ?? "?",
      count,
    }));
  }, [allTasks, users]);

  const previousUpdate = React.useMemo(() => {
    const list = projectStatusUpdates
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return readonlyUpdate
      ? list.find((u) => u.id !== readonlyUpdate.id) ?? null
      : list[0] ?? null;
  }, [projectStatusUpdates, readonlyUpdate]);

  const drafts = React.useMemo(() => {
    // We don't have a real "drafts" column; show updates flagged via JSON as drafts.
    return projectStatusUpdates
      .map((u) => ({
        u,
        p: parseStatusText(u.text),
      }))
      .filter((x) => (x.p as any)?.draft === true);
  }, [projectStatusUpdates]);

  const ownerUser = ownerId ? users.find((u) => u.id === ownerId) : null;

  async function handlePost() {
    if (readOnly) return;
    setPosting(true);
    try {
      const payload: StatusPayload = {
        title,
        status,
        summary,
        nextSteps,
        recipients,
        isPrivate,
        remindWeekly,
        ownerId,
        startDate: startDate || null,
        endDate: endDate || null,
        priority,
        dateLabel: todayLabel,
      };
      await postProjectStatus(project.id, status, buildStatusText(payload));
      onClose();
    } finally {
      setPosting(false);
    }
  }

  if (!open) return null;

  const statusOpt = getStatusOption(status);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-white"
      role="dialog"
      aria-label="Project status update"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">{project.name}</span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-600">Status update</span>
          {readOnly && (
            <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
              Read-only
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={remindWeekly}
                  onChange={(e) => setRemindWeekly(e.target.checked)}
                />
                Remind me to update every Friday
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <Lock className="h-3 w-3" />
                Private
              </label>
              <span className="text-xs text-gray-500">
                {recipients.length} {recipients.length === 1 ? "person" : "people"} will be notified
              </span>
              <button
                type="button"
                onClick={() => {
                  // Cycle through adding all members not yet recipients
                  const all = projectMembers.map((m) => m.userId);
                  setRecipients(Array.from(new Set([...recipients, ...all])));
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                + Add recipients
              </button>
              <Button onClick={handlePost} loading={posting}>
                Post
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left form */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-8 py-6">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
              className="w-full border-none bg-transparent text-2xl font-bold text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-100"
              placeholder="Status update title"
            />

            {/* Field row */}
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status<span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusKey)}
                  disabled={readOnly}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {statusOpt && (
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      statusOpt.pillClass
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusOpt.dotClass)} />
                    {statusOpt.label}
                  </span>
                )}
              </div>

              {showFields.drafts && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Draft collaborators
                  </label>
                  <div className="flex h-9 items-center gap-1">
                    <div className="flex -space-x-2">
                      {projectMembers.slice(0, 3).map((m) => {
                        const u = users.find((x) => x.id === m.userId);
                        return (
                          <div
                            key={m.userId}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                            title={u?.name}
                          >
                            {u?.name?.[0] ?? "?"}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={readOnly}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {showFields.owner && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Owner
                  </label>
                  <select
                    value={ownerId ?? ""}
                    onChange={(e) => setOwnerId(e.target.value || null)}
                    disabled={readOnly}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {ownerUser && (
                    <span className="mt-1 inline-block text-[11px] text-gray-500">
                      {ownerUser.email}
                    </span>
                  )}
                </div>
              )}

              {showFields.dates && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Dates
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={startDate ? startDate.slice(0, 10) : ""}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={readOnly}
                      className="h-9 flex-1 rounded-lg border border-gray-300 bg-white px-2 text-xs"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      value={endDate ? endDate.slice(0, 10) : ""}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={readOnly}
                      className="h-9 flex-1 rounded-lg border border-gray-300 bg-white px-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {showFields.priority && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={readOnly}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              )}

              {showFields.channel && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Connected channel
                  </label>
                  <button
                    type="button"
                    disabled
                    title="Sync integration coming soon"
                    className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 text-xs text-gray-500"
                  >
                    <Slack className="h-3.5 w-3.5" />
                    Slack (coming soon)
                  </button>
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="mt-4 flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  // Cycle through hide/show fields toggle (simple toggle for first one)
                  setShowFields((prev) => ({
                    ...prev,
                    channel: !prev.channel,
                  }));
                }}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:bg-gray-50"
              >
                <Eye className="h-3.5 w-3.5" />
                Show or hide fields
              </button>
              <button
                type="button"
                disabled={readOnly}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Add attachment
              </button>
            </div>

            {/* Body */}
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  Summary
                </h3>
                <p className="mb-2 text-xs text-gray-500">
                  How&apos;s this project going?
                </p>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={readOnly}
                  rows={6}
                  placeholder="Share progress, blockers, and any context for your team."
                  className="w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  Next steps
                </h3>
                <p className="mb-2 text-xs text-gray-500">
                  What&apos;s next for the team?
                </p>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  disabled={readOnly}
                  rows={4}
                  placeholder="List the top priorities and milestones for the coming weeks."
                  className="w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-[360px] flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50">
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Build your update
            </h3>
            <p className="text-xs text-gray-500">
              Pull metrics, drafts and the previous status into the editor.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {(["previous", "highlights", "drafts"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={cn(
                  "flex-1 border-b-2 px-3 py-2 text-xs font-medium capitalize transition",
                  activeTab === t
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {t === "previous" ? "Previous update" : t}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-4">
            {activeTab === "previous" && (
              <div>
                {previousUpdate ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(previousUpdate.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-900">
                      {parseStatusText(previousUpdate.text)?.title ?? "Previous update"}
                    </div>
                    <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-xs text-gray-600">
                      {parseStatusText(previousUpdate.text)?.summary ??
                        previousUpdate.text ??
                        "—"}
                    </p>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const p = parseStatusText(previousUpdate.text);
                          if (p?.summary) setSummary(p.summary);
                        }}
                        className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Use as starting point
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No previous update.</p>
                )}
              </div>
            )}

            {activeTab === "highlights" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Highlights
                  </span>
                  <select
                    value={timeframeWeeks}
                    onChange={(e) =>
                      setTimeframeWeeks(parseInt(e.target.value, 10))
                    }
                    className="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs"
                  >
                    <option value={1}>1 week</option>
                    <option value={2}>2 weeks</option>
                    <option value={4}>4 weeks</option>
                    <option value={12}>12 weeks</option>
                  </select>
                </div>
                <ul className="space-y-2">
                  <Highlight label="milestones completed" value={milestonesCompleted} />
                  <Highlight label="tasks completed" value={tasksCompleted} />
                  <Highlight label="approvals completed" value={approvalsCompleted} />
                </ul>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Incomplete tasks by assignee
                  </div>
                  {incompleteByAssignee.length === 0 ? (
                    <p className="text-xs text-gray-400">No open tasks.</p>
                  ) : (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incompleteByAssignee}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <RTooltip cursor={{ fill: "#eef2ff" }} />
                          <Bar
                            dataKey="count"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "drafts" && (
              <div>
                {drafts.length === 0 ? (
                  <p className="text-xs text-gray-400">No drafts saved.</p>
                ) : (
                  <ul className="space-y-2">
                    {drafts.map(({ u, p }) => (
                      <li
                        key={u.id}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="text-xs font-medium text-gray-900">
                          {(p as any)?.title ?? "Draft"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {new Date(u.createdAt).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Highlight({ value, label }: { value: number; label: string }) {
  return (
    <li className="flex items-baseline gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </li>
  );
}

export default StatusUpdateEditor;
