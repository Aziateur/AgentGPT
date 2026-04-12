"use client";

import * as React from "react";
import {
  Zap,
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Clock,
  ArrowRight,
  LayoutTemplate,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import { RULE_TEMPLATES, type RuleTemplate } from "@/lib/rules/templates";
import { loadAISettings } from "@/lib/ai/settings";
import { getDefaultProvider } from "@/lib/ai/settings";
import { smartRule } from "@/lib/ai/features";
import type { AutomationRuleExt, RuleActionSpec } from "@/types";

// ---------------------------------------------------------------------------
// Trigger / Action options
// ---------------------------------------------------------------------------

const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: "task_created", label: "Task is created" },
  { value: "task_completed", label: "Task is completed" },
  { value: "task_moved", label: "Task is moved to section" },
  { value: "due_date_approaching", label: "Due date is approaching" },
  { value: "assignee_changed", label: "Assignee changes" },
  { value: "custom_field_changed", label: "Custom field changes" },
  { value: "comment_added", label: "Comment is added" },
  { value: "form_submitted", label: "Form is submitted" },
];

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "assign", label: "Assign to user" },
  { value: "move_section", label: "Move to section" },
  { value: "set_priority", label: "Set priority" },
  { value: "set_due_date", label: "Set due date" },
  { value: "set_field", label: "Set custom field" },
  { value: "add_tag", label: "Add tag" },
  { value: "complete", label: "Mark complete" },
  { value: "add_subtask", label: "Add subtask" },
  { value: "notify", label: "Send notification" },
];

const PRIORITY_OPTIONS = ["low", "medium", "high"];

