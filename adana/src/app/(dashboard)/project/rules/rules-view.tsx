"use client";

import { useSearchParams } from "next/navigation";
import { RulesPanel } from "@/components/automation/rules-panel";

export default function RulesView() {
  const searchParams = useSearchParams();
  const projectId = (searchParams?.get("id") as string) ?? "";

  if (!projectId) {
    return (
      <div className="p-6 text-sm text-gray-500">
        No project selected. Append <code>?id=&lt;projectId&gt;</code> to the URL.
      </div>
    );
  }

  return (
    <div className="p-6">
      <RulesPanel projectId={projectId} />
    </div>
  );
}
