import { getProject } from "@/app/actions/project-actions";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let projectName = "Project";
  let projectColor = "#4f46e5";
  let projectStatusText: string | null = null;

  try {
    const project = await getProject(id);
    if (project) {
      projectName = project.name;
      projectColor = project.color;
      // Derive status text from latest status update or project description
      if (project.statuses && project.statuses.length > 0 && project.statuses[0].text) {
        projectStatusText = project.statuses[0].text;
      }
    }
  } catch {
    // use defaults
  }

  return (
    <div className="flex h-full flex-col">
      {/* Project breadcrumb */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-3">
        <div
          className="h-3 w-3 rounded"
          style={{ backgroundColor: projectColor }}
        />
        <h2 className="text-sm font-semibold text-gray-900">{projectName}</h2>
        {projectStatusText && (
          <span className="ml-2 text-xs text-gray-500">
            &mdash; {projectStatusText}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
