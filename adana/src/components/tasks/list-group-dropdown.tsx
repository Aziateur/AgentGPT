"use client";

import * as React from "react";
import { X, GripVertical, MoreHorizontal, Plus } from "lucide-react";

export type GroupField =
  | "sections"
  | "start_date"
  | "due_date"
  | "assignee"
  | "created_by"
  | "created_on"
  | "last_modified_on"
  | "completed_on"
  | "project"
  | "custom";

export const GROUP_FIELDS: { key: GroupField; label: string }[] = [
  { key: "sections", label: "Sections" },
  { key: "start_date", label: "Start date" },
  { key: "due_date", label: "Due date" },
  { key: "assignee", label: "Assignee" },
  { key: "created_by", label: "Created by" },
  { key: "created_on", label: "Created on" },
  { key: "last_modified_on", label: "Last modified on" },
  { key: "completed_on", label: "Completed on" },
  { key: "project", label: "Project" },
];

export interface GroupSpec {
  id: string;
  field: GroupField;
  customFieldId?: string | null;
  order: "custom" | "asc" | "desc";
}

interface GroupDropdownProps {
  groups: GroupSpec[];
  customFields: { id: string; name: string }[];
  onAdd: (field: GroupField, customFieldId?: string) => void;
  onUpdate: (id: string, patch: Partial<GroupSpec>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function GroupDropdown({
  groups,
  customFields,
  onAdd,
  onUpdate,
  onRemove,
  onClear,
  onClose,
}: GroupDropdownProps) {
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="absolute z-30 mt-1 w-[440px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Groups</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {groups.map((g) => {
          const fieldLabel =
            g.field === "custom"
              ? customFields.find((cf) => cf.id === g.customFieldId)?.name ?? "Custom field"
              : GROUP_FIELDS.find((f) => f.key === g.field)?.label ?? g.field;
          return (
            <div key={g.id} className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-gray-400" />
              <select
                value={g.field === "custom" ? `custom:${g.customFieldId}` : g.field}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.startsWith("custom:")) {
                    onUpdate(g.id, { field: "custom", customFieldId: v.slice("custom:".length) });
                  } else {
                    onUpdate(g.id, { field: v as GroupField, customFieldId: null });
                  }
                }}
                className="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
              >
                {GROUP_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
                {customFields.map((cf) => (
                  <option key={cf.id} value={`custom:${cf.id}`}>{cf.name}</option>
                ))}
              </select>
              <select
                value={g.order}
                onChange={(e) => onUpdate(g.id, { order: e.target.value as GroupSpec["order"] })}
                className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
              >
                <option value="custom">Custom order</option>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-200"
                aria-label="More"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <span className="block text-xs text-gray-500">{fieldLabelFallback(groups)}</span>
      </div>

      <div className="relative mt-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          <Plus className="h-3 w-3" /> Add subgroup
        </button>
        {addOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {GROUP_FIELDS.filter((f) => f.key !== "sections").map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  onAdd(f.key);
                  setAddOpen(false);
                }}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
              >
                {f.label}
              </button>
            ))}
            {customFields.length > 0 && (
              <div className="my-1 h-px bg-gray-100" />
            )}
            {customFields.map((cf) => (
              <button
                key={cf.id}
                type="button"
                onClick={() => {
                  onAdd("custom", cf.id);
                  setAddOpen(false);
                }}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
              >
                {cf.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("adana:open-add-field"));
                setAddOpen(false);
              }}
              className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="h-3 w-3" /> Add custom field
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function fieldLabelFallback(groups: GroupSpec[]): string {
  return groups.length === 0 ? "No groups configured. Tasks render in their natural section order." : "";
}
