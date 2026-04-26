"use client";

import * as React from "react";
import { ChevronRight, Plus, X } from "lucide-react";

// ----- Types --------------------------------------------------------------

export type QuickFilterKey =
  | "incomplete"
  | "completed"
  | "completed_today"
  | "completed_yesterday"
  | "completed_this_week"
  | "just_my_tasks"
  | "due_this_week"
  | "due_next_week"
  | "overdue"
  | "high_priority";

export interface AdvancedFilter {
  id: string;
  field: string;
  operator: string;
  value?: unknown;
}

export const ADVANCED_FIELDS: { key: string; label: string }[] = [
  { key: "completion_status", label: "Completion status" },
  { key: "assignee", label: "Assignee" },
  { key: "start_date", label: "Start date" },
  { key: "due_date", label: "Due date" },
  { key: "created_by", label: "Created by" },
  { key: "created_on", label: "Created on" },
  { key: "last_modified_on", label: "Last modified on" },
  { key: "completed_on", label: "Completed on" },
  { key: "task_type", label: "Task type" },
];

export const QUICK_FILTER_TOP: { key: QuickFilterKey; label: string }[] = [
  { key: "incomplete", label: "Incomplete tasks" },
];

export const COMPLETED_SUBOPTIONS: { key: QuickFilterKey; label: string }[] = [
  { key: "completed_today", label: "Completed today" },
  { key: "completed_yesterday", label: "Completed yesterday" },
  { key: "completed_this_week", label: "Completed this week" },
];

export const QUICK_FILTER_REST: { key: QuickFilterKey; label: string }[] = [
  { key: "just_my_tasks", label: "Just my tasks" },
  { key: "due_this_week", label: "Due this week" },
  { key: "due_next_week", label: "Due next week" },
  { key: "overdue", label: "Overdue" },
  { key: "high_priority", label: "High priority" },
];

// ----- Operators per field ------------------------------------------------

function operatorsFor(field: string): { value: string; label: string }[] {
  switch (field) {
    case "completion_status":
    case "task_type":
      return [
        { value: "eq", label: "is" },
        { value: "neq", label: "is not" },
      ];
    case "assignee":
    case "created_by":
      return [
        { value: "eq", label: "is" },
        { value: "neq", label: "is not" },
        { value: "is_null", label: "is empty" },
      ];
    case "start_date":
    case "due_date":
    case "created_on":
    case "last_modified_on":
    case "completed_on":
      return [
        { value: "eq", label: "is" },
        { value: "lt", label: "before" },
        { value: "gt", label: "after" },
        { value: "is_null", label: "is empty" },
      ];
    default:
      return [
        { value: "eq", label: "is" },
        { value: "neq", label: "is not" },
      ];
  }
}

interface FilterDropdownProps {
  active: Set<QuickFilterKey>;
  onToggle: (k: QuickFilterKey) => void;
  advanced: AdvancedFilter[];
  onAddAdvanced: (field: string) => void;
  onUpdateAdvanced: (id: string, patch: Partial<AdvancedFilter>) => void;
  onRemoveAdvanced: (id: string) => void;
  onClear: () => void;
  users?: { id: string; name: string }[];
  onClose: () => void;
}

export function FilterDropdown({
  active,
  onToggle,
  advanced,
  onAddAdvanced,
  onUpdateAdvanced,
  onRemoveAdvanced,
  onClear,
  users = [],
  onClose,
}: FilterDropdownProps) {
  const [completedOpen, setCompletedOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  const completedActive =
    active.has("completed") ||
    active.has("completed_today") ||
    active.has("completed_yesterday") ||
    active.has("completed_this_week");

  function chip(label: string, isActive: boolean, onClick: () => void, withChevron = false) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
          isActive
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {label}
        {withChevron && <ChevronRight className="h-3 w-3" />}
      </button>
    );
  }

  return (
    <div className="absolute z-30 mt-1 w-[420px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
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

      <div className="flex flex-wrap items-center gap-1.5">
        {chip("Incomplete tasks", active.has("incomplete"), () => onToggle("incomplete"))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCompletedOpen((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
              completedActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed tasks <ChevronRight className="h-3 w-3" />
          </button>
          {completedOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => onToggle("completed")}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
                  active.has("completed") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Completed tasks (any)
                {active.has("completed") && <span className="text-indigo-600">✓</span>}
              </button>
              {COMPLETED_SUBOPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onToggle(s.key)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
                    active.has(s.key) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {s.label}
                  {active.has(s.key) && <span className="text-indigo-600">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {QUICK_FILTER_REST.map((q) =>
          chip(q.label, active.has(q.key), () => onToggle(q.key))
        )}
      </div>

      {advanced.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
          {advanced.map((f) => {
            const fieldLabel =
              ADVANCED_FIELDS.find((x) => x.key === f.field)?.label ?? f.field;
            const ops = operatorsFor(f.field);
            const isUserField = f.field === "assignee" || f.field === "created_by";
            const isDateField = ["start_date", "due_date", "created_on", "last_modified_on", "completed_on"].includes(f.field);
            return (
              <div key={f.id} className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                <span className="text-xs font-medium text-gray-700">{fieldLabel}</span>
                <select
                  value={f.operator}
                  onChange={(e) => onUpdateAdvanced(f.id, { operator: e.target.value })}
                  className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
                >
                  {ops.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {f.operator !== "is_null" && (
                  <>
                    {isUserField ? (
                      <select
                        value={(f.value as string) ?? ""}
                        onChange={(e) => onUpdateAdvanced(f.id, { value: e.target.value })}
                        className="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
                      >
                        <option value="">— Choose —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    ) : isDateField ? (
                      <input
                        type="date"
                        value={(f.value as string) ?? ""}
                        onChange={(e) => onUpdateAdvanced(f.id, { value: e.target.value })}
                        className="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
                      />
                    ) : (
                      <input
                        type="text"
                        value={(f.value as string) ?? ""}
                        onChange={(e) => onUpdateAdvanced(f.id, { value: e.target.value })}
                        placeholder="value"
                        className="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
                      />
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveAdvanced(f.id)}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative mt-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          <Plus className="h-3 w-3" /> Add filter
        </button>
        {addOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {ADVANCED_FIELDS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  onAddAdvanced(f.key);
                  setAddOpen(false);
                }}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
