"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";
import type { Task, User, Tag } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoardViewProps {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (sectionId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardView({
  projectId,
  onTaskClick,
  onAddTask,
  className,
}: BoardViewProps) {
  // -- Store selectors ------------------------------------------------------
  const allSections = useAppStore((s) => s.sections);
  const allTasks = useAppStore((s) => s.tasks);
  const sections = React.useMemo(
    () => allSections.filter((x: any) => x.projectId === projectId),
    [allSections, projectId]
  );
  const tasks = React.useMemo(
    () => allTasks.filter((t: any) => t.projectId === projectId && !t.parentId && !t.deletedAt),
    [allTasks, projectId]
  );
  const storeUsers = useAppStore((s) => s.users);
  const storeTags = useAppStore((s) => s.tags);
  const storeTaskTags = useAppStore((s) => s.taskTags);

  const updateTask = useAppStore((s) => s.updateTask);
  const createSection = useAppStore((s) => s.createSection);
  const createTask = useAppStore((s) => s.createTask);
  const updateSection = useAppStore((s) => s.updateSection);
  const deleteSection = useAppStore((s) => s.deleteSection);

  // -- Local state ----------------------------------------------------------
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // -- Derived maps ---------------------------------------------------------
  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.position - b.position),
    [sections]
  );

  const usersById = useMemo<Record<string, User>>(() => {
    const map: Record<string, User> = {};
    for (const u of storeUsers) map[u.id] = u;
    return map;
  }, [storeUsers]);

  const tagsById = useMemo<Record<string, Tag>>(() => {
    const map: Record<string, Tag> = {};
    for (const t of storeTags) {
      map[t.id] = { id: t.id, name: t.name, color: t.color };
    }
    return map;
  }, [storeTags]);

  // taskId -> Tag[] (filtered via taskTags join table)
  const tagsByTaskId = useMemo<Record<string, Tag[]>>(() => {
    const map: Record<string, Tag[]> = {};
    for (const link of storeTaskTags) {
      const tag = tagsById[link.tagId];
      if (!tag) continue;
      (map[link.taskId] ||= []).push(tag);
    }
    return map;
  }, [storeTaskTags, tagsById]);

  // Group tasks by section (sorted by position)
  const tasksBySection = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const sec of sortedSections) map[sec.id] = [];
    for (const task of tasks) {
      if (task.sectionId && map[task.sectionId]) {
        map[task.sectionId].push(task);
      }
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [sortedSections, tasks]);

  // -- DnD ------------------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  // Move task between columns on the fly (persists on drop)
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const draggedTask = tasks.find((t) => t.id === activeId);
      if (!draggedTask) return;

      let destinationSectionId: string | null = null;
      const overSection = sortedSections.find((s) => s.id === overId);
      if (overSection) {
        destinationSectionId = overSection.id;
      } else {
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) destinationSectionId = overTask.sectionId || null;
      }

      if (
        destinationSectionId &&
        draggedTask.sectionId !== destinationSectionId
      ) {
        // Optimistic visual move — drop handler will persist final pos
        updateTask(activeId, { sectionId: destinationSectionId });
      }
    },
    [tasks, sortedSections, updateTask]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const movedTask = tasks.find((t) => t.id === activeId);
      if (!movedTask) return;

      // Determine destination section
      let toSectionId: string | null = null;
      const overSection = sortedSections.find((s) => s.id === overId);
      if (overSection) {
        toSectionId = overSection.id;
      } else {
        const overTask = tasks.find((t) => t.id === overId);
        toSectionId = overTask?.sectionId ?? movedTask.sectionId ?? null;
      }
      if (!toSectionId) return;

      // Compute new position within destination section
      const destTasks = tasks
        .filter((t) => t.sectionId === toSectionId && t.id !== activeId)
        .sort((a, b) => a.position - b.position);

      let newIndex = destTasks.length;
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && overTask.sectionId === toSectionId) {
        newIndex = destTasks.findIndex((t) => t.id === overId);
        if (newIndex < 0) newIndex = destTasks.length;
      }

      // Reorder the destination list with the moved task inserted at newIndex
      const reordered = [...destTasks];
      reordered.splice(newIndex, 0, { ...movedTask, sectionId: toSectionId });

      // Persist updated positions (and sectionId for moved task)
      reordered.forEach((t, idx) => {
        if (t.id === activeId) {
          updateTask(t.id, { sectionId: toSectionId, position: idx });
        } else if (t.position !== idx) {
          updateTask(t.id, { position: idx });
        }
      });
    },
    [tasks, sortedSections, updateTask]
  );

  // -- Section handlers -----------------------------------------------------
  const handleAddSection = useCallback(async () => {
    const name = typeof window !== "undefined" ? window.prompt("Section name:") : null;
    if (!name?.trim()) return;
    await createSection({ name: name.trim(), projectId });
  }, [createSection, projectId]);

  const handleRenameSection = useCallback(
    (sectionId: string, name: string) => {
      updateSection(sectionId, name);
    },
    [updateSection]
  );

  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      deleteSection(sectionId);
    },
    [deleteSection]
  );

  const defaultOnAddTask = useCallback(
    async (sectionId: string) => {
      const title =
        typeof window !== "undefined" ? window.prompt("Task name:") : null;
      if (!title?.trim()) return;
      await createTask({
        title: title.trim(),
        projectId,
        sectionId,
      });
    },
    [createTask, projectId]
  );

  const addTaskHandler = onAddTask ?? defaultOnAddTask;

  const toggleCollapsed = useCallback((sectionId: string) => {
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  // -- Render ---------------------------------------------------------------
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex h-full gap-4 overflow-x-auto p-4 pb-6", className)}>
        <SortableContext
          items={sortedSections.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {sortedSections.map((section) => {
            const colTasks = tasksBySection[section.id] ?? [];
            const wipLimit = (section as any).wipLimit as number | undefined;
            const overLimit =
              typeof wipLimit === "number" && wipLimit > 0 && colTasks.length > wipLimit;
            const isCollapsed = !!collapsed[section.id];

            return (
              <div key={section.id} className="flex flex-col">
                {overLimit && (
                  <div className="mb-1 w-72 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                    Over WIP limit ({colTasks.length}/{wipLimit})
                  </div>
                )}
                {isCollapsed ? (
                  <button
                    onClick={() => toggleCollapsed(section.id)}
                    className={cn(
                      "flex w-12 h-40 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100",
                      overLimit && "border-red-300 text-red-600"
                    )}
                    title={`${section.name} (${colTasks.length})`}
                  >
                    <span className="[writing-mode:vertical-rl] rotate-180">
                      {section.name} · {colTasks.length}
                    </span>
                  </button>
                ) : (
                  <div className="relative">
                    <BoardColumn
                      section={section}
                      tasks={colTasks}
                      users={usersById}
                      tags={tagsById}
                      onAddTask={addTaskHandler}
                      onTaskClick={onTaskClick}
                      onRenameSection={handleRenameSection}
                      onDeleteSection={handleDeleteSection}
                      className={overLimit ? "ring-1 ring-red-400" : undefined}
                    />
                    {overLimit && (
                      <div className="pointer-events-none absolute inset-x-3 top-2 h-[2px] rounded bg-red-500/70" />
                    )}
                    <button
                      onClick={() => toggleCollapsed(section.id)}
                      className="absolute right-10 top-2 z-10 rounded px-1 text-[11px] text-gray-400 hover:text-gray-700"
                      title="Collapse column"
                    >
                      {"<<"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </SortableContext>

        {/* Add section column */}
        <div className="flex w-72 flex-shrink-0 items-start">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50"
            onClick={handleAddSection}
          >
            <Plus className="h-5 w-5" />
            Add section
          </Button>
        </div>
      </div>

      {/* Drag overlay (floating card) */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="rotate-2 opacity-90">
            <BoardCard
              task={activeTask}
              assignee={
                activeTask.assigneeId ? usersById[activeTask.assigneeId] : null
              }
              tags={tagsByTaskId[activeTask.id] ?? []}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
