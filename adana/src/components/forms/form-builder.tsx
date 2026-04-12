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
  Link2,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useAppStore } from "@/store/app-store";
import type { FormExt, FormFieldExt, FormFieldType } from "@/types";

// ---------------------------------------------------------------------------
// Types & config
// ---------------------------------------------------------------------------

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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "form";
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function getChoices(field: FormFieldExt): string[] {
  const opts = field.options as Record<string, unknown> | null | undefined;
  const arr = opts?.choices;
  if (Array.isArray(arr)) return arr as string[];
  return [];
}

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
  field: FormFieldExt;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const choices = getChoices(field);
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 transition-colors hover:border-gray-300">
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

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {FIELD_TYPE_CONFIG[field.fieldType]?.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{field.label}</p>
        <p className="text-xs text-gray-500">
          {FIELD_TYPE_CONFIG[field.fieldType]?.label ?? field.fieldType}
          {field.required && (
            <span className="ml-1.5 text-red-500">* Required</span>
          )}
        </p>
      </div>

      {choices.length > 0 && (
        <div className="hidden gap-1 sm:flex">
          {choices.slice(0, 3).map((opt) => (
            <Badge key={opt} variant="default">
              {opt}
            </Badge>
          ))}
          {choices.length > 3 && (
            <Badge variant="default">+{choices.length - 3}</Badge>
          )}
        </div>
      )}

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

function PreviewField({ field }: { field: FormFieldExt }) {
  const choices = getChoices(field);
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {field.fieldType === "text" && (
        <input
          disabled
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm"
          placeholder="Enter text..."
        />
      )}
      {field.fieldType === "paragraph" && (
        <textarea
          disabled
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
          placeholder="Enter details..."
        />
      )}
      {field.fieldType === "number" && (
        <input
          disabled
          type="number"
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm"
          placeholder="0"
        />
      )}
      {field.fieldType === "date" && (
        <input
          disabled
          type="date"
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm"
        />
      )}
      {field.fieldType === "single_select" && (
        <select
          disabled
          className="h-9 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-500"
        >
          <option>Select an option...</option>
          {choices.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )}
      {field.fieldType === "multi_select" && (
        <div className="space-y-1">
          {choices.map((o) => (
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

interface FormBuilderProps {
  formId?: string;
  projectId: string;
}

export function FormBuilder({ formId: initialFormId, projectId }: FormBuilderProps) {
  const forms = useAppStore((s) => s.forms);
  const formFields = useAppStore((s) => s.formFields);
  const formSubmissions = useAppStore((s) => s.formSubmissions);
  const createForm = useAppStore((s) => s.createForm);
  const updateForm = useAppStore((s) => s.updateForm);
  const createFormField = useAppStore((s) => s.createFormField);
  const updateFormField = useAppStore((s) => s.updateFormField);
  const deleteFormField = useAppStore((s) => s.deleteFormField);

  const [formId, setFormId] = React.useState<string | undefined>(initialFormId);
  const [viewMode, setViewMode] = React.useState<ViewMode>("builder");
  const [editingField, setEditingField] = React.useState<FormFieldExt | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Field settings modal state
  const [editLabel, setEditLabel] = React.useState("");
  const [editRequired, setEditRequired] = React.useState(false);
  const [editChoices, setEditChoices] = React.useState<string[]>([]);
  const [newOption, setNewOption] = React.useState("");
  const [editShowIfFieldId, setEditShowIfFieldId] = React.useState<string>("");
  const [editShowIfOperator, setEditShowIfOperator] = React.useState<string>("eq");
  const [editShowIfValue, setEditShowIfValue] = React.useState<string>("");

  const form = React.useMemo(
    () => (formId ? forms.find((f) => f.id === formId) : undefined),
    [forms, formId]
  );

  const fields = React.useMemo(
    () =>
      formId
        ? formFields
            .filter((f) => f.formId === formId)
            .sort((a, b) => a.position - b.position)
        : [],
    [formFields, formId]
  );

  const submissions = React.useMemo(
    () => (formId ? formSubmissions.filter((s) => s.formId === formId) : []),
    [formSubmissions, formId]
  );

  const openEdit = (field: FormFieldExt) => {
    setEditingField(field);
    setEditLabel(field.label);
    setEditRequired(field.required);
    setEditChoices(getChoices(field));
    setNewOption("");
    const showIf = (field.options as Record<string, unknown> | null | undefined)
      ?.showIf as
      | { fieldId?: string; operator?: string; value?: string }
      | undefined;
    setEditShowIfFieldId(showIf?.fieldId ?? "");
    setEditShowIfOperator(showIf?.operator ?? "eq");
    setEditShowIfValue(showIf?.value ?? "");
  };

  const saveEdit = async () => {
    if (!editingField || !editLabel.trim()) return;
    const needsChoices =
      editingField.fieldType === "single_select" ||
      editingField.fieldType === "multi_select";
    const options: Record<string, unknown> = {};
    if (needsChoices && editChoices.length > 0) options.choices = editChoices;
    if (editShowIfFieldId) {
      options.showIf = {
        fieldId: editShowIfFieldId,
        operator: editShowIfOperator || "eq",
        value: editShowIfValue,
      };
    }
    await updateFormField(editingField.id, {
      label: editLabel.trim(),
      required: editRequired,
      options: Object.keys(options).length > 0 ? options : null,
    });
    setEditingField(null);
  };

  const addField = async (type: FormFieldType) => {
    if (!formId) return;
    const options: Record<string, unknown> | null =
      type === "single_select" || type === "multi_select"
        ? { choices: ["Option 1", "Option 2"] }
        : null;
    await createFormField({
      formId,
      label: `${FIELD_TYPE_CONFIG[type]?.label ?? "New"} Field`,
      fieldType: type,
      required: false,
      options,
    });
    setShowAddMenu(false);
  };

  const handleDeleteField = async (id: string) => {
    await deleteFormField(id);
  };

  const moveField = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const a = fields[index];
    const b = fields[target];
    await updateFormField(a.id, { position: b.position });
    await updateFormField(b.id, { position: a.position });
  };

  const handleCreateForm = async () => {
    const created = await createForm({
      title: "Untitled form",
      description: null,
      projectId,
      enabled: false,
    });
    setFormId(created.id);
  };

  const handleTogglePublished = async () => {
    if (!form) return;
    if (form.enabled && form.publicSlug) {
      await updateForm(form.id, { enabled: false });
      return;
    }
    const updates: Partial<FormExt> = { enabled: true };
    if (!form.publicSlug) {
      updates.publicSlug = `${slugify(form.title)}-${randomId()}`;
    }
    await updateForm(form.id, updates);
  };

  const handleGenerateSlug = async () => {
    if (!form) return;
    await updateForm(form.id, {
      publicSlug: `${slugify(form.title)}-${randomId()}`,
    });
  };

  const publicUrl =
    typeof window !== "undefined" && form?.publicSlug
      ? `${window.location.origin}/f?slug=${form.publicSlug}`
      : form?.publicSlug
      ? `/f?slug=${form.publicSlug}`
      : "";

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  // ---------- Empty (no form yet) ----------
  if (!formId || !form) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-indigo-100 p-4 text-indigo-600">
          <Pencil className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          No form yet
        </h2>
        <p className="max-w-sm text-sm text-gray-500">
          Create a form to collect submissions that will be turned into tasks
          in this project.
        </p>
        <Button variant="primary" onClick={handleCreateForm}>
          <Plus className="h-4 w-4" /> Create form
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <input
            value={form.title}
            onChange={(e) => updateForm(form.id, { title: e.target.value })}
            className="w-full truncate bg-transparent text-lg font-semibold text-gray-900 outline-none focus:ring-0"
          />
          <input
            value={form.description ?? ""}
            onChange={(e) =>
              updateForm(form.id, { description: e.target.value })
            }
            placeholder="Add a description..."
            className="w-full truncate bg-transparent text-sm text-gray-500 outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePublished}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              form.enabled
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {form.enabled ? "Published" : "Draft"}
          </button>
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

      {/* Public URL box */}
      {form.enabled && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-indigo-50/50 px-6 py-2.5">
          <Link2 className="h-4 w-4 shrink-0 text-indigo-500" />
          {form.publicSlug ? (
            <>
              <code className="flex-1 truncate text-xs text-gray-700">
                {publicUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                icon={
                  copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )
                }
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-xs text-gray-600">
                No public URL yet.
              </span>
              <Button variant="outline" size="sm" onClick={handleGenerateSlug}>
                Generate link
              </Button>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "builder" && (
          <div className="mx-auto max-w-2xl space-y-2">
            {fields.map((field, idx) => (
              <FieldRow
                key={field.id}
                field={field}
                onDelete={() => handleDeleteField(field.id)}
                onEdit={() => openEdit(field)}
                onMoveUp={() => moveField(idx, -1)}
                onMoveDown={() => moveField(idx, 1)}
                isFirst={idx === 0}
                isLast={idx === fields.length - 1}
              />
            ))}

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

        {viewMode === "preview" && (
          <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-gray-200 bg-white p-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {form.title}
              </h3>
              {form.description && (
                <p className="text-sm text-gray-500">{form.description}</p>
              )}
            </div>
            {fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
            <Button variant="primary" className="w-full" disabled>
              Submit
            </Button>
          </div>
        )}

        {viewMode === "submissions" && (
          <div className="mx-auto max-w-3xl">
            {submissions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                <p className="text-sm text-gray-500">No submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        Submission
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {fields.map((field) => {
                        const v = (sub.payload as Record<string, unknown>)[
                          field.id
                        ];
                        return (
                          <div key={field.id}>
                            <p className="text-xs font-medium text-gray-500">
                              {field.label}
                            </p>
                            <p className="text-sm text-gray-800">
                              {v === undefined || v === null || v === ""
                                ? "--"
                                : String(v)}
                            </p>
                          </div>
                        );
                      })}
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

          {(editingField?.fieldType === "single_select" ||
            editingField?.fieldType === "multi_select") && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Options</p>
              <div className="space-y-1.5">
                {editChoices.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...editChoices];
                        next[idx] = e.target.value;
                        setEditChoices(next);
                      }}
                      inputSize="sm"
                    />
                    <button
                      onClick={() =>
                        setEditChoices(editChoices.filter((_, i) => i !== idx))
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
                        setEditChoices([...editChoices, newOption.trim()]);
                        setNewOption("");
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (newOption.trim()) {
                        setEditChoices([...editChoices, newOption.trim()]);
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

          {/* Conditional showIf */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-3.5 w-3.5" />
              Show only if...
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={editShowIfFieldId}
                onChange={(e) => setEditShowIfFieldId(e.target.value)}
                className="h-8 rounded-md border border-gray-300 px-2 text-xs"
              >
                <option value="">(always show)</option>
                {fields
                  .filter((f) => f.id !== editingField?.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
              </select>
              <select
                value={editShowIfOperator}
                onChange={(e) => setEditShowIfOperator(e.target.value)}
                disabled={!editShowIfFieldId}
                className="h-8 rounded-md border border-gray-300 px-2 text-xs disabled:bg-gray-50"
              >
                <option value="eq">equals</option>
                <option value="neq">not equals</option>
                <option value="contains">contains</option>
              </select>
              <Input
                value={editShowIfValue}
                onChange={(e) => setEditShowIfValue(e.target.value)}
                disabled={!editShowIfFieldId}
                inputSize="sm"
                placeholder="value"
              />
            </div>
          </div>

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
