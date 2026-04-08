"use client";

import React, { useState, useCallback } from "react";
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
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";
import type { Section, Task, Tag, User } from "@/types";

// ---------------------------------------------------------------------------
// Mock data for visual representation
// ---------------------------------------------------------------------------

const MOCK_USERS: Record<string, User> = {
  u1: { id: "u1", name: "Alice Chen", email: "alice@example.com", avatar: null },
  u2: { id: "u2", name: "Bob Park", email: "bob@example.com", avatar: null },
  u3: { id: "u3", name: "Carol Smith", email: "carol@example.com", avatar: null },
};

const MOCK_TAGS: Record<string, Tag> = {
  tg1: { id: "tg1", name: "Design", color: "#8B5CF6" },
  tg2: { id: "tg2", name: "Engineering", color: "#3B82F6" },
  tg3: { id: "tg3", name: "Bug", color: "#EF4444" },
  tg4: { id: "tg4", name: "Feature", color: "#10B981" },
};

function makeTask(overrides: Partial<Task> & { id: string; title: string; sectionId: string }): Task {
  return {
    description: null,
    htmlDescription: null,
    status: "not_started",
    priority: "none",
    taskType: "task",
    completed: false,
    isTemplate: false,
    completedAt: null,
    assigneeId: null,
    creatorId: "u1",
    projectId: "p1",
    parentTaskId: null,
    position: 0,
    dueDate: null,
    startDate: null,
    estimatedMinutes: null,
    actualMinutes: null,
    tagIds: [],
    followerIds: [],
    subtaskIds: [],
    dependencyIds: [],
    approvalStatus: null,
    approverIds: [],
    likes: [],
    attachmentCount: 0,
    commentCount: 0,
    customFieldValues: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

const MOCK_SECTIONS: Section[] = [
  { id: "s1", name: "To Do", projectId: "p1", position: 0, taskIds: ["t1", "t2", "t3"], createdAt: "" },
  { id: "s2", name: "In Progress", projectId: "p1", position: 1, taskIds: ["t4", "t5"], createdAt: "" },
  { id: "s3", name: "In Review", projectId: "p1", position: 2, taskIds: ["t6"], createdAt: "" },
  { id: "s4", name: "Done", projectId: "p1", position: 3, taskIds: ["t7", "t8"], createdAt: "" },
];

const MOCK_TASKS: Task[] = [
  makeTask({ id: "t1", title: "Design new landing page", sectionId: "s1", priority: "high", assigneeId: "u1", dueDate: "2026-04-10", tagIds: ["tg1"], subtaskIds: ["st1", "st2"], position: 0 } as any),
  makeTask({ id: "t2", title: "Set up CI/CD pipeline", sectionId: "s1", priority: "medium", assigneeId: "u2", tagIds: ["tg2"], position: 1 } as any),
  makeTask({ id: "t3", title: "Write API documentation", sectionId: "s1", priority: "low", dueDate: "2026-04-15", tagIds: ["tg2"], position: 2 } as any),
  makeTask({ id: "t4", title: "Implement auth flow", sectionId: "s2", priority: "high", assigneeId: "u2", dueDate: "2026-04-05", tagIds: ["tg2", "tg4"], subtaskIds: ["st3"], position: 0 } as any),
  makeTask({ id: "t5", title: "Create onboarding screens", sectionId: "s2", priority: "medium", assigneeId: "u1", dueDate: "2026-04-08", tagIds: ["tg1"], position: 1 } as any),
  makeTask({ id: "t6", title: "Fix navigation bug", sectionId: "s3", priority: "high", assigneeId: "u3", tagIds: ["tg3"], position: 0 } as any),
  makeTask({ id: "t7", title: "Database schema v2", sectionId: "s4", priority: "none", assigneeId: "u2", completed: true, completedAt: "2026-03-28", position: 0 } as any),
  makeTask({ id: "t8", title: "Project kickoff meeting", sectionId: "s4", priority: "none", taskType: "milestone", completed: true, completedAt: "2026-03-20", position: 1 } as any),
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoardViewProps {
  sections?: Section[];
  tasks?: Task[];
  users?: Record<string, User>;
  tags?: Record<string, Tag>;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (sectionId: string) => void;
  onAddSection?: () => void;
  onRenameSection?: (sectionId: string, name: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onTaskMove?: (taskId: string, fromSectionId: string, toSectionId: string, newIndex: number) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardView({
  sections: sectionsProp,
  tasks: tasksProp,
  users = MOCK_USERS,
  tags = MOCK_TAGS,
  onTaskClick,
  onAddTask,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onTaskMove,
  className,
}: BoardViewProps) {
  const [sections, setSections] = useState<Section[]>(sectionsProp ?? MOCK_SECTIONS);
  const [tasks, setTasks] = useState<Task[]>(tasksProp ?? MOCK_TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Group tasks by section
  const tasksBySection = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const sec of sections) {
      map[sec.id] = [];
    }
    for (const task of tasks) {
      if (task.sectionId && map[task.sectionId]) {
        map[task.sectionId].push(task);
      }
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [sections, tasks]);

  // DnD sensors
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

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const draggedTask = tasks.find((t) => t.id === activeId);
      if (!draggedTask) return;

      let destinationSectionId: string | null = null;
      const overSection = sections.find((s) => s.id === overId);
      if (overSection) {
        destinationSectionId = overSection.id;
      } else {
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) destinationSectionId = overTask.sectionId || null;
      }

      if (destinationSectionId && draggedTask.sectionId !== destinationSectionId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? ({ ...t, sectionId: destinationSectionId || null } as any) : t
          )
        );
      }
    },
    [tasks, sections]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      setTasks((prev) => {
        const movedTask = prev.find((t) => t.id === activeId);
        if (!movedTask || !movedTask.sectionId) return prev;

        const sectionTasks = prev
          .filter((t) => t.sectionId === movedTask.sectionId)
          .sort((a, b) => a.position - b.position);

        const oldIndex = sectionTasks.findIndex((t) => t.id === activeId);
        const newIndex = sectionTasks.findIndex((t) => t.id === overId);

        if (oldIndex === -1 || newIndex === -1) return prev;

        const reordered = arrayMove(sectionTasks, oldIndex, newIndex);
        const reorderedIds = new Set(reordered.map((t) => t.id));

        return prev.map((t) => {
          if (reorderedIds.has(t.id)) {
            const idx = reordered.findIndex((r) => r.id === t.id);
            return { ...t, position: idx };
          }
          return t;
        });
      });

      const movedTask = tasks.find((t) => t.id === activeId);
      if (movedTask && onTaskMove) {
        const overTask = tasks.find((t) => t.id === overId);
        const toSection = overTask?.sectionId ?? overId;
        const sectionTasks = tasks.filter((t) => t.sectionId === toSection);
        const newIdx = sectionTasks.findIndex((t) => t.id === overId);
        onTaskMove(activeId, movedTask.sectionId ?? "", toSection, Math.max(newIdx, 0));
      }
    },
    [tasks, onTaskMove]
  );

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
          items={sections.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {sections.map((section) => (
            <BoardColumn
              key={section.id}
              section={section}
              tasks={tasksBySection[section.id] ?? []}
              users={users}
              tags={tags}
              onAddTask={onAddTask}
              onTaskClick={onTaskClick}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
            />
          ))}
        </SortableContext>

        {/* Add section column */}
        <div className="flex w-72 flex-shrink-0 items-start">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50"
            onClick={onAddSection}
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
              assignee={activeTask.assigneeId ? users[activeTask.assigneeId] : null}
              tags={((activeTask as any).tagIds || []).map((id: string) => tags[id]).filter(Boolean)}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
