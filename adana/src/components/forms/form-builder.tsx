"use client";

import * as React from "react";
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  Pencil,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import type { FormFieldType } from "@/types";

// ---------------------------------------------------------------------------
// Types & config
// ---------------------------------------------------------------------------

interface BuilderField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  description: string | null;
  options: string[] | null;
  order: number;
}

const FIELD_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  text: { label: "Text", icon: <Type className="h-4 w-4" /> },
  paragraph: { label: "Textarea", icon: <AlignLeft className="h-4 w-4" /> },
  number: { label: "Number", icon: <Hash className="h-4 w-4" /> },
  date: { label: "Date", icon: <Calendar className="h-4 w-4" /> },
  single_select: {
    label: "Dropdown",
    icon: <ChevronDown className="h-4 w-4" />,
  },
  multi_select: {
    label: "Checkbox",
    icon: <CheckSquare className="h-4 w-4" />,
  },
};

const addableTypes: FormFieldType[] = [
  "text",
  "paragraph",
  "single_select",
  "date",
  "number",
  "multi_select",
];

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockFields: BuilderField[] = [
  {
    id: "f1",
    label: "Task Title",
    type: "text",
    required: true,
    description: "Short title for the request",
    options: null,
    order: 0,
  },
  {
    id: "f2",
    label: "Description",
    type: "paragraph",
    required: false,
    description: "Provide more details",
    options: null,
    order: 1,
  },
  {
    id: "f3",
    label: "Priority",
    type: "single_select",
    required: true,
    description: null,
    options: ["Low", "Medium", "High", "Critical"],
    order: 2,
  },
  {
    id: "f4",
    label: "Due Date",
    type: "date",
    required: false,
    description: null,
    options: null,
    order: 3,
  },
  {
    id: "f5",
    label: "Estimated Hours",
    type: "number",
    required: false,
    description: null,
    options: null,
    order: 4,
  },
];

// Mock submissions
interface FormSubmissionRow {
  id: string;
  submitter: string;
  submittedAt: string;
  values: Record<string, string>;
}

