"use client";

import * as React from "react";
import {
  Check,
  Calendar,
  Tag as TagIcon,
  Plus,
  UserPlus,
  Trash2,
  ChevronDown,
  X,
  Sliders,
} from "lucide-react";

interface BulkActionBarProps {
  count: number;
  users: { id: string; name: string }[];
  onClear: () => void;
  onAssign: (userId: string | null) => void;
  onSetDueDate: (date: string | null) => void;
  onAddToProject: () => void;
  onSetCustomField: () => void;
  onAddTags: () => void;
  onMarkComplete: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  count,
  users,
  onClear,
  onAssign,
  onSetDueDate,
  onAddToProject,
  onSetCustomField,
  onAddTags,
  onMarkComplete,
  onDelete,
}: BulkActionBarProps) {
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [dateValue, setDateValue] = React.useState("");

  if (count === 0) return null;

  function btn(
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    onClick: () => void
  ) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-2xl">
        <span className="mr-2 inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
          {count} selected
          <button
            type="button"
            onClick={onClear}
            className="rounded p-0.5 text-indigo-500 hover:bg-indigo-100"
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        </span>

        {/* Assign to */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAssignOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign to
          </button>
          {assignOpen && (
            <div className="absolute bottom-full left-0 mb-2 max-h-64 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
              <button
                type="button"
                onClick={() => { onAssign(null); setAssignOpen(false); }}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
              >
                Unassigned
              </button>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onAssign(u.id); setAssignOpen(false); }}
                  className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                >
                  {u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Set due date */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDateOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            <Calendar className="h-3.5 w-3.5" />
            Set due date
          </button>
          {dateOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="mb-2 w-full rounded border border-gray-200 px-2 py-1 text-xs"
              />
              <div className="flex justify-between gap-1">
                <button
                  type="button"
                  onClick={() => { onSetDueDate(null); setDateOpen(false); }}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => { onSetDueDate(dateValue || null); setDateOpen(false); }}
                  className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {btn("Add to project", Plus, onAddToProject)}
        {btn("Set custom field", Sliders, onSetCustomField)}
        {btn("Add tags", TagIcon, onAddTags)}
        {btn("Mark complete", Check, onMarkComplete)}

        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete ${count} task(s)?`)) onDelete();
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            More <ChevronDown className="h-3 w-3" />
          </button>
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
              >
                Copy summary
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
