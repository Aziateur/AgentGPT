"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarView } from "@/components/calendar/calendar-view";

// ---------------------------------------------------------------------------
// View Nav
// ---------------------------------------------------------------------------

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "overview", label: "Overview" },
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarViewClient() {
  const searchParams = useSearchParams();
  const projectId = (searchParams?.get("id") as string) ?? "";

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="calendar" />
      <div className="flex-1 overflow-hidden">
        <CalendarView projectId={projectId} />
      </div>
    </div>
  );
}
