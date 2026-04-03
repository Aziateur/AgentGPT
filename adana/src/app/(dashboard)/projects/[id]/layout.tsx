import { getProject } from "@/app/actions/project-actions";
import type { Project } from "@/types";

const mockProject: Project = {
  id: "p1",
  name: "Website Redesign",
  description: "Redesign the marketing website",
  color: "#4f46e5",
  icon: null,
  ownerId: "demo-user",
  teamId: "team-1",
  privacy: "public",
  defaultView: "board",
  status: "on_track",
  statusText: "Going well",
  startDate: null,
  dueDate: null,
  archived: false,
  memberIds: ["demo-user"],
  sectionIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  return (
    <div className="flex h-full flex-col">
      {/* Project breadcrumb */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-3">
        <div
          className="h-3 w-3 rounded"
          style={{ backgroundColor: project.color }}
        />
        <h2 className="text-sm font-semibold text-gray-900">{project.name}</h2>
        {project.statusText && (
          <span className="ml-2 text-xs text-gray-500">
            — {project.statusText}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
