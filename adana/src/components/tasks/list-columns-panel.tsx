"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, GripVertical, Plus } from "lucide-react";

export type ColumnKey =
  | "assignee"
  | "due_date"
  | "collaborators"
  | "created_by"
  | "created_on"
  | "last_modified_on"
  | "completed_on"
  | "projects"
  | "tags"
  | "blocked_by"
  | "blocking";

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  assignee: "Assignee",
  due_date: "Due date",
  collaborators: "Collaborators",
  created_by: "Created by",
  created_on: "Created on",
  last_modified_on: "Last modified on",
  completed_on: "Completed on",
  projects: "Projects",
  tags: "Tags",
  blocked_by: "Blocked by",
  blocking: "Blocking",
};

export interface ColumnSetting {
  key: ColumnKey;
  visible: boolean;
}

export const DEFAULT_COLUMNS: ColumnSetting[] = [
  { key: "assignee", visible: true },
  { key: "due_date", visible: true },
  { key: "collaborators", visible: false },
  { key: "created_by", visible: false },
  { key: "created_on", visible: false },
  { key: "last_modified_on", visible: false },
  { key: "completed_on", visible: false },
  { key: "projects", visible: false },
  { key: "tags", visible: true },
  { key: "blocked_by", visible: false },
  { key: "blocking", visible: false },
];

function ColumnRow({
  col,
  onToggle,
}: {
  col: ColumnSetting;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.key,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 text-xs text-gray-700">{COLUMN_LABELS[col.key]}</span>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={col.visible}
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition ${
          col.visible ? "bg-indigo-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full bg-white transition ${
            col.visible ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

interface ColumnsPanelProps {
  columns: ColumnSetting[];
  onChange: (columns: ColumnSetting[]) => void;
  onBack: () => void;
  onAddField: () => void;
}

export function ColumnsPanel({ columns, onChange, onBack, onAddField }: ColumnsPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.key === active.id);
    const newIndex = columns.findIndex((c) => c.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(columns, oldIndex, newIndex));
  }

  function toggleVisible(key: ColumnKey) {
    onChange(columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded p-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h3 className="text-sm font-semibold text-gray-900">Show / hide columns</h3>
        <button
          type="button"
          onClick={onAddField}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columns.map((c) => c.key)} strategy={verticalListSortingStrategy}>
            {columns.map((c) => (
              <ColumnRow key={c.key} col={c} onToggle={() => toggleVisible(c.key)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
