import { getTasks } from "@/app/actions/task-actions";
import { CalendarPageClient } from "./calendar-client";

export default async function ProjectCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tasks = await getTasks(id);

  return (
    <CalendarPageClient
      projectId={id}
      initialTasks={JSON.parse(JSON.stringify(tasks))}
    />
  );
}
