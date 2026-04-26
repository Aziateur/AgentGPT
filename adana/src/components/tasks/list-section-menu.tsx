"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

interface SectionMenuProps {
  open: boolean;
  onClose: () => void;
  onRename: () => void;
  onAddSection: (placement: "above" | "below") => void;
  onDuplicate: () => void;
  onExpandSubtasks: (mode: "expand" | "collapse") => void;
  onExpandGroups: (mode: "expand" | "collapse") => void;
  onHideEmptyGroups: () => void;
  onDelete: () => void;
}

export function SectionMenu({
  open,
  onClose,
  onRename,
  onAddSection,
  onDuplicate,
  onExpandSubtasks,
  onExpandGroups,
  onHideEmptyGroups,
  onDelete,
}: SectionMenuProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [subtasksOpen, setSubtasksOpen] = React.useState(false);
  const [groupsOpen, setGroupsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  if (!open) return null;

  function item(
    label: string,
    onClick: () => void,
    opts?: { destructive?: boolean; chevron?: boolean }
  ) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
          opts?.destructive
            ? "text-red-600 hover:bg-red-50"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {label}
        {opts?.chevron && <ChevronRight className="h-3 w-3 text-gray-400" />}
      </button>
    );
  }

  return (
    <div ref={ref} className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
      {item("Rename section", () => {
        onRename();
        onClose();
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
        >
          Add section
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </button>
        {addOpen && (
          <div className="absolute left-full top-0 ml-1 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {item("Above", () => {
              onAddSection("above");
              onClose();
            })}
            {item("Below", () => {
              onAddSection("below");
              onClose();
            })}
          </div>
        )}
      </div>

      {item("Duplicate section", () => {
        onDuplicate();
        onClose();
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setSubtasksOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
        >
          Expand or collapse subtasks
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </button>
        {subtasksOpen && (
          <div className="absolute left-full top-0 ml-1 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {item("Expand", () => {
              onExpandSubtasks("expand");
              onClose();
            })}
            {item("Collapse", () => {
              onExpandSubtasks("collapse");
              onClose();
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setGroupsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
        >
          Expand or collapse groups
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </button>
        {groupsOpen && (
          <div className="absolute left-full top-0 ml-1 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {item("Expand", () => {
              onExpandGroups("expand");
              onClose();
            })}
            {item("Collapse", () => {
              onExpandGroups("collapse");
              onClose();
            })}
          </div>
        )}
      </div>

      {item("Hide all empty groups", () => {
        onHideEmptyGroups();
        onClose();
      })}

      <div className="my-1 h-px bg-gray-100" />

      {item("Delete section", () => {
        if (confirm("Delete this section?")) {
          onDelete();
          onClose();
        }
      }, { destructive: true })}
    </div>
  );
}
