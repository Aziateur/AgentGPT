"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAppStore } from "@/store/app-store";
import { smartSummary } from "@/lib/ai/features";
import { getDefaultProvider } from "@/lib/ai/settings";
import { SmartChat } from "@/components/ai/smart-chat";
import type { Task, User, Project } from "@/types";

type TabKey = "list" | "timeline" | "dashboard" | "progress" | "workload";

const TABS: { key: TabKey; label: string }[] = [
  { key: "list", label: "List" },
  { key: "timeline", label: "Timeline" },
  { key: "dashboard", label: "Dashboard" },
  { key: "progress", label: "Progress" },
  { key: "workload", label: "Workload" },
];

const STATUS_COLORS: Record<string, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function useQueryId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setId(params.get("id"));
  }, []);
  return id;
}

export default function PortfolioDetailPage() {
  const portfolioId = useQueryId();
  const store = useAppStore();
  const { projects, tasks, users } = store;
  const portfoliosExt: any[] = (store as any).portfoliosExt ?? [];
  const portfolioProjects: any[] = (store as any).portfolioProjects ?? [];
  const projectStatusUpdates: any[] = (store as any).projectStatusUpdates ?? [];
  const postProjectStatus = (store as any).postProjectStatus as (
    projectId: string,
    status: string,
    text?: string
  ) => Promise<void>;

  const [tab, setTab] = useState<TabKey>("list");

  const portfolio = useMemo(
    () => portfoliosExt.find((p) => p.id === portfolioId) ?? null,
    [portfoliosExt, portfolioId]
  );

  const linkedProjectIds = useMemo(() => {
    if (!portfolio) return [] as string[];
    return portfolioProjects
      .filter((pp) => pp.portfolioId === portfolio.id)
      .map((pp) => pp.projectId);
  }, [portfolio, portfolioProjects]);

  const linkedProjects = useMemo<Project[]>(
    () => projects.filter((p) => linkedProjectIds.includes(p.id)),
    [projects, linkedProjectIds]
  );

  const portfolioTasks = useMemo<Task[]>(
    () => tasks.filter((t) => linkedProjectIds.includes(t.projectId as string)),
    [tasks, linkedProjectIds]
  );

  if (!portfolioId) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-gray-500">Loading portfolio…</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-xl font-bold text-gray-900">Portfolio not found</h1>
        <Link href="/portfolios" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          ← Back to portfolios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/portfolios" className="text-xs text-gray-500 hover:text-gray-700">
          ← Portfolios
        </Link>
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-5 w-5 rounded" style={{ backgroundColor: portfolio.color }} />
        <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
        <span className="text-sm text-gray-500">
          • {linkedProjects.length} project{linkedProjects.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "list" && <ListTab projects={linkedProjects} tasks={tasks} />}
      {tab === "timeline" && <TimelineTab projects={linkedProjects} />}
      {tab === "dashboard" && (
        <DashboardTab projects={linkedProjects} tasks={portfolioTasks} users={users} />
      )}
      {tab === "progress" && (
        <ProgressTab
          projects={linkedProjects}
          portfolioTasks={portfolioTasks}
          statusUpdates={projectStatusUpdates}
          postProjectStatus={postProjectStatus}
          portfolioId={portfolio.id}
          portfolioName={portfolio.name}
        />
      )}
      {tab === "workload" && (
        <WorkloadTab users={users} tasks={portfolioTasks} />
      )}
    </div>
  );
}

// -- List tab ----------------------------------------------------------------

