import { redirect } from "next/navigation";
import { getProject } from "@/app/actions/project-actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let defaultView = "list";
  try {
    const project = await getProject(id);
    if (project?.defaultView) {
      defaultView = project.defaultView;
    }
  } catch {
    // fallback to list view
  }

  redirect(`/projects/${id}/${defaultView}`);
}