function triggerLabel(type: string): string {
  return TRIGGER_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function actionLabel(type: string): string {
  return ACTION_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

// ---------------------------------------------------------------------------
// Editor form state
// ---------------------------------------------------------------------------

type EditorState = {
  id?: string;
  name: string;
  triggerType: string;
  actions: RuleActionSpec[];
};

const EMPTY_EDITOR: EditorState = {
  name: "",
  triggerType: "task_created",
  actions: [{ type: "assign", config: {} }],
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RulesPanelProps {
  projectId: string;
}

export function RulesPanel({ projectId }: RulesPanelProps) {
  const rules = useAppStore((s) =>
    s.rules.filter((r) => r.projectId === projectId)
  );
  const ruleIds = React.useMemo(() => rules.map((r) => r.id), [rules]);
  const allExecutions = useAppStore((s) => s.ruleExecutions);
  const executions = React.useMemo(
    () =>
      allExecutions
        .filter((e) => ruleIds.includes(e.ruleId))
        .slice()
        .sort(
          (a, b) =>
            new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
        )
        .slice(0, 20),
    [allExecutions, ruleIds]
  );

  const users = useAppStore((s) => s.users);
  const allSections = useAppStore((s) => s.sections);
  const sections = React.useMemo(
    () => allSections.filter((sec) => sec.projectId === projectId),
    [allSections, projectId]
  );
  const tags = useAppStore((s) => s.tags);

  const createRule = useAppStore((s) => s.createRule);
  const updateRule = useAppStore((s) => s.updateRule);
  const deleteRule = useAppStore((s) => s.deleteRule);
  const toggleRule = useAppStore((s) => s.toggleRule);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editor, setEditor] = React.useState<EditorState>(EMPTY_EDITOR);
  const [templatesOpen, setTemplatesOpen] = React.useState(false);

  // AI smart-rule
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiText, setAiText] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const settings = loadAISettings();
      setAiEnabled(!!settings.features?.smartRuleCreator);
    } catch {
      setAiEnabled(false);
    }
  }, []);

  // ---------- Editor helpers ----------
  const openNew = () => {
    setEditor(EMPTY_EDITOR);
    setAiText("");
    setAiError(null);
    setEditorOpen(true);
  };

  const openEdit = (rule: AutomationRuleExt) => {
    setEditor({
      id: rule.id,
      name: rule.name,
      triggerType: rule.triggerType,
      actions:
        rule.actions && rule.actions.length
          ? rule.actions.map((a) => ({ ...a, config: { ...(a.config || {}) } }))
          : [{ type: "assign", config: {} }],
    });
    setAiText("");
    setAiError(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditor(EMPTY_EDITOR);
  };

  const updateAction = (idx: number, patch: Partial<RuleActionSpec>) => {
    setEditor((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  };

  const updateActionConfig = (idx: number, patch: Record<string, unknown>) => {
    setEditor((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) =>
        i === idx ? { ...a, config: { ...(a.config || {}), ...patch } } : a
      ),
    }));
  };

  const changeActionType = (idx: number, type: string) => {
    setEditor((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) =>
        i === idx ? { type, config: {} } : a
      ),
    }));
  };

  const addAction = () => {
    setEditor((prev) => ({
      ...prev,
      actions: [...prev.actions, { type: "assign", config: {} }],
    }));
  };

  const removeAction = (idx: number) => {
    setEditor((prev) => ({
      ...prev,
      actions:
        prev.actions.length === 1
          ? prev.actions
          : prev.actions.filter((_, i) => i !== idx),
    }));
  };

  const applyTemplate = (tpl: RuleTemplate) => {
    setEditor({
      name: tpl.rule.name,
      triggerType: tpl.rule.triggerType,
      actions: (tpl.rule.actions || []).map((a) => ({
        ...a,
        config: { ...(a.config || {}) },
      })),
    });
    setTemplatesOpen(false);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editor.name.trim()) return;
    if (editor.id) {
      await updateRule(editor.id, {
        name: editor.name.trim(),
        triggerType: editor.triggerType,
        actions: editor.actions,
      });
    } else {
      await createRule({
        name: editor.name.trim(),
        triggerType: editor.triggerType,
        triggerConfig: {},
        actions: editor.actions,
        projectId,
        scope: "project",
      });
    }
    closeEditor();
  };

  const handleDelete = async (id: string) => {
    await deleteRule(id);
  };

  const handleSmartRule = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const provider = getDefaultProvider();
      if (!provider) {
        setAiError("No AI provider configured. Open Settings to add one.");
        return;
      }
      const result = await smartRule(provider, aiText.trim());
      setEditor({
        name: result.name,
        triggerType: result.triggerType,
        actions:
          Array.isArray(result.actions) && result.actions.length
            ? result.actions.map((a: any) => ({
                type: String(a.type || "assign"),
                config: a.config && typeof a.config === "object" ? a.config : {},
                condition: a.condition,
              }))
            : [{ type: "assign", config: {} }],
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiLoading(false);
    }
  };

  // ---------- Render ----------

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Automation Rules</h2>
          <Badge variant="default">{rules.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTemplatesOpen(true)}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
          <Button variant="primary" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New rule
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Rules list */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Rules</h3>
          {rules.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No automation rules yet.</p>
              <p className="text-xs text-gray-400">
                Create a rule or start from a template.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onToggle={() => toggleRule(rule.id)}
                  onEdit={() => openEdit(rule)}
                  onDelete={() => handleDelete(rule.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Executions log */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            Recent executions
          </h3>
          {executions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
              No executions yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {executions.map((e) => {
                const rule = rules.find((r) => r.id === e.ruleId);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <Badge
                      variant={
                        e.status === "success"
                          ? "success"
                          : e.status === "failed"
                          ? "high"
                          : "default"
                      }
                    >
                      {e.status}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-gray-900">
                      {rule?.name ?? "(deleted rule)"}
                      {e.log ? (
                        <span className="ml-2 text-xs text-gray-500">
                          - {e.log}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatRelativeDate(e.executedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Modal
        open={editorOpen}
        onClose={closeEditor}
        title={editor.id ? "Edit rule" : "New rule"}
        size="lg"
      >
        <div className="space-y-4">
          {aiEnabled && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-indigo-900">
                <Sparkles className="h-3.5 w-3.5" />
                Describe in plain English
              </label>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="e.g. When a task is completed, move it to Done and notify the creator"
                className="w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                rows={2}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                {aiError ? (
                  <span className="text-xs text-red-600">{aiError}</span>
                ) : (
                  <span className="text-xs text-gray-500">
                    AI will pre-fill the form below.
                  </span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSmartRule}
                  disabled={aiLoading || !aiText.trim()}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiLoading ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              value={editor.name}
              onChange={(e) =>
                setEditor((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Auto-assign new tasks"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              When this happens
            </label>
            <Select
              value={editor.triggerType}
              onValueChange={(v) =>
                setEditor((prev) => ({ ...prev, triggerType: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Then do
              </label>
              <Button size="sm" variant="ghost" onClick={addAction}>
                <Plus className="h-3.5 w-3.5" />
                Add action
              </Button>
            </div>

            <div className="space-y-2">
              {editor.actions.map((action, idx) => (
                <ActionEditor
                  key={idx}
                  action={action}
                  users={users}
                  sections={sections}
                  tags={tags}
                  onChangeType={(t) => changeActionType(idx, t)}
                  onChangeConfig={(patch) => updateActionConfig(idx, patch)}
                  onRemove={
                    editor.actions.length > 1 ? () => removeAction(idx) : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button variant="outline" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!editor.name.trim()}
            >
              {editor.id ? "Save changes" : "Create rule"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Templates Modal */}
      <Modal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        title="Rule templates"
        size="lg"
      >
        <div className="grid max-h-[70vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {RULE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => applyTemplate(tpl)}
              className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0 text-indigo-600" />
                <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
              </div>
              <p className="text-xs text-gray-500">{tpl.description}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <span>{triggerLabel(tpl.rule.triggerType)}</span>
                <ArrowRight className="h-3 w-3" />
                <span>
                  {tpl.rule.actions
                    .map((a) => actionLabel(a.type))
                    .join(", ")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RuleRow
// ---------------------------------------------------------------------------

function RuleRow({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AutomationRuleExt;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300",
        !rule.enabled && "opacity-60"
      )}
    >
      <button
        onClick={onToggle}
        className="shrink-0 text-gray-400 transition-colors hover:text-indigo-600"
        aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
      >
        {rule.enabled ? (
          <ToggleRight className="h-6 w-6 text-indigo-600" />
        ) : (
          <ToggleLeft className="h-6 w-6" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {rule.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          <span>{triggerLabel(rule.triggerType)}</span>
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <span className="truncate">
            {(rule.actions || [])
              .map((a) => actionLabel(a.type))
              .join(", ") || "(no actions)"}
          </span>
        </div>
      </div>

      <Badge variant={rule.enabled ? "success" : "default"}>
        {rule.enabled ? "Active" : "Inactive"}
      </Badge>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Edit rule"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Delete rule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionEditor
// ---------------------------------------------------------------------------

interface ActionEditorProps {
  action: RuleActionSpec;
  users: { id: string; name: string }[];
  sections: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onChangeType: (type: string) => void;
  onChangeConfig: (patch: Record<string, unknown>) => void;
  onRemove?: () => void;
}

function ActionEditor({
  action,
  users,
  sections,
  tags,
  onChangeType,
  onChangeConfig,
  onRemove,
}: ActionEditorProps) {
  const config = (action.config || {}) as Record<string, unknown>;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Select value={action.type} onValueChange={onChangeType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="mt-1 shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-600"
            aria-label="Remove action"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 space-y-2">
        {action.type === "assign" && (
          <Select
            value={(config.userId as string) ?? ""}
            onValueChange={(v) => onChangeConfig({ userId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {action.type === "move_section" && (
          <Select
            value={(config.sectionId as string) ?? ""}
            onValueChange={(v) => onChangeConfig({ sectionId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section..." />
            </SelectTrigger>
            <SelectContent>
              {sections.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No sections in this project
                </SelectItem>
              ) : (
                sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}

        {action.type === "set_priority" && (
          <Select
            value={(config.priority as string) ?? ""}
            onValueChange={(v) => onChangeConfig({ priority: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority..." />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {action.type === "set_due_date" && (
          <Input
            type="number"
            value={
              typeof config.offsetDays === "number"
                ? String(config.offsetDays)
                : ""
            }
            onChange={(e) =>
              onChangeConfig({
                offsetDays:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="Days from today (e.g. 7)"
          />
        )}

        {action.type === "add_tag" && (
          <Select
            value={(config.tagId as string) ?? ""}
            onValueChange={(v) => onChangeConfig({ tagId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tag..." />
            </SelectTrigger>
            <SelectContent>
              {tags.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No tags available
                </SelectItem>
              ) : (
                tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}

        {action.type === "add_subtask" && (
          <Input
            value={(config.title as string) ?? ""}
            onChange={(e) => onChangeConfig({ title: e.target.value })}
            placeholder="Subtask title"
          />
        )}

        {action.type === "notify" && (
          <div className="space-y-2">
            <Select
              value={(config.userId as string) ?? ""}
              onValueChange={(v) => onChangeConfig({ userId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Notify user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={(config.title as string) ?? ""}
              onChange={(e) => onChangeConfig({ title: e.target.value })}
              placeholder="Notification title"
            />
            <Input
              value={(config.message as string) ?? ""}
              onChange={(e) => onChangeConfig({ message: e.target.value })}
              placeholder="Message"
            />
          </div>
        )}

        {action.type === "set_field" && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={(config.fieldId as string) ?? ""}
              onChange={(e) => onChangeConfig({ fieldId: e.target.value })}
              placeholder="Field ID"
            />
            <Input
              value={(config.value as string) ?? ""}
              onChange={(e) => onChangeConfig({ value: e.target.value })}
              placeholder="Value"
            />
          </div>
        )}

        {action.type === "complete" && (
          <p className="text-xs text-gray-500">
            No configuration needed — task will be marked complete.
          </p>
        )}
      </div>
    </div>
  );
}
