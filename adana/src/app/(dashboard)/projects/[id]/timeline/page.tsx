import { getSections } from "@/app/actions/section-actions";
import { getTasks } from "@/app/actions/task-actions";
import { TimelinePageClient } from "./timeline-client";

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sections, tasks] = await Promise.all([
    getSections(id),
    getTasks(id),
  ]);

  // Also fetch dependencies for all tasks in this project
  let dependencies: { id: string; blockedTaskId: string; blockingTaskId: string }[] = [];
  try {
    const { prisma } = await import("@/lib/prisma");
    dependencies = await prisma.dependency.findMany({
      where: {
        blockedTask: { projectId: id },
      },
      select: {
        id: true,
        blockedTaskId: true,
        blockingTaskId: true,
      },
    });
  } catch {
    // ignore
  }

  return (
    <TimelinePageClient
      projectId={id}
      initialSections={JSON.parse(JSON.stringify(sections))}
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      initialDependencies={JSON.parse(JSON.stringify(dependencies))}
    />
  );
}
