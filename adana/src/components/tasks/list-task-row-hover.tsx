"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  CornerDownRight,
  ListTree,
  CheckSquare,
  Milestone,
  ShieldCheck,
} from "lucide-react";
import type { Task, User } from "@/types";
import type { ColumnSetting } from "./list-columns-panel";

const priorityColor: Record<string, string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-600 bg-blue-50",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface TaskRowHoverProps {
  task: Task;
  assignee: User | null;
  selected: boolean;
  bulkSelected: boolean;
  expanded: boolean;
  onClick: (e: React.MouseEvent) => void;
  onCheckboxClick: (e: React.MouseEvent) => void;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMakeSubtaskOf: () => void;
  onOpenDetail: () => void;
  subtaskCount: number;
  columns: ColumnSetting[];
  creator?: User | null;
  tagNames?: string[];
  blockedByCount?: number;
  blockingCount?: number;
  projectName?: string | null;
}

export function TaskRowHover({
  task,
  assignee,
  selected,
  bulkSelected,
  expanded,
  onClick,
  onCheckboxClick,
  onToggleComplete,
  onToggleExpand,
  onContextMenu,
  onMakeSubtaskOf,
  onOpenDetail,
  subtaskCount,
  columns,
  creator,
  tagNames = [],
  blockedByCount = 0,
  blockingCount = 0,
  projectName,
}: TaskRowHoverProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const [hovering, setHovering] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const visible = (key: string) => columns.find((c) => c.key === key)?.visible;

  function TypeIcon() {
    if (task.taskType === "milestone") return <Milestone className="h-3 w-3 text-amber-500" />;
    if (task.taskType === "approval") return <ShieldCheck className="h-3 w-3 text-blue-500" />;
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`group relative flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
        selected ? "bg-indigo-50/60" : bulkSelected ? "bg-indigo-50/30" : ""
      }`}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />}

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className={`shrink-0 cursor-grab text-gray-300 transition ${
          hovering || bulkSelected ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Drag handle"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Bulk select checkbox */}
      <input
        type="checkbox"
        checked={bulkSelected}
        onClick={onCheckboxClick}
        onChange={() => {}}
        className={`h-3.5 w-3.5 shrink-0 rounded border-gray-300 transition ${
          hovering || bulkSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Complete checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.completed
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 hover:border-gray-400"
        }`}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Subtask expand chevron */}
      {subtaskCount > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}

      <TypeIcon />

      {/* Title */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            task.completed ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {task.title}
        </p>
      </div>

      {/* Hover affordances */}
      {hovering && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMakeSubtaskOf();
            }}
            title="Make subtask of..."
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            title="Open details"
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Subtask count indicator */}
      {subtaskCount > 0 && !hovering && (
        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
          {subtaskCount} <ListTree className="h-3 w-3" />
        </span>
      )}

      {/* Columns */}
      {visible("assignee") && assignee && (
        <div
          title={assignee.name}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600"
        >
          {(assignee.name || "?")[0].toUpperCase()}
        </div>
      )}
      {visible("assignee") && !assignee && (
        <span className="inline-block h-6 w-6 shrink-0 rounded-full border border-dashed border-gray-300" />
      )}
      {visible("due_date") && task.dueDate && (
        <span className="shrink-0 text-xs text-gray-500">{formatDate(task.dueDate)}</span>
      )}
      {visible("due_date") && !task.dueDate && (
        <span className="shrink-0 text-xs text-gray-300">—</span>
      )}
      {visible("created_by") && creator && (
        <span className="shrink-0 text-xs text-gray-500">{creator.name}</span>
      )}
      {visible("created_on") && (
        <span className="shrink-0 text-xs text-gray-400">
          {formatDateLong((task as any).createdAt ?? task.creator ?? "")}
        </span>
      )}
      {visible("last_modified_on") && (
        <span className="shrink-0 text-xs text-gray-400">
          {(task as any).updatedAt ? formatDateLong((task as any).updatedAt as string) : "—"}
        </span>
      )}
      {visible("completed_on") && task.completedAt && (
        <span className="shrink-0 text-xs text-gray-400">{formatDate(task.completedAt)}</span>
      )}
      {visible("projects") && projectName && (
        <span className="shrink-0 truncate max-w-[120px] text-xs text-gray-500">{projectName}</span>
      )}
      {visible("tags") && tagNames.length > 0 && (
        <span className="shrink-0 truncate max-w-[140px] text-xs text-gray-500">
          {tagNames.slice(0, 2).join(", ")}
          {tagNames.length > 2 ? ` +${tagNames.length - 2}` : ""}
        </span>
      )}
      {visible("blocked_by") && (
        <span className="shrink-0 text-xs text-gray-400">
          {blockedByCount > 0 ? `↩ ${blockedByCount}` : ""}
        </span>
      )}
      {visible("blocking") && (
        <span className="shrink-0 text-xs text-gray-400">
          {blockingCount > 0 ? `↪ ${blockingCount}` : ""}
        </span>
      )}

      {/* Priority badge */}
      {task.priority && task.priority !== "none" && (
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority] || ""}`}>
          {task.priority}
        </span>
      )}
    </div>
  );
}
