"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

interface TaskContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onCreateFollowUp: () => void;
  onMarkComplete: () => void;
  onAddSubtask: () => void;
  onConvertTo: (type: "task" | "milestone" | "approval") => void;
  onOpenDetails: () => void;
  onOpenInNewTab: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}

export function TaskContextMenu({
  x,
  y,
  onClose,
  onDuplicate,
  onCreateFollowUp,
  onMarkComplete,
  onAddSubtask,
  onConvertTo,
  onOpenDetails,
  onOpenInNewTab,
  onCopyLink,
  onDelete,
}: TaskContextMenuProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [convertOpen, setConvertOpen] = React.useState(false);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  // Adjust to keep within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, typeof window !== "undefined" ? window.innerWidth - 240 : x),
    top: Math.min(y, typeof window !== "undefined" ? window.innerHeight - 360 : y),
    zIndex: 80,
  };

  function item(
    label: string,
    onClick: () => void,
    opts?: { destructive?: boolean; chevron?: boolean; onMouseEnter?: () => void }
  ) {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={opts?.onMouseEnter}
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
    <div ref={ref} style={style} className="w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
      {item("Duplicate task", () => { onDuplicate(); onClose(); })}
      {item("Create follow-up task", () => { onCreateFollowUp(); onClose(); })}
      {item("Mark complete", () => { onMarkComplete(); onClose(); })}
      {item("Add subtask", () => { onAddSubtask(); onClose(); })}
      <div className="relative" onMouseLeave={() => setConvertOpen(false)}>
        <button
          type="button"
          onMouseEnter={() => setConvertOpen(true)}
          onClick={() => setConvertOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
        >
          Convert to
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </button>
        {convertOpen && (
          <div className="absolute left-full top-0 ml-1 w-36 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => { onConvertTo("task"); onClose(); }}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
            >
              Task <span className="text-green-600">✓</span>
            </button>
            <button
              type="button"
              onClick={() => { onConvertTo("milestone"); onClose(); }}
              className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
            >
              Milestone
            </button>
            <button
              type="button"
              onClick={() => { onConvertTo("approval"); onClose(); }}
              className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
            >
              Approval
            </button>
          </div>
        )}
      </div>
      {item("Open task details", () => { onOpenDetails(); onClose(); })}
      {item("Open in new tab", () => { onOpenInNewTab(); onClose(); })}
      {item("Copy task link", () => { onCopyLink(); onClose(); })}
      <div className="my-1 h-px bg-gray-100" />
      {item("Delete task", () => {
        if (confirm("Delete this task?")) {
          onDelete();
          onClose();
        }
      }, { destructive: true })}
    </div>
  );
}
