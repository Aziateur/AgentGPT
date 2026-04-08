import { getProject } from "@/app/actions/project-actions";
import { getTasks } from "@/app/actions/task-actions";
import type { ProjectStatusType } from "@/types";
import Link from "next/link";

// -- Helpers ------------------------------------------------------------------

const statusColor: Record<ProjectStatusType, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-yellow-100 text-yellow-700",
  off_track: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
  complete: "bg-blue-100 text-blue-700",
};

const statusLabel: Record<ProjectStatusType, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  on_hold: "On Hold",
  complete: "Complete",
};

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "overview", label: "Overview" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/projects/${projectId}/${v.key}`}
          className={`relative px-3 py-2.5 text-sm font-medium transition ${
            active === v.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {v.label}
          {active === v.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
          )}
        </Link>
      ))}
    </div>
  );
}

// -- Page ---------------------------------------------------------------------

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, allTasks] = await Promise.all([
    getProject(id),
    getTasks(id),
  ]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Project not found.</p>
      </div>
    );
  }

  // Compute real stats
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: { completed: boolean }) => t.completed).length;
  const overdueTasks = allTasks.filter((t: { completed: boolean; dueDate?: string | Date | null }) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  const milestoneTasks = allTasks.filter((t: { taskType: string }) => t.taskType === "milestone");
  const milestonesCompleted = milestoneTasks.filter((t: { completed: boolean }) => t.completed).length;
  const milestonesTotal = milestoneTasks.length;

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Real members from project.members
  const members = (project.members ?? []).map((m: { id: string; role: string; user?: { id: string; name: string; email: string; avatar?: string | null } }) => ({
    id: m.user?.id ?? m.id,
    name: m.user?.name ?? "Unknown",
    role: m.role,
    initial: (m.user?.name ?? "?")[0],
  }));

  // Real status updates from project.statuses
  const statusUpdates = (project.statuses ?? []).map((s: { id: string; text?: string | null; createdAt: string | Date; status: string; author?: { id: string; name: string; avatar?: string | null } }) => ({
    id: s.id,
    text: s.text ?? `Status: ${s.status}`,
    date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    author: s.author?.name ?? "Unknown",
  }));

  // Derive project status from latest status update or default
  const latestStatus = project.statuses && project.statuses.length > 0
    ? (project.statuses[0].status as ProjectStatusType)
    : "on_track";

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={id} active="overview" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          {/* Project header info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: project.color }}
                  />
                  <h1 className="text-xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[latestStatus] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {statusLabel[latestStatus] ?? "On Track"}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalTasks}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {completedTasks}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {overdueTasks}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="mt-1 text-2xl font-bold text-indigo-600">
                {progress}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">Overall Progress</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Milestones */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Milestones ({milestonesCompleted}/{milestonesTotal})
                </h3>
              </div>
              {milestonesTotal === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-400">
                  No milestones yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {milestoneTasks.map((m: { id: string; title: string; completed: boolean; dueDate?: string | Date | null }) => (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          m.completed
                            ? "bg-green-500 text-white"
                            : "border-2 border-gray-300"
                        }`}
                      >
                        {m.completed && (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`flex-1 text-sm ${
                          m.completed ? "text-gray-400 line-through" : "font-medium text-gray-900"
                        }`}
                      >
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="text-xs text-gray-500">
                          {new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Team Members */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Team ({members.length})
                </h3>
              </div>
              {members.length === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-400">
                  No members yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {members.map((member: { id: string; name: string; role: string; initial: string }) => (
                    <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                        {member.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-xs capitalize text-gray-500">{member.role}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Status Updates */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Status Updates
              </h3>
            </div>
            {statusUpdates.length === 0 ? (
              <div className="px-5 py-4 text-sm text-gray-400">
                No status updates yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {statusUpdates.map((update: { id: string; text: string; date: string; author: string }) => (
                  <div key={update.id} className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {update.author}
                      </span>
                      <span>&middot;</span>
                      <span>{update.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{update.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
