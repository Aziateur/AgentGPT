"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
} from "lucide-react";
import { TaskRow } from "./task-row";
import { useAppStore } from "@/store/app-store";
import type { Task, Tag, CustomFieldDef } from "@/types";

// -- Props --------------------------------------------------------------------

export interface TaskListProps {
  projectId: string;
  tags?: Tag[];
  customFieldDefs?: CustomFieldDef[];
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

type GroupBy = "none" | "section" | "assignee" | "priority" | "due";

const GROUP_CYCLE: GroupBy[] = ["none", "section", "assignee", "priority", "due"];

const GROUP_LABEL: Record<GroupBy, string> = {
  none: "None",
  section: "Section",
  assignee: "Assignee",
  priority: "Priority",
  due: "Due date",
};

// -- Grouping -----------------------------------------------------------------

interface Group {
  id: string;
  name: string;
  tasks: Task[];
}

function dueBucket(task: Task): { id: string; name: string } {
  if (!task.dueDate) return { id: "no-date", name: "No due date" };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(task.dueDate);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { id: "overdue", name: "Overdue" };
  if (diffDays === 0) return { id: "today", name: "Today" };
  if (diffDays <= 7) return { id: "this-week", name: "This week" };
  if (diffDays <= 30) return { id: "this-month", name: "This month" };
  return { id: "later", name: "Later" };
}

function computeGroups(
  rootTasks: Task[],
  groupBy: GroupBy,
  sections: { id: string; name: string }[],
  users: { id: string; name: string }[]
): Group[] {
  if (groupBy === "none") {
    return [{ id: "all", name: "All tasks", tasks: rootTasks }];
  }

  const map = new Map<string, Group>();
  const ensure = (id: string, name: string) => {
    if (!map.has(id)) map.set(id, { id, name, tasks: [] });
    return map.get(id)!;
  };

  if (groupBy === "section") {
    ensure("__none", "No section");
    for (const s of sections) ensure(s.id, s.name);
    for (const t of rootTasks) {
      ensure(t.sectionId || "__none", "").tasks.push(t);
    }
  } else if (groupBy === "assignee") {
    for (const t of rootTasks) {
      const id = t.assigneeId || "__unassigned";
      const name = t.assigneeId
        ? users.find((u) => u.id === t.assigneeId)?.name || "Unknown"
        : "Unassigned";
      ensure(id, name).tasks.push(t);
    }
  } else if (groupBy === "priority") {
    const order = ["high", "medium", "low", "none"];
    for (const p of order) ensure(p, p === "none" ? "No priority" : p[0].toUpperCase() + p.slice(1));
    for (const t of rootTasks) {
      const p = (t.priority as string) || "none";
      ensure(p, p).tasks.push(t);
    }
  } else if (groupBy === "due") {
    for (const t of rootTasks) {
      const b = dueBucket(t);
      ensure(b.id, b.name).tasks.push(t);
    }
  }

  return Array.from(map.values()).filter((g) => g.tasks.length > 0 || groupBy === "section");
}

// -- Component ----------------------------------------------------------------

export function TaskList({
  projectId,
  tags = [],
  customFieldDefs = [],
  onTaskClick,
  className,
}: TaskListProps) {
  const allTasks = useAppStore((s) => s.tasks);
  const sections = useAppStore((s) => s.getProjectSections(projectId));
  const users = useAppStore((s) => s.users);
  const updateTask = useAppStore((s) => s.updateTask);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const createTask = useAppStore((s) => s.createTask);

  const [groupBy, setGroupBy] = useState<GroupBy>("section");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // All project tasks (including subtasks) — we'll render tree manually
  const projectTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId),
    [allTasks, projectId]
  );
  const rootTasks = useMemo(
    () => projectTasks.filter((t) => !t.parentId),
    [projectTasks]
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of projectTasks) {
      if (t.parentId) {
        if (!map.has(t.parentId)) map.set(t.parentId, []);
        map.get(t.parentId)!.push(t);
      }
    }
    return map;
  }, [projectTasks]);

  const groups = useMemo(
    () => computeGroups(rootTasks, groupBy, sections, users),
    [rootTasks, groupBy, sections, users]
  );

  function toggleGroup(id: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTask(id: string) {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function cycleGroupBy() {
    const idx = GROUP_CYCLE.indexOf(groupBy);
    setGroupBy(GROUP_CYCLE[(idx + 1) % GROUP_CYCLE.length]);
  }

  async function handleAddTask() {
    await createTask({ projectId, title: "New task" } as any);
  }

  function getAssignee(assigneeId: string | null) {
    if (!assigneeId) return null;
    return (users as any[]).find((u) => u.id === assigneeId) ?? null;
  }

  function renderTaskTree(task: Task, depth: number): React.ReactNode {
    const children = childrenByParent.get(task.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const taskTags = tags.filter((t) => (task.tagIds || []).includes(t.id));

    return (
      <div key={task.id}>
        <div className={`flex items-center ${depth > 0 ? `pl-${Math.min(depth * 6, 24)}` : ""}`} style={depth > 0 ? { paddingLeft: depth * 24 } : undefined}>
          <button
            onClick={() => hasChildren && toggleTask(task.id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 ${
              hasChildren ? "hover:bg-gray-200 hover:text-gray-700" : "invisible"
            }`}
            aria-label="Toggle subtasks"
          >
            {hasChildren && (isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            ))}
          </button>
          <div className="min-w-0 flex-1">
            <TaskRow
              task={task}
              assignee={getAssignee(task.assigneeId ?? null) as any}
              tags={taskTags}
              customFieldDefs={customFieldDefs}
              onComplete={(id) => toggleTaskComplete(id)}
              onUpdate={(id, updates) => updateTask(id, updates as Partial<Task>)}
              onClick={onTaskClick}
            />
          </div>
        </div>
        {hasChildren && isExpanded && (
          <>{children.map((c) => renderTaskTree(c, depth + 1))}</>
        )}
      </div>
    );
  }

  const totalTasks = rootTasks.length;

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <button
          onClick={cycleGroupBy}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Layers className="h-3.5 w-3.5" />
          Group: {GROUP_LABEL[groupBy]}
        </button>
        <div className="flex-1" />
        <button
          onClick={handleAddTask}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        <div className="w-5" /> {/* chevron */}
        <div className="min-w-0 flex-1 px-2">Task name</div>
        <div className="w-8 text-center">Assignee</div>
        <div className="w-28">Due date</div>
        <div className="w-20">Priority</div>
        <div className="w-36">Tags</div>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        const completedCount = group.tasks.filter((t) => t.completed).length;

        return (
          <div key={group.id}>
            <div className="group flex items-center gap-1 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
              <button
                onClick={() => toggleGroup(group.id)}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <h3 className="text-xs font-semibold text-gray-700">{group.name}</h3>
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                {completedCount}/{group.tasks.length}
              </span>
            </div>

            {!isCollapsed && (
              <>
                {group.tasks.length === 0 ? (
                  <div className="border-b border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
                    No tasks
                  </div>
                ) : (
                  group.tasks.map((t) => renderTaskTree(t, 0))
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">No tasks yet</p>
          <p className="mt-1 text-sm text-gray-500">Click &quot;Add task&quot; to get started.</p>
        </div>
      )}
    </div>
  );
}