const mockSubmissions: FormSubmissionRow[] = [
  {
    id: "sub1",
    submitter: "alex@example.com",
    submittedAt: "2026-04-02T10:30:00Z",
    values: {
      "Task Title": "Fix broken link on homepage",
      Description: "The careers link in the footer returns 404.",
      Priority: "High",
      "Due Date": "2026-04-10",
      "Estimated Hours": "2",
    },
  },
  {
    id: "sub2",
    submitter: "mia@example.com",
    submittedAt: "2026-04-01T15:00:00Z",
    values: {
      "Task Title": "Add dark mode toggle",
      Description: "",
      Priority: "Medium",
      "Due Date": "2026-04-20",
      "Estimated Hours": "8",
    },
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldRow({
  field,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  field: BuilderField;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 transition-colors hover:border-gray-300">
      {/* Drag handle / reorder */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded p-0.5 text-gray-300 transition-colors hover:text-gray-600 disabled:opacity-30"
          aria-label="Move up"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2L1 7h10L6 2z" />
          </svg>
        </button>
        <GripVertical className="h-4 w-4 text-gray-300" />
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded p-0.5 text-gray-300 transition-colors hover:text-gray-600 disabled:opacity-30"
          aria-label="Move down"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 10l5-5H1l5 5z" />
          </svg>
        </button>
      </div>

      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {FIELD_TYPE_CONFIG[field.type]?.icon}
      </div>

      {/* Label & type */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{field.label}</p>
        <p className="text-xs text-gray-500">
          {FIELD_TYPE_CONFIG[field.type]?.label}
          {field.required && (
            <span className="ml-1.5 text-red-500">* Required</span>
          )}
        </p>
      </div>

      {/* Options preview */}
      {field.options && field.options.length > 0 && (
        <div className="hidden gap-1 sm:flex">
          {field.options.slice(0, 3).map((opt) => (
            <Badge key={opt} variant="default">
              {opt}
            </Badge>
          ))}
          {field.options.length > 3 && (
            <Badge variant="default">+{field.options.length - 3}</Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Edit field"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete field"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: BuilderField }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      {field.type === "text" && (
        <input
          disabled
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm"
          placeholder="Enter text..."
        />
      )}
      {field.type === "paragraph" && (
        <textarea
          disabled
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
          placeholder="Enter details..."
        />
      )}
      {field.type === "number" && (
        <input
          disabled
          type="number"
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm"
          placeholder="0"
        />
      )}
      {field.type === "date" && (
        <input
          disabled
          type="date"
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm"
        />
      )}
      {field.type === "single_select" && (
        <select
          disabled
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-500"
        >
          <option>Select an option...</option>
          {field.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )}
      {field.type === "multi_select" && (
        <div className="space-y-1">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" disabled className="rounded" />
              {o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type ViewMode = "builder" | "preview" | "submissions";

export function FormBuilder() {
  const [fields, setFields] = React.useState<BuilderField[]>(mockFields);
  const [viewMode, setViewMode] = React.useState<ViewMode>("builder");
  const [editingField, setEditingField] = React.useState<BuilderField | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  // Field settings state
  const [editLabel, setEditLabel] = React.useState("");
  const [editRequired, setEditRequired] = React.useState(false);
  const [editOptions, setEditOptions] = React.useState<string[]>([]);
  const [newOption, setNewOption] = React.useState("");

  const openEdit = (field: BuilderField) => {
    setEditingField(field);
    setEditLabel(field.label);
    setEditRequired(field.required);
    setEditOptions(field.options ?? []);
    setNewOption("");
  };

  const saveEdit = () => {
    if (!editingField || !editLabel.trim()) return;
    setFields((prev) =>
      prev.map((f) =>
        f.id === editingField.id
          ? { ...f, label: editLabel.trim(), required: editRequired, options: editOptions.length > 0 ? editOptions : null }
          : f
      )
    );
    setEditingField(null);
  };

  const addField = (type: FormFieldType) => {
    const field: BuilderField = {
      id: `f-${Date.now()}`,
      label: FIELD_TYPE_CONFIG[type]?.label + " Field",
      type,
      required: false,
      description: null,
      options: type === "single_select" || type === "multi_select" ? ["Option 1", "Option 2"] : null,
      order: fields.length,
    };
    setFields([...fields, field]);
    setShowAddMenu(false);
  };

  const deleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const next = [...fields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Form Builder</h2>
          <p className="text-sm text-gray-500">
            {fields.length} field{fields.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View tabs */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {(
              [
                { key: "builder" as const, label: "Builder", icon: <Pencil className="h-3.5 w-3.5" /> },
                { key: "preview" as const, label: "Preview", icon: <Eye className="h-3.5 w-3.5" /> },
                { key: "submissions" as const, label: "Submissions", icon: <AlignLeft className="h-3.5 w-3.5" /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Builder view */}
        {viewMode === "builder" && (
          <div className="mx-auto max-w-2xl space-y-2">
            {fields.map((field, idx) => (
              <FieldRow
                key={field.id}
                field={field}
                onDelete={() => deleteField(field.id)}
                onEdit={() => openEdit(field)}
                onMoveUp={() => moveField(idx, -1)}
                onMoveDown={() => moveField(idx, 1)}
                isFirst={idx === 0}
                isLast={idx === fields.length - 1}
              />
            ))}

            {/* Add field */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
              {showAddMenu && (
                <div className="absolute left-0 right-0 z-10 mt-1 grid grid-cols-3 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                  {addableTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => addField(type)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      {FIELD_TYPE_CONFIG[type]?.icon}
                      {FIELD_TYPE_CONFIG[type]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        {viewMode === "preview" && (
          <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-gray-200 bg-white p-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Request Form
              </h3>
              <p className="text-sm text-gray-500">
                Fill out this form to submit a request.
              </p>
            </div>
            {fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
            <Button variant="primary" className="w-full" disabled>
              Submit
            </Button>
          </div>
        )}

        {/* Submissions */}
        {viewMode === "submissions" && (
          <div className="mx-auto max-w-3xl">
            {mockSubmissions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                <p className="text-sm text-gray-500">No submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {sub.submitter}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(sub.values).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-gray-500">
                            {key}
                          </p>
                          <p className="text-sm text-gray-800">
                            {value || "--"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field settings modal */}
      <Modal
        open={editingField !== null}
        onClose={() => setEditingField(null)}
        title="Field Settings"
      >
        <div className="space-y-4">
          <Input
            label="Label"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={editRequired}
              onChange={(e) => setEditRequired(e.target.checked)}
              className="rounded border-gray-300"
            />
            Required field
          </label>

          {(editingField?.type === "single_select" ||
            editingField?.type === "multi_select") && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Options</p>
              <div className="space-y-1.5">
                {editOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...editOptions];
                        next[idx] = e.target.value;
                        setEditOptions(next);
                      }}
                      inputSize="sm"
                    />
                    <button
                      onClick={() =>
                        setEditOptions(editOptions.filter((_, i) => i !== idx))
                      }
                      className="rounded p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    inputSize="sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newOption.trim()) {
                        setEditOptions([...editOptions, newOption.trim()]);
                        setNewOption("");
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (newOption.trim()) {
                        setEditOptions([...editOptions, newOption.trim()]);
                        setNewOption("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
