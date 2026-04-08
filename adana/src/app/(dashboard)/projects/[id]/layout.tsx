"use client";

import { useParams } from "next/navigation";
import { getProjectById } from "@/lib/mock-data";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;
  const project = getProjectById(id);

  const projectName = project?.name || "Project";
  const projectColor = project?.color || "#4f46e5";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-3">
        <div
          className="h-3 w-3 rounded"
          style={{ backgroundColor: projectColor }}
        />
        <h2 className="text-sm font-semibold text-gray-900">{projectName}</h2>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
