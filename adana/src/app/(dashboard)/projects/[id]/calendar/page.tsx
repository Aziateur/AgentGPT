import { getTasksForProject, PROJECT_IDS } from "@/lib/mock-data";
import { CalendarPageClient } from "./calendar-client";

export function generateStaticParams() {
  return PROJECT_IDS.map((id) => ({ id }));
}

export default function ProjectCalendarPage({ params }: { params: { id: string } }) {
  const tasks = getTasksForProject(params.id);

  return (
    <CalendarPageClient
      projectId={params.id}
      initialTasks={tasks as any}
    />
  );
}
