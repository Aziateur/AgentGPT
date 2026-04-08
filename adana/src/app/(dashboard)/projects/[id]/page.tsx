import { PROJECT_IDS } from "@/lib/mock-data";
import { ProjectRedirectClient } from "./project-redirect-client";

export function generateStaticParams() {
  return PROJECT_IDS.map((id) => ({ id }));
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectRedirectClient id={params.id} />;
}
