import { getSectionsForProject, getTasksForProject, PROJECT_IDS } from "@/lib/mock-data";
import { ProjectListClient } from "./list-client";

export function generateStaticParams() {
  return PROJECT_IDS.map((id) => ({ id }));
}

export default function ProjectListPage({ params }: { params: { id: string } }) {
  const sections = getSectionsForProject(params.id);
  const tasks = getTasksForProject(params.id);

  return (
    <ProjectListClient
      projectId={params.id}
      initialSections={sections}
      initialTasks={tasks as any}
    />
  );
}
