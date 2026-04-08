"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Check,
  Calendar,
  User as UserIcon,
  Milestone,
  ThumbsUp,
} from "lucide-react";
import { isToday, isBefore, startOfDay } from "date-fns";
import { cn, formatDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import type {
  Task,
  User,
  Tag,
  CustomFieldDef,
  TaskPriority,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityVariant: Record<TaskPriority, "default" | "high" | "medium" | "low"> = {
  none: "default",
  low: "low",
  medium: "medium",
  high: "high",
};

const priorityLabel: Record<TaskPriority, string> = {
  none: "---",
  low: "Low",
  medium: "Medium",
  high: "High",
};

function dueDateColor(dueDate: string | null | undefined): string {
  if (!dueDate) return "text-gray-500";
  const d = new Date(dueDate);
  if (isBefore(d, startOfDay(new Date())) && !isToday(d)) return "text-red-600";
  if (isToday(d)) return "text-orange-600";
  return "text-gray-500";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TaskRowProps {
  task: Task;
  assignee?: User | null;
  tags?: Tag[];
  customFieldDefs?: CustomFieldDef[];
  onComplete?: (taskId: string, completed: boolean) => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onClick?: (taskId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskRow({
  task,
  assignee,
  tags = [],
  customFieldDefs = [],
  onComplete,
  onUpdate,
  onClick,
  className,
}: TaskRowProps) {
  const taskName = task.title || (task as Record<string, unknown>).name as string || "";
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(taskName);
  const [justCompleted, setJustCompleted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external name changes
  React.useEffect(() => {
    if (!isEditing) setEditValue(taskName);
  }, [taskName, isEditing]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleComplete = (checked: boolean | "indeterminate") => {
    const completed = checked === true;
    if (completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1200);
    }
    onComplete?.(task.id, completed);
  };

  const commitTitle = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== taskName) {
      onUpdate?.(task.id, { title: trimmed });
    } else {
      setEditValue(taskName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitTitle();
    if (e.key === "Escape") {
      setEditValue(taskName);
      setIsEditing(false);
    }
  };

  // Build custom field value display
  const customFieldCells = customFieldDefs.map((def) => {
    const cfvList = task.customValues || (task as Record<string, unknown>).customFieldValues as Array<Record<string, unknown>> || [];
    const cfv = cfvList.find((v: any) => v.fieldId === def.id) as any;
    let display = "---";
    if (cfv) {
      if (cfv.stringValue) display = cfv.stringValue;
      else if (cfv.numberValue !== null && cfv.numberValue !== undefined) display = String(cfv.numberValue);
      else if (cfv.dateValue) display = formatDate(cfv.dateValue);
      else if (cfv.selectedOptions?.length) display = cfv.selectedOptions.join(", ");
    }
    return (
      <div
        key={def.id}
        className="flex-shrink-0 w-28 truncate text-xs text-gray-500 px-2"
        title={display}
      >
        {display}
      </div>
    );
  });

  const taskType = task.taskType || (task as Record<string, unknown>).type as string || "task";
  const isMilestone = taskType === "milestone";
  const isApproval = taskType === "approval";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group flex items-center gap-1 h-9 border-b border-gray-100 px-2 transition-colors hover:bg-gray-50/80 cursor-pointer",
        task.completed && "opacity-60",
        className,
      )}
      onClick={() => onClick?.(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.(task.id);
      }}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5 text-gray-400" />
      </div>

      {/* Checkbox */}
      <div
        className="flex-shrink-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {isMilestone ? (
          <Tooltip content="Milestone">
            <button
              onClick={() => handleComplete(!task.completed)}
              className={cn(
                "h-4 w-4 rotate-45 border-2 flex items-center justify-center transition-colors",
                task.completed
                  ? "border-green-500 bg-green-500"
                  : "border-gray-300 hover:border-green-400"
              )}
            >
              {task.completed && (
                <Check className="h-2.5 w-2.5 -rotate-45 text-white stroke-[3]" />
              )}
            </button>
          </Tooltip>
        ) : (
          <Checkbox
            size="sm"
            checked={task.completed}
            onCheckedChange={handleComplete}
          />
        )}

        {/* Green checkmark animation */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-200">
                <Check className="h-3 w-3 text-white stroke-[3]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task type indicator */}
      {(isMilestone || isApproval) && (
        <Tooltip content={isMilestone ? "Milestone" : "Approval"}>
          <div className="flex-shrink-0 ml-0.5">
            {isMilestone ? (
              <Milestone className="h-3 w-3 text-purple-500" />
            ) : (
              <ThumbsUp className="h-3 w-3 text-blue-500" />
            )}
          </div>
        </Tooltip>
      )}

      {/* Task name */}
      <div
        className="flex-1 min-w-0 px-2"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-gray-900 outline-none border-b border-indigo-400 py-0.5"
          />
        ) : (
          <span
            className={cn(
              "text-sm text-gray-900 truncate block",
              task.completed && "line-through text-gray-400",
            )}
          >
            {taskName}
          </span>
        )}
      </div>

      {/* Assignee */}
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
        {assignee ? (
          <Tooltip content={assignee.name}>
            <Avatar
              size="xs"
              src={assignee.avatar as string | undefined}
              name={assignee.name}
            />
          </Tooltip>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <UserIcon className="h-3 w-3 text-gray-400" />
          </div>
        )}
      </div>

      {/* Due date */}
      <div
        className={cn(
          "flex-shrink-0 w-28 flex items-center gap-1 text-xs",
          dueDateColor(task.dueDate),
        )}
      >
        {task.dueDate && (
          <>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
          </>
        )}
      </div>

      {/* Priority */}
      <div className="flex-shrink-0 w-20">
        {task.priority && task.priority !== "none" && (
          <Badge variant={priorityVariant[task.priority as TaskPriority] || "default"} className="text-[10px]">
            {priorityLabel[task.priority as TaskPriority] || task.priority}
          </Badge>
        )}
      </div>

      {/* Tags */}
      <div className="flex-shrink-0 flex items-center gap-1 w-36 overflow-hidden">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium truncate"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
            }}
          >
            {tag.name}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>
        )}
      </div>

      {/* Custom fields */}
      {customFieldCells}
    </motion.div>
  );
}