function ListTab({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          + Add work
        </button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {projects.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No projects in this portfolio yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map((p) => {
              const pt = tasks.filter((t) => t.projectId === p.id);
              const completed = pt.filter((t) => t.completed).length;
              const rate = pt.length > 0 ? Math.round((completed / pt.length) * 100) : 0;
              const status = (p as any).status ?? "on_track";
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/overview`}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                >
                  <div className="h-2.5 w-2.5 rounded" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 text-sm font-medium text-gray-900">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status] || "bg-gray-400"}`} />
                    <span className="text-xs capitalize text-gray-500">
                      {status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-gray-700">{rate}%</span>
                  </div>
                  <span className="w-16 text-right text-xs text-gray-500">{pt.length} tasks</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// -- Timeline tab ------------------------------------------------------------

function TimelineTab({ projects }: { projects: Project[] }) {
  const ranges = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const withDates = projects.map((p) => {
      const s = p.startDate ? new Date(p.startDate) : null;
      const d = p.dueDate ? new Date(p.dueDate) : null;
      return { project: p, start: s, end: d };
    });

    // Compute overall min/max window, fallback: [today-7d, today+30d]
    let min = new Date(now);
    min.setDate(min.getDate() - 7);
    let max = new Date(now);
    max.setDate(max.getDate() + 30);

    for (const r of withDates) {
      if (r.start && !isNaN(r.start.getTime()) && r.start < min) min = new Date(r.start);
      if (r.end && !isNaN(r.end.getTime()) && r.end > max) max = new Date(r.end);
    }

    const totalDays = Math.max(1, Math.round((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));

    const bars = withDates.map((r) => {
      const sd = r.start && !isNaN(r.start.getTime()) ? r.start : now;
      const ed = r.end && !isNaN(r.end.getTime()) ? r.end : new Date(sd.getTime() + 7 * 24 * 3600 * 1000);
      const startDays = Math.max(0, Math.round((sd.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));
      const durationDays = Math.max(1, Math.round((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        project: r.project,
        leftPct: (startDays / totalDays) * 100,
        widthPct: (durationDays / totalDays) * 100,
        hasDates: Boolean(r.start || r.end),
      };
    });

    const todayLeftPct = ((now.getTime() - min.getTime()) / (1000 * 60 * 60 * 24 * totalDays)) * 100;

    return { min, max, totalDays, bars, todayLeftPct };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        No projects in this portfolio yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex justify-between text-xs text-gray-500">
        <span>{ranges.min.toLocaleDateString()}</span>
        <span>{ranges.max.toLocaleDateString()}</span>
      </div>
      <div className="space-y-2">
        {ranges.bars.map((b) => (
          <div key={b.project.id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-xs font-medium text-gray-900" title={b.project.name}>
              {b.project.name}
            </span>
            <div className="relative h-6 flex-1 rounded bg-gray-50">
              {/* Today line */}
              {ranges.todayLeftPct >= 0 && ranges.todayLeftPct <= 100 && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-400"
                  style={{ left: `${ranges.todayLeftPct}%` }}
                  title="Today"
                />
              )}
              {/* Bar */}
              <div
                className="absolute top-1 bottom-1 rounded"
                style={{
                  left: `${b.leftPct}%`,
                  width: `${b.widthPct}%`,
                  backgroundColor: b.project.color,
                  opacity: b.hasDates ? 0.85 : 0.35,
                }}
                title={
                  b.hasDates
                    ? `${b.project.startDate ?? ""} → ${b.project.dueDate ?? ""}`
                    : "No dates set"
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
        <span className="inline-block h-2 w-0.5 bg-red-400" /> Today
      </div>
    </div>
  );
}

// -- Dashboard tab -----------------------------------------------------------

function DashboardTab({
  projects,
  tasks,
  users,
}: {
  projects: Project[];
  tasks: Task[];
  users: User[];
}) {
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeMemberIds = new Set(tasks.map((t) => t.assigneeId).filter(Boolean) as string[]);
  const activeMembers = activeMemberIds.size;

  const byProject = projects.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    tasks: tasks.filter((t) => t.projectId === p.id).length,
  }));

  const byStatus = [
    { status: "completed", value: completedTasks, color: "#10b981" },
    {
      status: "in_progress",
      value: tasks.filter((t) => !t.completed && t.assigneeId).length,
      color: "#6366f1",
    },
    {
      status: "todo",
      value: tasks.filter((t) => !t.completed && !t.assigneeId).length,
      color: "#9ca3af",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Counter label="Total projects" value={totalProjects} />
        <Counter label="Total tasks" value={totalTasks} />
        <Counter label="Completed tasks" value={completedTasks} />
        <Counter label="Active members" value={activeMembers} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Tasks by project (bar) */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Tasks by project</h3>
          {byProject.length === 0 ? (
            <p className="text-xs text-gray-400">No data.</p>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={byProject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tasks by status (pie) */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Tasks by status</h3>
          {totalTasks === 0 ? (
            <p className="text-xs text-gray-400">No data.</p>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="value"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// -- Progress tab ------------------------------------------------------------

function ProgressTab({
  projects,
  portfolioTasks,
  statusUpdates,
  postProjectStatus,
  portfolioId,
  portfolioName,
}: {
  projects: Project[];
  portfolioTasks: Task[];
  statusUpdates: any[];
  postProjectStatus: (projectId: string, status: string, text?: string) => Promise<void>;
  portfolioId: string;
  portfolioName: string;
}) {
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [regularUpdates, setRegularUpdates] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formStatus, setFormStatus] = useState<string>("on_track");
  const [formText, setFormText] = useState<string>("");

  // Load regular-updates toggle from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(`portfolio.${portfolioId}.regularUpdates`);
    if (v === "1") setRegularUpdates(true);
  }, [portfolioId]);

  const onToggleRegular = (v: boolean) => {
    setRegularUpdates(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `portfolio.${portfolioId}.regularUpdates`,
        v ? "1" : "0"
      );
    }
  };

  // Latest status for each project (most recent overall)
  const latestByProject = useMemo(() => {
    const map = new Map<string, any>();
    for (const u of statusUpdates) {
      const existing = map.get(u.projectId);
      if (!existing || new Date(u.createdAt) > new Date(existing.createdAt)) {
        map.set(u.projectId, u);
      }
    }
    return projects
      .map((p) => ({ project: p, update: map.get(p.id) ?? null }))
      .sort((a, b) => {
        const at = a.update ? new Date(a.update.createdAt).getTime() : 0;
        const bt = b.update ? new Date(b.update.createdAt).getTime() : 0;
        return bt - at;
      });
  }, [projects, statusUpdates]);

  const getProjectStatus = (p: Project): string => {
    const u = latestByProject.find((x) => x.project.id === p.id)?.update;
    if (u?.status) return u.status;
    return (p as any).status ?? "on_track";
  };

  const counts = {
    on_track: projects.filter((p) => getProjectStatus(p) === "on_track").length,
    at_risk: projects.filter((p) => getProjectStatus(p) === "at_risk").length,
    off_track: projects.filter((p) => getProjectStatus(p) === "off_track").length,
  };

  const onGenerate = async () => {
    setSummaryError(null);
    const provider = getDefaultProvider();
    if (!provider) {
      setSummaryError("No AI provider configured. Configure one in Settings.");
      return;
    }
    setSummaryLoading(true);
    try {
      const items = projects.map((p) => {
        const u = latestByProject.find((x) => x.project.id === p.id)?.update;
        const statusText = p.statusText ?? u?.text ?? "";
        const projTasks = portfolioTasks.filter((t) => t.projectId === p.id);
        const completed = projTasks.filter((t) => t.completed).length;
        const pct = projTasks.length
          ? Math.round((completed / projTasks.length) * 100)
          : 0;
        const stats = `${completed}/${projTasks.length} tasks complete (${pct}%)`;
        return {
          type: "project" as const,
          title: p.name,
          description: [stats, statusText || p.description]
            .filter(Boolean)
            .join(" — "),
          status: u?.status ?? (p as any).status ?? "on_track",
        };
      });
      const out = await smartSummary(provider, items);
      setSummary(out);
    } catch (err: any) {
      setSummaryError(err?.message ?? "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const chatPrompt = useMemo(() => {
    const lines = projects
      .map((p) => {
        const projTasks = portfolioTasks.filter((t) => t.projectId === p.id);
        const completed = projTasks.filter((t) => t.completed).length;
        const status =
          latestByProject.find((x) => x.project.id === p.id)?.update?.status ??
          (p as any).status ??
          "on_track";
        return `- ${p.name} [${status}] ${completed}/${projTasks.length} tasks complete`;
      })
      .join("\n");
    return (
      `You are an AI assistant for the portfolio "${portfolioName}".\n` +
      `Projects (${projects.length}):\n${lines || "(none)"}`
    );
  }, [portfolioName, projects, portfolioTasks, latestByProject]);

  const onSubmitStatus = async () => {
    if (!formProjectId) return;
    try {
      await postProjectStatus(formProjectId, formStatus, formText.trim() || undefined);
      setShowForm(false);
      setFormProjectId("");
      setFormStatus("on_track");
      setFormText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(["on_track", "at_risk", "off_track"] as const).map((s) => (
          <div key={s} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[s]}`} />
              <p className="text-sm font-medium text-gray-700">{STATUS_LABELS[s]}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts[s]}</p>
            <p className="text-xs text-gray-500">project{counts[s] !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* AI Portfolio summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Portfolio summary (AI)</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={regularUpdates}
                onChange={(e) => onToggleRegular(e.target.checked)}
              />
              Get regular updates
            </label>
            <button
              onClick={onGenerate}
              disabled={summaryLoading}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {summaryLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
        {summaryError && (
          <p className="mb-2 text-xs text-red-600">{summaryError}</p>
        )}
        {summary ? (
          <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">{summary}</pre>
        ) : (
          <p className="text-xs text-gray-500">
            Click Generate to produce an AI summary of this portfolio&apos;s status.
          </p>
        )}
      </div>

      {/* Latest status */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Latest status</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {showForm ? "Cancel" : "Update status"}
          </button>
        </div>
        {showForm && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="on_track">On track</option>
                <option value="at_risk">At risk</option>
                <option value="off_track">Off track</option>
              </select>
              <button
                onClick={onSubmitStatus}
                disabled={!formProjectId}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Post status
              </button>
            </div>
            <textarea
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="What's the update?"
              rows={2}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
            />
          </div>
        )}

        {latestByProject.length === 0 ? (
          <p className="text-xs text-gray-400">No projects in this portfolio.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {latestByProject.map(({ project, update }) => (
              <li key={project.id} className="flex items-start gap-3 py-3">
                <div
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded"
                  style={{ backgroundColor: project.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{project.name}</span>
                    {update ? (
                      <>
                        <span
                          className={`h-2 w-2 rounded-full ${STATUS_COLORS[update.status] || "bg-gray-400"}`}
                        />
                        <span className="text-xs capitalize text-gray-500">
                          {(update.status || "").replace("_", " ")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No updates yet</span>
                    )}
                  </div>
                  {update?.text && (
                    <p className="mt-0.5 text-xs text-gray-600">{update.text}</p>
                  )}
                  {update?.createdAt && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {new Date(update.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Chat */}
      <div className="h-[440px] rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-full p-3">
          <SmartChat
            title="Ask AI about this portfolio"
            contextSystemPrompt={chatPrompt}
            suggestedPrompts={[
              "Summarize portfolio status",
              "Which projects are at risk?",
              "What's the biggest risk across projects?",
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// -- Workload tab ------------------------------------------------------------

function WorkloadTab({ users, tasks }: { users: User[]; tasks: Task[] }) {
  const rows = useMemo(() => {
    const counts = new Map<string, { total: number; completed: number }>();
    for (const t of tasks) {
      if (!t.assigneeId) continue;
      const c = counts.get(t.assigneeId) ?? { total: 0, completed: 0 };
      c.total += 1;
      if (t.completed) c.completed += 1;
      counts.set(t.assigneeId, c);
    }
    const out: { user: User; total: number; completed: number; active: number }[] = [];
    Array.from(counts.entries()).forEach(([uid, c]) => {
      const u = users.find((x) => x.id === uid);
      if (!u) return;
      out.push({ user: u, total: c.total, completed: c.completed, active: c.total - c.completed });
    });
    return out.sort((a, b) => b.active - a.active);
  }, [users, tasks]);

  const max = rows.reduce((m, r) => Math.max(m, r.active), 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        No assigned tasks across this portfolio.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Workload across portfolio</h3>
      <ul className="space-y-3">
        {rows.map(({ user, total, completed, active }) => {
          const pct = max === 0 ? 0 : Math.round((active / max) * 100);
          return (
            <li key={user.id} className="flex items-center gap-3">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar as string}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">
                    {active} active · {completed}/{total} done
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
