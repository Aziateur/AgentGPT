import { getSectionsForProject, getTasksForProject, PROJECT_IDS } from "@/lib/mock-data";
import { BoardPageClient } from "./board-client";

export function generateStaticParams() {
  return PROJECT_IDS.map((id) => ({ id }));
}

export default function ProjectBoardPage({ params }: { params: { id: string } }) {
  const sections = getSectionsForProject(params.id);
  const tasks = getTasksForProject(params.id);

  return (
    <BoardPageClient
      projectId={params.id}
      initialSections={sections}
      initialTasks={tasks as any}
    />
  );
}
