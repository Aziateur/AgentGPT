import { getSectionsForProject, getTasksForProject, PROJECT_IDS } from "@/lib/mock-data";
import { TimelinePageClient } from "./timeline-client";

export function generateStaticParams() {
  return PROJECT_IDS.map((id) => ({ id }));
}

export default function ProjectTimelinePage({ params }: { params: { id: string } }) {
  const sections = getSectionsForProject(params.id);
  const tasks = getTasksForProject(params.id);
  const dependencies: { id: string; blockedTaskId: string; blockingTaskId: string }[] = [];

  return (
    <TimelinePageClient
      projectId={params.id}
      initialSections={sections}
      initialTasks={tasks as any}
      initialDependencies={dependencies}
    />
  );
}
