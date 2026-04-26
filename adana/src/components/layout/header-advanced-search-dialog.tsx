"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, ChevronDown } from "lucide-react";
import { useAppStore as useDataStore } from "@/store/app-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

type ExtraFilterKey =
  | "associated_teams"
  | "dependencies"
  | "custom_fields"
  | "has_attachments"
  | "dates"
  | "tags"
  | "people";

const EXTRA_FILTERS: { key: ExtraFilterKey; label: string; hasSub?: string[] }[] = [
  { key: "associated_teams", label: "Associated Teams" },
  { key: "dependencies", label: "Dependencies" },
  { key: "custom_fields", label: "Custom fields" },
  { key: "has_attachments", label: "Has attachments" },
  {
    key: "dates",
    label: "Dates",
    hasSub: ["start date", "completed on", "created on", "last modified on"],
  },
  { key: "tags", label: "Tags", hasSub: ["any tag", "all tags", "none"] },
  {
    key: "people",
    label: "People",
    hasSub: ["created by", "assigned to", "collaborators"],
  },
];

export function AdvancedSearchDialog({ open, onClose }: Props) {
  const router = useRouter();
  const store = useDataStore();
  const projects = (store as any).projects as any[] | undefined;
  const users = (store as any).users as any[] | undefined;

  const [type, setType] = useState("Task");
  const [includeSubtasks, setIncludeSubtasks] = useState(false);
  const [includeMilestones, setIncludeMilestones] = useState(false);
  const [includeApprovals, setIncludeApprovals] = useState(false);
  const [located, setLocated] = useState("Anywhere");
  const [status, setStatus] = useState("All");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [extraFilters, setExtraFilters] = useState<ExtraFilterKey[]>([]);
  const [extraDropdownOpen, setExtraDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleReset() {
    setType("Task");
    setIncludeSubtasks(false);
    setIncludeMilestones(false);
    setIncludeApprovals(false);
    setLocated("Anywhere");
    setStatus("All");
    setAssignedTo("");
    setDueFrom("");
    setDueTo("");
    setCollaborators("");
    setExtraFilters([]);
  }

  function handleSearch() {
    const params = new URLSearchParams();
    params.set("type", type.toLowerCase());
    if (includeSubtasks) params.set("subtasks", "1");
    if (includeMilestones) params.set("milestones", "1");
    if (includeApprovals) params.set("approvals", "1");
    if (located && located !== "Anywhere") params.set("project", located);
    if (status && status !== "All") params.set("status", status.toLowerCase());
    if (assignedTo) params.set("assignee", assignedTo);
    if (dueFrom) params.set("due_from", dueFrom);
    if (dueTo) params.set("due_to", dueTo);
    if (collaborators) params.set("collaborators", collaborators);
    if (extraFilters.length > 0) params.set("filters", extraFilters.join(","));
    router.push(`/search?${params.toString()}`);
    onClose();
  }

  function toggleExtra(k: ExtraFilterKey) {
    setExtraFilters((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
    setExtraDropdownOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Advanced search
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* Type */}
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
            >
              <option>Task</option>
              <option>Project</option>
              <option>Portfolio</option>
              <option>Goal</option>
              <option>Conversation</option>
              <option>People</option>
            </select>
          </Field>

          {/* Include checkboxes */}
          <Field label="Include">
            <div className="flex flex-wrap gap-4">
              <CheckboxRow
                label="Subtasks"
                checked={includeSubtasks}
                onChange={setIncludeSubtasks}
              />
              <CheckboxRow
                label="Milestones"
                checked={includeMilestones}
                onChange={setIncludeMilestones}
              />
              <CheckboxRow
                label="Approvals"
                checked={includeApprovals}
                onChange={setIncludeApprovals}
              />
            </div>
          </Field>

          {/* Located */}
          <Field label="Located">
            <select
              value={located}
              onChange={(e) => setLocated(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
            >
              <option>Anywhere</option>
              {(projects || []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Status */}
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
            >
              <option>All</option>
              <option>Incomplete</option>
              <option>Completed</option>
            </select>
          </Field>

          {/* Assigned to */}
          <Field label="Assigned to">
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
            >
              <option value="">Anyone</option>
              {(users || []).map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Due date */}
          <Field label="Due date">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dueTo}
                onChange={(e) => setDueTo(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
              />
            </div>
          </Field>

          {/* Collaborators */}
          <Field label="Collaborators">
            <select
              value={collaborators}
              onChange={(e) => setCollaborators(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
            >
              <option value="">Anyone</option>
              {(users || []).map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Extra filters */}
          {extraFilters.length > 0 && (
            <div className="space-y-2 rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-600">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Extra filters
              </div>
              <ul className="space-y-1">
                {extraFilters.map((k) => {
                  const f = EXTRA_FILTERS.find((x) => x.key === k)!;
                  return (
                    <li
                      key={k}
                      className="flex items-center justify-between gap-2 rounded bg-gray-50 px-2.5 py-1.5 text-sm dark:bg-surface-dark-secondary"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {f.label}
                        {f.hasSub && (
                          <span className="ml-1 text-xs text-gray-400">
                            ({f.hasSub.join(" / ")})
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => toggleExtra(k)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setExtraDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add filter
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {extraDropdownOpen && (
              <div className="absolute left-0 top-10 z-10 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-surface-dark">
                {EXTRA_FILTERS.map((f) => {
                  const active = extraFilters.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleExtra(f.key)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span>
                        {f.label}
                        {f.hasSub && <span className="ml-1 text-xs text-gray-400">▶</span>}
                      </span>
                      {active && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Reset filters
          </button>
          <button
            onClick={handleSearch}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3">
      <label className="pt-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  );
}
