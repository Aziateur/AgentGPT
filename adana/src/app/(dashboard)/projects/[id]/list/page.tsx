import { getSections } from "@/app/actions/section-actions";
import { getTasks } from "@/app/actions/task-actions";
import { ProjectListClient } from "./list-client";

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sections, tasks] = await Promise.all([
    getSections(id),
    getTasks(id),
  ]);

  return (
    <ProjectListClient
      projectId={id}
      initialSections={JSON.parse(JSON.stringify(sections))}
      initialTasks={JSON.parse(JSON.stringify(tasks))}
    />
  );
}
