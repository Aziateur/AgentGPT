"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Columns3,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  Copy as CopyIcon,
  ListChecks,
  Puzzle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import type { CustomFieldDefExt } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CustomizePanelProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

type SectionKey = "ai" | "workflow";

// ---------------------------------------------------------------------------
// Field type options for the inline "add field" form
// ---------------------------------------------------------------------------

const FIELD_TYPE_OPTIONS: { value: CustomFieldDefExt["fieldType"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "single_select", label: "Dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "people", label: "People" },
  { value: "checkbox", label: "Checkbox" },
  { value: "formula", label: "Formula" },
];

// ---------------------------------------------------------------------------
// Collapsible section header
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  icon: Icon,
  open,
  onToggle,
}: {
  title: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>
      {open ? (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card primitive
// ---------------------------------------------------------------------------

function FeatureCard({
  title,
  description,
  icon: Icon,
  count,
  children,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  count?: number;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-3",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            {typeof count === "number" && (
              <Badge variant="default" className="h-5 text-[10px]">
                {count}
              </Badge>
            )}
            {disabled && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Coming soon
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rules card
// ---------------------------------------------------------------------------

function RulesCard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const rulesCount = useAppStore(
    (s) => s.rules.filter((r) => r.projectId === projectId).length
  );

  return (
    <FeatureCard
      title="Rules"
      description="Manage tasks and workflows automatically."
      icon={Zap}
      count={rulesCount}
    >
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center"
        onClick={() => router.push(`/project/rules?id=${projectId}`)}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Rule
      </Button>
    </FeatureCard>
  );
}

// ---------------------------------------------------------------------------
// Fields card
// ---------------------------------------------------------------------------

function FieldsCard({ projectId }: { projectId: string }) {
  const defs = useAppStore((s) =>
    s.customFieldDefs.filter((d) => d.projectId === projectId)
  );
  const createCustomFieldDef = useAppStore((s) => s.createCustomFieldDef);
  const deleteCustomFieldDef = useAppStore((s) => s.deleteCustomFieldDef);

  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [fieldType, setFieldType] =
    React.useState<CustomFieldDefExt["fieldType"]>("text");

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createCustomFieldDef({
      projectId,
      name: trimmed,
      fieldType,
      position: defs.length,
    });
    setName("");
    setFieldType("text");
    setAdding(false);
  }

  return (
    <FeatureCard
      title="Fields"
      description="Custom fields that add metadata columns."
      icon={Columns3}
      count={defs.length}
    >
      {defs.length > 0 && (
        <ul className="mb-2 space-y-1">
          {defs.map((def) => (
            <li
              key={def.id}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate font-medium text-gray-900">
                  {def.name}
                </span>
                <span className="text-gray-400">{def.fieldType}</span>
              </div>
              <button
                type="button"
                onClick={() => deleteCustomFieldDef(def.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                aria-label="Delete field"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2">
          <Input
            placeholder="Field name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputSize="sm"
            autoFocus
          />
          <Select
            value={fieldType}
            onValueChange={(v) =>
              setFieldType(v as CustomFieldDefExt["fieldType"])
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Field type" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setName("");
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add field
        </Button>
      )}
    </FeatureCard>
  );
}

// ---------------------------------------------------------------------------
// Forms card
// ---------------------------------------------------------------------------

function FormsCard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const forms = useAppStore((s) =>
    s.forms.filter((f) => f.projectId === projectId)
  );
  const createForm = useAppStore((s) => s.createForm);
  const deleteForm = useAppStore((s) => s.deleteForm);

  async function handleCreate() {
    const form = await createForm({ projectId, title: "Untitled form" });
    router.push(`/project/forms?id=${form.id}`);
  }

  function handleCopySlug(slug: string | null | undefined) {
    if (!slug) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(slug);
    }
  }

  return (
    <FeatureCard
      title="Forms"
      description="Intake forms that create tasks."
      icon={FileSpreadsheet}
      count={forms.length}
    >
      {forms.length > 0 && (
        <ul className="mb-2 space-y-1">
          {forms.map((form) => (
            <li
              key={form.id}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs"
            >
              <span className="truncate font-medium text-gray-900">
                {form.title}
              </span>
              <div className="flex items-center gap-0.5">
                {form.publicSlug && (
                  <button
                    type="button"
                    onClick={() => handleCopySlug(form.publicSlug)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    aria-label="Copy slug"
                  >
                    <CopyIcon className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteForm(form.id)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                  aria-label="Delete form"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center"
        onClick={handleCreate}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        New form
      </Button>
    </FeatureCard>
  );
}

// ---------------------------------------------------------------------------
// Task types card
// ---------------------------------------------------------------------------

function TaskTypesCard({ projectId }: { projectId: string }) {
  const taskTypes = useAppStore((s) => s.getProjectTaskTypes(projectId));
  const createTaskType = useAppStore((s) => s.createTaskType);
  const deleteTaskType = useAppStore((s) => s.deleteTaskType);

  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#4c6ef5");

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createTaskType({ projectId, name: trimmed, color });
    setName("");
    setColor("#4c6ef5");
    setAdding(false);
  }

  return (
    <FeatureCard
      title="Task types"
      description="Custom task type labels for this project."
      icon={ListChecks}
      count={taskTypes.length}
    >
      {taskTypes.length > 0 && (
        <ul className="mb-2 space-y-1">
          {taskTypes.map((tt) => (
            <li
              key={tt.id}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tt.color }}
                />
                <span className="truncate font-medium text-gray-900">
                  {tt.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteTaskType(tt.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                aria-label="Delete task type"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2">
          <Input
            placeholder="Task type name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputSize="sm"
            autoFocus
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-16 cursor-pointer rounded border border-gray-200"
          />
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setName("");
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add task type
        </Button>
      )}
    </FeatureCard>
  );
}

// ---------------------------------------------------------------------------
// Task templates card
// ---------------------------------------------------------------------------

function TaskTemplatesCard({ projectId }: { projectId: string }) {
  const templates = useAppStore((s) =>
    s.tasks.filter((t) => t.projectId === projectId && t.isTemplate)
  );
  const createTask = useAppStore((s) => s.createTask);
  const updateTask = useAppStore((s) => s.updateTask);

  async function handleCreate() {
    const task = await createTask({
      projectId,
      title: "Untitled template",
    });
    await updateTask(task.id, { isTemplate: true });
  }

  return (
    <FeatureCard
      title="Task templates"
      description="Reusable task blueprints for this project."
      icon={ListChecks}
      count={templates.length}
    >
      {templates.length > 0 && (
        <ul className="mb-2 space-y-1">
          {templates.map((t) => (
            <li
              key={t.id}
              className="cursor-pointer rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => {
                // Open in task detail via query param (consumed by project views)
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("taskId", t.id);
                  window.history.pushState({}, "", url.toString());
                }
              }}
            >
              {t.title}
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center"
        onClick={handleCreate}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        New template
      </Button>
    </FeatureCard>
  );
}

// ---------------------------------------------------------------------------
// Main drawer
// ---------------------------------------------------------------------------

export function CustomizePanel({
  projectId,
  open,
  onClose,
}: CustomizePanelProps) {
  const [sections, setSections] = React.useState<Record<SectionKey, boolean>>({
    ai: true,
    workflow: true,
  });

  function toggle(key: SectionKey) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Customize project"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Customize</h3>
            <p className="text-xs text-gray-500">This project</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AI Studio */}
        <div className="border-b border-gray-200">
          <SectionHeader
            title="AI Studio"
            icon={Sparkles}
            open={sections.ai}
            onToggle={() => toggle("ai")}
          />
          {sections.ai && (
            <div className="space-y-2 px-5 pb-4">
              <RulesCard projectId={projectId} />
            </div>
          )}
        </div>

        {/* Workflow Features */}
        <div className="border-b border-gray-200">
          <SectionHeader
            title="Workflow Features"
            icon={Zap}
            open={sections.workflow}
            onToggle={() => toggle("workflow")}
          />
          {sections.workflow && (
            <div className="space-y-2 px-5 pb-6">
              <FieldsCard projectId={projectId} />
              <FormsCard projectId={projectId} />
              <TaskTypesCard projectId={projectId} />
              <TaskTemplatesCard projectId={projectId} />
              <FeatureCard
                title="Apps"
                description="Connect tools and integrations."
                icon={Puzzle}
                disabled
              />
              <FeatureCard
                title="Bundles"
                description="Package fields, rules, and templates."
                icon={Package}
                disabled
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default CustomizePanel;
