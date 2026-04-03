import { getProject } from "@/app/actions/project-actions";
import type { Project, ProjectStatusType } from "@/types";
import Link from "next/link";

// -- Mock data ----------------------------------------------------------------

const mockProject: Project = {
  id: "p1",
  name: "Website Redesign",
  description: "Redesign the marketing website with new branding, improved UX, and modern tech stack. The goal is to increase conversion rates by 25% and reduce bounce rate.",
  color: "#4f46e5",
  icon: null,
  ownerId: "demo-user",
  teamId: "team-1",
  privacy: "public",
  defaultView: "board",
  status: "on_track",
  statusText: "Going well, on track for Q2 delivery",
  startDate: new Date(Date.now() - 2592000000).toISOString(),
  dueDate: new Date(Date.now() + 5184000000).toISOString(),
  archived: false,
  memberIds: ["demo-user", "user-2", "user-3", "user-4"],
  sectionIds: ["s1", "s2", "s3"],
  createdAt: new Date(Date.now() - 2592000000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockStats = {
  totalTasks: 24,
  completedTasks: 15,
  overdueTasks: 2,
  milestonesCompleted: 3,
  milestonesTotal: 5,
};

const mockMembers = [
  { id: "demo-user", name: "Demo User", role: "Owner", initial: "D" },
  { id: "user-2", name: "Sarah Chen", role: "Designer", initial: "S" },
  { id: "user-3", name: "Alex Kim", role: "Developer", initial: "A" },
  { id: "user-4", name: "Jordan Lee", role: "QA Lead", initial: "J" },
];

const mockStatusUpdates = [
  { id: "su1", text: "Completed design system components. Moving to page implementation.", date: "Mar 28", author: "Sarah Chen" },
  { id: "su2", text: "API layer is 80% done. Auth and task endpoints ready.", date: "Mar 22", author: "Alex Kim" },
  { id: "su3", text: "Project kickoff. Requirements finalized.", date: "Mar 10", author: "Demo User" },
];

const mockMilestones = [
  { id: "m1", name: "Design Approval", completed: true, date: "Mar 15" },
  { id: "m2", name: "API MVP", completed: true, date: "Mar 22" },
  { id: "m3", name: "Frontend Alpha", completed: true, date: "Mar 30" },
  { id: "m4", name: "QA Complete", completed: false, date: "Apr 15" },
  { id: "m5", name: "Launch", completed: false, date: "Apr 30" },
];

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

  let project: Project = { ...mockProject, id };
  try {
    const fetched = await getProject(id);
    if (fetched) project = fetched;
  } catch {
    // use mock
  }

  const progress = Math.round(
    (mockStats.completedTasks / mockStats.totalTasks) * 100
  );

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
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[project.status]}`}
                  >
                    {statusLabel[project.status]}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {project.description}
                  </p>
                )}
                {project.statusText && (
                  <p className="mt-2 text-sm italic text-gray-500">
                    {project.statusText}
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
                {mockStats.totalTasks}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {mockStats.completedTasks}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {mockStats.overdueTasks}
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
                  Milestones ({mockStats.milestonesCompleted}/{mockStats.milestonesTotal})
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {mockMilestones.map((m) => (
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
                      {m.name}
                    </span>
                    <span className="text-xs text-gray-500">{m.date}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Team Members */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Team ({mockMembers.length})
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {mockMembers.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                      {member.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status Updates */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Status Updates
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {mockStatusUpdates.map((update) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
