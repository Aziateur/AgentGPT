"use client";

import * as React from "react";
import {
  Filter,
  ArrowUpDown,
  LayoutGrid,
  X,
  Calendar,
  User as UserIcon,
  Flag,
  CheckCircle2,
  Tag as TagIcon,
  Columns3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/dropdown";
import type { User, Tag, TaskPriority, CustomFieldDef } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortField = "due_date" | "priority" | "assignee" | "created_date" | "name";
export type SortDirection = "asc" | "desc";
export type GroupByField = "section" | "assignee" | "priority" | "due_date" | "none";
export type CompletionFilter = "all" | "incomplete" | "complete";
export type DueDateFilter = "any" | "overdue" | "today" | "this_week" | "no_date";

export interface TaskFilters {
  assigneeIds: string[];
  dueDate: DueDateFilter;
  priorities: TaskPriority[];
  completion: CompletionFilter;
  tagIds: string[];
  customFieldFilters: Record<string, string>;
}

export interface TaskSort {
  field: SortField;
  direction: SortDirection;
}

export interface TaskFilterBarProps {
  filters: TaskFilters;
  sort: TaskSort;
  groupBy: GroupByField;
  users?: User[];
  tags?: Tag[];
  customFieldDefs?: CustomFieldDef[];
  onFiltersChange?: (filters: TaskFilters) => void;
  onSortChange?: (sort: TaskSort) => void;
  onGroupByChange?: (groupBy: GroupByField) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const defaultFilters: TaskFilters = {
  assigneeIds: [],
  dueDate: "any",
  priorities: [],
  completion: "all",
  tagIds: [],
  customFieldFilters: {},
};

export const defaultSort: TaskSort = {
  field: "created_date",
  direction: "asc",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sortFieldLabels: Record<SortField, string> = {
  due_date: "Due date",
  priority: "Priority",
  assignee: "Assignee",
  created_date: "Created date",
  name: "Name",
};

const groupByLabels: Record<GroupByField, string> = {
  section: "Section",
  assignee: "Assignee",
  priority: "Priority",
  due_date: "Due date",
  none: "None",
};

const dueDateLabels: Record<DueDateFilter, string> = {
  any: "Any date",
  overdue: "Overdue",
  today: "Due today",
  this_week: "Due this week",
  no_date: "No due date",
};

const completionLabels: Record<CompletionFilter, string> = {
  all: "All tasks",
  incomplete: "Incomplete",
  complete: "Completed",
};

const priorityLabels: Record<TaskPriority, string> = {
  none: "No priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};

function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.assigneeIds.length > 0 ||
    filters.dueDate !== "any" ||
    filters.priorities.length > 0 ||
    filters.completion !== "all" ||
    filters.tagIds.length > 0 ||
    Object.keys(filters.customFieldFilters).length > 0
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskFilterBar({
  filters,
  sort,
  groupBy,
  users = [],
  tags = [],
  customFieldDefs = [],
  onFiltersChange,
  onSortChange,
  onGroupByChange,
  className,
}: TaskFilterBarProps) {
  const isFiltered = hasActiveFilters(filters);

  const updateFilters = (patch: Partial<TaskFilters>) => {
    onFiltersChange?.({ ...filters, ...patch });
  };

  const toggleArrayFilter = <T extends string>(
    current: T[],
    value: T,
    key: keyof TaskFilters
  ) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters({ [key]: next } as Partial<TaskFilters>);
  };

  // Count active filter badges
  const activeFilterBadges: { label: string; onRemove: () => void }[] = [];

  if (filters.completion !== "all") {
    activeFilterBadges.push({
      label: completionLabels[filters.completion],
      onRemove: () => updateFilters({ completion: "all" }),
    });
  }
  if (filters.dueDate !== "any") {
    activeFilterBadges.push({
      label: dueDateLabels[filters.dueDate],
      onRemove: () => updateFilters({ dueDate: "any" }),
    });
  }
  filters.priorities.forEach((p) => {
    activeFilterBadges.push({
      label: `Priority: ${priorityLabels[p]}`,
      onRemove: () =>
        updateFilters({
          priorities: filters.priorities.filter((x) => x !== p),
        }),
    });
  });
  filters.assigneeIds.forEach((id) => {
    const user = users.find((u) => u.id === id);
    activeFilterBadges.push({
      label: `Assignee: ${user?.name || id}`,
      onRemove: () =>
        updateFilters({
          assigneeIds: filters.assigneeIds.filter((x) => x !== id),
        }),
    });
  });
  filters.tagIds.forEach((id) => {
    const tag = tags.find((t) => t.id === id);
    activeFilterBadges.push({
      label: `Tag: ${tag?.name || id}`,
      onRemove: () =>
        updateFilters({
          tagIds: filters.tagIds.filter((x) => x !== id),
        }),
    });
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownTrigger asChild>
            <Button
              variant={isFiltered ? "primary" : "ghost"}
              size="sm"
              icon={<Filter className="h-3.5 w-3.5" />}
            >
              Filter
            </Button>
          </DropdownTrigger>
          <DropdownContent align="start" className="w-56">
            {/* Completion status */}
            <DropdownLabel>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" /> Completion
              </span>
            </DropdownLabel>
            {(Object.keys(completionLabels) as CompletionFilter[]).map((val) => (
              <DropdownItem
                key={val}
                onSelect={() => updateFilters({ completion: val })}
                className={cn(filters.completion === val && "bg-indigo-50 text-indigo-700")}
              >
                {completionLabels[val]}
              </DropdownItem>
            ))}

            <DropdownSeparator />

            {/* Due date */}
            <DropdownLabel>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Due date
              </span>
            </DropdownLabel>
            {(Object.keys(dueDateLabels) as DueDateFilter[]).map((val) => (
              <DropdownItem
                key={val}
                onSelect={() => updateFilters({ dueDate: val })}
                className={cn(filters.dueDate === val && "bg-indigo-50 text-indigo-700")}
              >
                {dueDateLabels[val]}
              </DropdownItem>
            ))}

            <DropdownSeparator />

            {/* Priority */}
            <DropdownLabel>
              <span className="flex items-center gap-1.5">
                <Flag className="h-3 w-3" /> Priority
              </span>
            </DropdownLabel>
            {(Object.keys(priorityLabels) as TaskPriority[]).map((val) => (
              <DropdownItem
                key={val}
                onSelect={() => toggleArrayFilter(filters.priorities, val, "priorities")}
                className={cn(
                  filters.priorities.includes(val) && "bg-indigo-50 text-indigo-700"
                )}
              >
                {priorityLabels[val]}
                {filters.priorities.includes(val) && (
                  <span className="ml-auto text-indigo-500 text-xs">&#10003;</span>
                )}
              </DropdownItem>
            ))}

            {/* Assignee */}
            {users.length > 0 && (
              <>
                <DropdownSeparator />
                <DropdownLabel>
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="h-3 w-3" /> Assignee
                  </span>
                </DropdownLabel>
                {users.slice(0, 10).map((user) => (
                  <DropdownItem
                    key={user.id}
                    onSelect={() =>
                      toggleArrayFilter(filters.assigneeIds, user.id, "assigneeIds")
                    }
                    className={cn(
                      filters.assigneeIds.includes(user.id) &&
                        "bg-indigo-50 text-indigo-700"
                    )}
                  >
                    {user.name}
                    {filters.assigneeIds.includes(user.id) && (
                      <span className="ml-auto text-indigo-500 text-xs">&#10003;</span>
                    )}
                  </DropdownItem>
                ))}
              </>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <>
                <DropdownSeparator />
                <DropdownLabel>
                  <span className="flex items-center gap-1.5">
                    <TagIcon className="h-3 w-3" /> Tags
                  </span>
                </DropdownLabel>
                {tags.slice(0, 10).map((tag) => (
                  <DropdownItem
                    key={tag.id}
                    onSelect={() =>
                      toggleArrayFilter(filters.tagIds, tag.id, "tagIds")
                    }
                    className={cn(
                      filters.tagIds.includes(tag.id) && "bg-indigo-50 text-indigo-700"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    {filters.tagIds.includes(tag.id) && (
                      <span className="ml-auto text-indigo-500 text-xs">&#10003;</span>
                    )}
                  </DropdownItem>
                ))}
              </>
            )}
          </DropdownContent>
        </DropdownMenu>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowUpDown className="h-3.5 w-3.5" />}
            >
              Sort
            </Button>
          </DropdownTrigger>
          <DropdownContent align="start" className="w-48">
            <DropdownLabel>Sort by</DropdownLabel>
            {(Object.keys(sortFieldLabels) as SortField[]).map((field) => (
              <DropdownItem
                key={field}
                onSelect={() =>
                  onSortChange?.({
                    field,
                    direction:
                      sort.field === field && sort.direction === "asc"
                        ? "desc"
                        : "asc",
                  })
                }
                className={cn(sort.field === field && "bg-indigo-50 text-indigo-700")}
              >
                {sortFieldLabels[field]}
                {sort.field === field && (
                  <span className="ml-auto text-[10px] text-indigo-500">
                    {sort.direction === "asc" ? "ASC" : "DESC"}
                  </span>
                )}
              </DropdownItem>
            ))}
          </DropdownContent>
        </DropdownMenu>

        {/* Group by dropdown */}
        <DropdownMenu>
          <DropdownTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              icon={<LayoutGrid className="h-3.5 w-3.5" />}
            >
              Group
            </Button>
          </DropdownTrigger>
          <DropdownContent align="start" className="w-44">
            <DropdownLabel>Group by</DropdownLabel>
            {(Object.keys(groupByLabels) as GroupByField[]).map((field) => (
              <DropdownItem
                key={field}
                onSelect={() => onGroupByChange?.(field)}
                className={cn(groupBy === field && "bg-indigo-50 text-indigo-700")}
              >
                {field === "section" && <Columns3 className="h-3.5 w-3.5" />}
                {field === "assignee" && <UserIcon className="h-3.5 w-3.5" />}
                {field === "priority" && <Flag className="h-3.5 w-3.5" />}
                {field === "due_date" && <Calendar className="h-3.5 w-3.5" />}
                {groupByLabels[field]}
              </DropdownItem>
            ))}
          </DropdownContent>
        </DropdownMenu>

        {/* Clear filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange?.(defaultFilters)}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterBadges.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeFilterBadges.map((badge, i) => (
            <Badge key={i} variant="info" className="gap-1 pr-1">
              {badge.label}
              <button
                onClick={badge.onRemove}
                className="ml-0.5 rounded-full p-0.5 hover:bg-sky-200 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
