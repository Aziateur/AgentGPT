"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SubtaskListProps {
  subtasks: Task[];
  onToggleComplete?: (subtaskId: string, completed: boolean) => void;
  onAddSubtask?: (name: string) => void;
  onClickSubtask?: (subtaskId: string) => void;
  onUpdateSubtask?: (subtaskId: string, updates: Partial<Task>) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubtaskList({
  subtasks,
  onToggleComplete,
  onAddSubtask,
  onClickSubtask,
  onUpdateSubtask,
  className,
}: SubtaskListProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  React.useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  React.useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const handleAddSubmit = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onAddSubtask?.(trimmed);
      setNewName("");
      // Keep input focused for rapid entry
      addInputRef.current?.focus();
    } else {
      setIsAdding(false);
      setNewName("");
    }
  };

  const handleEditCommit = (subtaskId: string, originalName: string) => {
    setEditingId(null);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== originalName) {
      onUpdateSubtask?.(subtaskId, { name: trimmed });
    }
    setEditValue("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with progress */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">
            {completedCount}/{totalCount} subtasks
          </span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-px">
        <AnimatePresence initial={false}>
          {subtasks.map((subtask) => (
            <motion.div
              key={subtask.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center gap-2 h-8 px-1 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                size="sm"
                checked={subtask.completed}
                onCheckedChange={(checked) =>
                  onToggleComplete?.(subtask.id, checked === true)
                }
              />
              {editingId === subtask.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleEditCommit(subtask.id, subtask.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditCommit(subtask.id, subtask.name);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditValue("");
                    }
                  }}
                  className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 outline-none border-b border-indigo-400 py-0.5"
                />
              ) : (
                <button
                  onClick={() => onClickSubtask?.(subtask.id)}
                  onDoubleClick={() => {
                    setEditingId(subtask.id);
                    setEditValue(subtask.name);
                  }}
                  className={cn(
                    "flex-1 min-w-0 text-left text-sm truncate transition-colors",
                    subtask.completed
                      ? "line-through text-gray-400"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  {subtask.name}
                </button>
              )}
              {subtask.completed && (
                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add subtask input */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 h-8 px-1"
            >
              <div className="h-4 w-4 rounded-full border-2 border-dashed border-gray-300 flex-shrink-0" />
              <input
                ref={addInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubmit();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewName("");
                  }
                }}
                onBlur={handleAddSubmit}
                placeholder="Subtask name..."
                className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none py-0.5"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add subtask button */}
      {!isAdding && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
          className="text-gray-500 hover:text-gray-700 h-7 px-1"
        >
          Add subtask
        </Button>
      )}
    </div>
  );
}
