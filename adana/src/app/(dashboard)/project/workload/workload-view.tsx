"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { WorkloadView } from "@/components/workload/workload-view";

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "overview", label: "Overview" },
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "workload", label: "Workload" },
    { key: "note", label: "Note" },
    { key: "files", label: "Files" },
    { key: "dashboard", label: "Dashboard" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/project/${v.key}?id=${projectId}`}
          className={`relative px-3 py-2.5 text-sm font-medium transition ${
            active === v.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {v.label}
          {active === v.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
          )}
        </Link>
      ))}
    </div>
  );
}

export default function WorkloadViewClient() {
  const searchParams = useSearchParams();
  const id = (searchParams?.get("id") as string) || "";
  const { projects } = useAppStore();
  const project = projects.find((p) => p.id === id);

  return (
    <>
      <ViewNav projectId={id} active="workload" />
      <div className="p-6">
        {!project ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Project not found.
          </div>
        ) : (
          <WorkloadView projectId={id} />
        )}
      </div>
    </>
  );
}
