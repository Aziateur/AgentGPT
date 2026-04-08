import Link from "next/link";
import type { ProjectStatusType } from "@/types";
import { getProjectById, getTasksForProject, PROJECT_IDS } from "@/lib/mock-data";

export function generateStaticParams() {
  return PROJECT_IDS.map((id) => ({ id }));
}

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

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const project = getProjectById(id);
  const allTasks = getTasksForProject(id);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Project not found.</p>
      </div>
    );
  }

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const overdueTasks = allTasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const latestStatus = (project.status as ProjectStatusType) || "on_track";

  const members = [
    { id: "demo-user", name: "Demo User", role: "admin", initial: "D" },
    { id: "user-2", name: "Sarah Chen", role: "member", initial: "S" },
    { id: "user-3", name: "Alex Rivera", role: "member", initial: "A" },
  ];

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={id} active="overview" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: project.color }} />
                  <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[latestStatus] ?? "bg-gray-100 text-gray-700"}`}>
                    {statusLabel[latestStatus] ?? "On Track"}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-2 text-sm text-gray-600">{project.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{completedTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{overdueTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="mt-1 text-2xl font-bold text-indigo-600">{progress}%</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">Overall Progress</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div className="h-3 rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Milestones (0/0)</h3>
              </div>
              <div className="px-5 py-4 text-sm text-gray-400">No milestones yet.</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Team ({members.length})</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                      {member.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs capitalize text-gray-500">{member.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Status Updates</h3>
            </div>
            <div className="px-5 py-4 text-sm text-gray-400">No status updates yet.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
