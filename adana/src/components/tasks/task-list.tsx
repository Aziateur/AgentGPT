"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";
import { TaskRow } from "./task-row";
import type { Task, User, Tag, CustomFieldDef } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockUsers: Record<string, User> = {
  "demo-user": { id: "demo-user", name: "Demo User", email: "demo@adana.io", avatar: null, role: "admin", timezone: "UTC", theme: "light" },
  "user-2": { id: "user-2", name: "Sarah Chen", email: "sarah@adana.io", avatar: null, role: "member", timezone: "UTC", theme: "light" },
  "user-3": { id: "user-3", name: "Alex Kim", email: "alex@adana.io", avatar: null, role: "member", timezone: "UTC", theme: "light" },
};

// -- Props --------------------------------------------------------------------

export interface TaskListSection {
  id: string;
  name: string;
  tasks: Task[];
}

export interface TaskListProps {
  sections: TaskListSection[];
  tags?: Tag[];
  customFieldDefs?: CustomFieldDef[];
  onTaskClick?: (taskId: string) => void;
  onTaskComplete?: (taskId: string, completed: boolean) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onAddTask?: (sectionId: string) => void;
  onAddSection?: () => void;
  className?: string;
}

// -- Component ----------------------------------------------------------------

export function TaskList({
  sections: initialSections,
  tags = [],
  customFieldDefs = [],
  onTaskClick,
  onTaskComplete,
  onTaskUpdate,
  onAddTask,
  onAddSection,
  className,
}: TaskListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [addingTaskInSection, setAddingTaskInSection] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  function handleAddTask(sectionId: string) {
    if (newTaskName.trim()) {
      onAddTask?.(sectionId);
      setNewTaskName("");
    }
    setAddingTaskInSection(null);
  }

  const getTaskTags = (task: Task) => {
    return (task.tagIds || []).map((id) => tags.find((t) => t.id === id)).filter(Boolean) as Tag[];
  };

  const totalTasks = initialSections.reduce((sum, s) => sum + s.tasks.length, 0);

  return (
    <div className={className}>
      {/* Column headers */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        <div className="w-5" /> {/* drag handle */}
        <div className="w-5" /> {/* checkbox */}
        <div className="min-w-0 flex-1 px-2">Task name</div>
        <div className="w-8 text-center">Assignee</div>
        <div className="w-28">Due date</div>
        <div className="w-20">Priority</div>
        <div className="w-36">Tags</div>
      </div>

      {/* Sections */}
      {initialSections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        const completedCount = section.tasks.filter((t) => t.completed).length;

        return (
          <div key={section.id}>
            {/* Section header */}
            <div className="group flex items-center gap-1 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
              <button
                onClick={() => toggleSection(section.id)}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <GripVertical className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100" />
              <h3 className="text-xs font-semibold text-gray-700">{section.name}</h3>
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                {completedCount}/{section.tasks.length}
              </span>
              <div className="flex-1" />
              <button className="rounded p-0.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Task rows */}
            {!isCollapsed && (
              <>
                {section.tasks.length === 0 ? (
                  <div className="border-b border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
                    No tasks in this section
                  </div>
                ) : (
                  section.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      assignee={task.assigneeId ? mockUsers[task.assigneeId] : null}
                      tags={tags.filter((t) => (task.tagIds || []).includes(t.id))}
                      customFieldDefs={customFieldDefs}
                      onComplete={onTaskComplete}
                      onUpdate={onTaskUpdate}
                      onClick={onTaskClick}
                    />
                  ))
                )}

                {/* Add task input */}
                {addingTaskInSection === section.id ? (
                  <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5">
                    <div className="w-5" />
                    <div className="w-5" />
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTask(section.id);
                        if (e.key === "Escape") setAddingTaskInSection(null);
                      }}
                      onBlur={() => handleAddTask(section.id)}
                      autoFocus
                      placeholder="Task name..."
                      className="min-w-0 flex-1 bg-transparent px-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTaskInSection(section.id)}
                    className="flex w-full items-center gap-1.5 border-b border-gray-100 px-4 py-2 text-xs text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add task...
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Add section */}
      <button
        onClick={onAddSection}
        className="flex w-full items-center gap-1.5 px-4 py-3 text-xs text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
      >
        <Plus className="h-3.5 w-3.5" />
        Add section
      </button>

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">No tasks yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add a task to get started.
          </p>
        </div>
      )}
    </div>
  );
}
