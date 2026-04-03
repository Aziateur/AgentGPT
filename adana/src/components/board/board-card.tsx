"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Calendar,
  CheckSquare,
  Milestone,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import type { Task, Tag, User, TaskPriority } from "@/types";

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const priorityBorderColor: Record<TaskPriority, string> = {
  none: "border-l-gray-200",
  low: "border-l-blue-400",
  medium: "border-l-orange-400",
  high: "border-l-red-500",
};

const priorityLabel: Record<TaskPriority, string> = {
  none: "No priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoardCardProps {
  task: Task;
  assignee?: User | null;
  tags?: Tag[];
  onClick?: (taskId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardCard({ task, assignee, tags = [], onClick, className }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && !task.completed;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm",
        "border-l-[3px]",
        priorityBorderColor[task.priority],
        "hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg ring-2 ring-indigo-300",
        className
      )}
      onClick={() => onClick?.(task.id)}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600"
        aria-label="Drag task"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Title */}
      <p
        className={cn(
          "text-sm font-medium text-gray-900 leading-snug line-clamp-2",
          task.completed && "line-through text-gray-400"
        )}
      >
        {task.type === "milestone" && (
          <Milestone className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
        )}
        {task.type === "approval" && (
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-purple-500" />
        )}
        {task.name}
      </p>

      {/* Meta row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Due date */}
          {dueDateObj && (
            <Tooltip content={`Due ${format(dueDateObj, "MMM d, yyyy")}`}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                  isOverdue
                    ? "bg-red-50 text-red-600"
                    : isToday(dueDateObj)
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-500"
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(dueDateObj, "MMM d")}
              </span>
            </Tooltip>
          )}

          {/* Subtask count */}
          {task.subtaskIds.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400">
              <CheckSquare className="h-3 w-3" />
              {task.subtaskIds.length}
            </span>
          )}

          {/* Tag dots */}
          {tags.length > 0 && (
            <div className="flex items-center gap-0.5">
              {tags.slice(0, 3).map((tag) => (
                <Tooltip key={tag.id} content={tag.name}>
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                </Tooltip>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Assignee */}
        {assignee && (
          <Tooltip content={assignee.name}>
            <span>
              <Avatar
                size="xs"
                name={assignee.name}
                src={assignee.avatarUrl ?? undefined}
              />
            </span>
          </Tooltip>
        )}
      </div>
    </motion.div>
  );
}
