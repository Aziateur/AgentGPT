import { getProjects } from "@/app/actions/project-actions";
import type { ProjectStatusType } from "@/types";
import { ProjectsPageClient } from "./projects-client";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return <ProjectsPageClient projects={projects} />;
}
