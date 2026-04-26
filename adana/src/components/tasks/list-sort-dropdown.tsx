"use client";

import * as React from "react";
import { X, ArrowUp, ArrowDown } from "lucide-react";

export type SortField =
  | "start_date"
  | "due_date"
  | "assignee"
  | "created_by"
  | "created_on"
  | "last_modified_on"
  | "completed_on"
  | "likes"
  | "alphabetical"
  | "project"
  | null;

export const SORT_FIELDS: { key: NonNullable<SortField>; label: string }[] = [
  { key: "start_date", label: "Start date" },
  { key: "due_date", label: "Due date" },
  { key: "assignee", label: "Assignee" },
  { key: "created_by", label: "Created by" },
  { key: "created_on", label: "Created on" },
  { key: "last_modified_on", label: "Last modified on" },
  { key: "completed_on", label: "Completed on" },
  { key: "likes", label: "Likes" },
  { key: "alphabetical", label: "Alphabetical" },
  { key: "project", label: "Project" },
];

interface SortDropdownProps {
  field: SortField;
  direction: "asc" | "desc";
  onChange: (field: SortField, direction: "asc" | "desc") => void;
  onClear: () => void;
  onClose: () => void;
}

export function SortDropdown({ field, direction, onChange, onClear, onClose }: SortDropdownProps) {
  return (
    <div className="absolute z-30 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
      <div className="mb-1 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-900">Sort by</h3>
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
      <div className="max-h-64 overflow-y-auto">
        {SORT_FIELDS.map((f) => {
          const active = field === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onChange(f.key, active ? direction : "asc")}
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
                active ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.label}
              {active && <span className="text-indigo-600">✓</span>}
            </button>
          );
        })}
      </div>
      {field && (
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="px-1 text-[11px] uppercase tracking-wide text-gray-500">Direction</span>
          <div className="flex overflow-hidden rounded-md border border-gray-200">
            <button
              type="button"
              onClick={() => onChange(field, "asc")}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs ${
                direction === "asc" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ArrowUp className="h-3 w-3" /> Asc
            </button>
            <button
              type="button"
              onClick={() => onChange(field, "desc")}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs ${
                direction === "desc" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ArrowDown className="h-3 w-3" /> Desc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
