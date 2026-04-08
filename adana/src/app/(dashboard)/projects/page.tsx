"use client";

import { mockProjects } from "@/lib/mock-data";
import { ProjectsPageClient } from "./projects-client";

export default function ProjectsPage() {
  return <ProjectsPageClient projects={mockProjects} />;
}
