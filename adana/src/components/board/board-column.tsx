"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { BoardCard } from "./board-card";
import type { Section, Task, Tag, User } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoardColumnProps {
  section: Section;
  tasks: Task[];
  users: Record<string, User>;
  tags: Record<string, Tag>;
  onAddTask?: (sectionId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onRenameSection?: (sectionId: string, name: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardColumn({
  section,
  tasks,
  users,
  tags,
  onAddTask,
  onTaskClick,
  onRenameSection,
  onDeleteSection,
  className,
}: BoardColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: { type: "section", section },
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== section.name) {
      onRenameSection?.(section.id, trimmed);
    } else {
      setEditName(section.name);
    }
    setIsEditing(false);
  };

  return (
    <div className={cn("flex w-72 flex-shrink-0 flex-col rounded-xl bg-gray-50 border border-gray-200", className)}>
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setEditName(section.name);
                  setIsEditing(false);
                }
              }}
              className="w-full rounded border border-indigo-300 bg-white px-1.5 py-0.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <h3
              className="truncate text-sm font-semibold text-gray-900 cursor-pointer"
              onDoubleClick={() => setIsEditing(true)}
            >
              {section.name}
            </h3>
          )}
          <span className="flex-shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={() => onAddTask?.(section.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                Rename section
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem destructive onClick={() => onDeleteSection?.(section.id)}>
                <Trash2 className="h-4 w-4" />
                Delete section
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Droppable task list */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3 pt-1 transition-colors",
          "min-h-[80px]",
          isOver && "bg-indigo-50/60 rounded-b-xl"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <BoardCard
                key={task.id}
                task={task}
                assignee={task.assigneeId ? users[task.assigneeId] : null}
                tags={task.tagIds.map((id) => tags[id]).filter(Boolean)}
                onClick={onTaskClick}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Inline add button when empty */}
        {tasks.length === 0 && (
          <button
            className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 py-6 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
            onClick={() => onAddTask?.(section.id)}
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        )}
      </div>

      {/* Bottom add task */}
      {tasks.length > 0 && (
        <button
          className="flex items-center gap-1 border-t border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-b-xl"
          onClick={() => onAddTask?.(section.id)}
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      )}
    </div>
  );
}
