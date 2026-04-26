"use client";

import * as React from "react";
import { X, Plus, GripVertical } from "lucide-react";
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

export type FieldType =
  | "single_select"
  | "multi_select"
  | "date"
  | "people"
  | "reference"
  | "text"
  | "number"
  | "formula"
  | "id"
  | "timer";

export const FIELD_TYPES: { key: FieldType; label: string }[] = [
  { key: "single_select", label: "Single-select" },
  { key: "multi_select", label: "Multi-select" },
  { key: "date", label: "Date" },
  { key: "people", label: "People" },
  { key: "reference", label: "Reference" },
  { key: "text", label: "Text" },
  { key: "number", label: "Number" },
  { key: "formula", label: "Formula" },
  { key: "id", label: "ID" },
  { key: "timer", label: "Timer" },
];

const SWATCHES = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#a3a3a3",
];

interface OptionRow {
  id: string;
  label: string;
  color: string;
}

function OptionItem({
  opt,
  onChange,
  onRemove,
}: {
  opt: OptionRow;
  onChange: (patch: Partial<OptionRow>) => void;
  onRemove: () => void;
}) {
  const [pickOpen, setPickOpen] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opt.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600"
        aria-label="Drag"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickOpen((v) => !v)}
          className="h-5 w-5 rounded-full border border-gray-300"
          style={{ backgroundColor: opt.color }}
          aria-label="Pick color"
        />
        {pickOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 grid w-40 grid-cols-7 gap-1 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange({ color: c });
                  setPickOpen(false);
                }}
                className="h-4 w-4 rounded-full border border-gray-300"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
      <input
        type="text"
        value={opt.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Option name"
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus:border-indigo-400"
      />
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
        aria-label="Remove option"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    fieldType: FieldType;
    description?: string;
    options?: { id: string; label: string; color: string }[];
    addToLibrary?: boolean;
    notify?: boolean;
  }) => void;
  onAttachExisting?: (def: { id: string; name: string; fieldType: string }) => void;
  libraryFields?: { id: string; name: string; fieldType: string; projectId?: string | null }[];
}

export function AddFieldDialog({
  open,
  onClose,
  onCreate,
  onAttachExisting,
  libraryFields = [],
}: AddFieldDialogProps) {
  const [tab, setTab] = React.useState<"create" | "library">("create");
  const [name, setName] = React.useState("");
  const [fieldType, setFieldType] = React.useState<FieldType>("single_select");
  const [showDesc, setShowDesc] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [options, setOptions] = React.useState<OptionRow[]>([
    { id: crypto.randomUUID(), label: "", color: SWATCHES[0] },
    { id: crypto.randomUUID(), label: "", color: SWATCHES[5] },
  ]);
  const [addToLibrary, setAddToLibrary] = React.useState(false);
  const [notify, setNotify] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  React.useEffect(() => {
    if (open) {
      setTab("create");
      setName("");
      setFieldType("single_select");
      setShowDesc(false);
      setDescription("");
      setOptions([
        { id: crypto.randomUUID(), label: "", color: SWATCHES[0] },
        { id: crypto.randomUUID(), label: "", color: SWATCHES[5] },
      ]);
      setAddToLibrary(false);
      setNotify(false);
    }
  }, [open]);

  if (!open) return null;

  const isSelectType = fieldType === "single_select" || fieldType === "multi_select";

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setOptions(arrayMove(options, oldIndex, newIndex));
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      fieldType,
      description: description || undefined,
      options: isSelectType
        ? options.filter((o) => o.label.trim()).map((o) => ({ id: o.id, label: o.label.trim(), color: o.color }))
        : undefined,
      addToLibrary,
      notify,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="border-b border-gray-200 px-5 pt-4">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Add field</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTab("create")}
              className={`relative px-3 py-2 text-sm font-medium transition ${
                tab === "create" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create new
              {tab === "create" && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />}
            </button>
            <button
              type="button"
              onClick={() => setTab("library")}
              className={`relative px-3 py-2 text-sm font-medium transition ${
                tab === "library" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Choose from library
              {tab === "library" && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />}
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {tab === "create" ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-700">Field title*</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priority, Stage, Status…"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-700">Field type</span>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800"
                >
                  {FIELD_TYPES.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </label>

              {!showDesc ? (
                <button
                  type="button"
                  onClick={() => setShowDesc(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add description
                </button>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-700">Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-indigo-400"
                  />
                </label>
              )}

              {isSelectType && (
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-700">Options*</span>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1.5">
                        {options.map((opt) => (
                          <OptionItem
                            key={opt.id}
                            opt={opt}
                            onChange={(patch) =>
                              setOptions((prev) =>
                                prev.map((o) => (o.id === opt.id ? { ...o, ...patch } : o))
                              )
                            }
                            onRemove={() =>
                              setOptions((prev) => prev.filter((o) => o.id !== opt.id))
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), label: "", color: SWATCHES[prev.length % SWATCHES.length] },
                      ])
                    }
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add an option
                  </button>
                </div>
              )}

              <div className="space-y-2 border-t border-gray-100 pt-3">
                <label className="flex items-center justify-between gap-2 text-xs text-gray-700">
                  <span>Add to My workspace's field library</span>
                  <input
                    type="checkbox"
                    checked={addToLibrary}
                    onChange={(e) => setAddToLibrary(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-xs text-gray-700">
                  <span>Notify collaborators when this field's value is changed</span>
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {libraryFields.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">No library fields available.</p>
              ) : (
                libraryFields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onAttachExisting?.(f);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span>{f.name}</span>
                    <span className="text-xs text-gray-500">{f.fieldType}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          {tab === "create" && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Create field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
