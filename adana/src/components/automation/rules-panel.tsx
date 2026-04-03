"use client";

import * as React from "react";
import {
  Zap,
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Clock,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  ArrowRightLeft,
  Flag,
  Bell,
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
import type { AutomationRule, AutomationTrigger, AutomationAction } from "@/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  task_added: "Task is added",
  task_completed: "Task is completed",
  task_moved_to_section: "Task moved to section",
  due_date_approaching: "Due date is approaching",
  status_changed: "Status changes",
  custom_field_changed: "Custom field changes",
};

const ACTION_LABELS: Record<AutomationAction, string> = {
  assign_task: "Assign task to...",
  set_due_date: "Set due date",
  move_to_section: "Move to section",
  add_comment: "Add a comment",
  mark_complete: "Mark as complete",
  set_custom_field: "Set custom field",
  create_subtask: "Create subtask",
};

const TRIGGER_ICONS: Record<AutomationTrigger, React.ReactNode> = {
  task_added: <Plus className="h-4 w-4" />,
  task_completed: <CheckCircle2 className="h-4 w-4" />,
  task_moved_to_section: <ArrowRightLeft className="h-4 w-4" />,
  due_date_approaching: <Clock className="h-4 w-4" />,
  status_changed: <AlertTriangle className="h-4 w-4" />,
  custom_field_changed: <FileText className="h-4 w-4" />,
};

interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  icon: React.ReactNode;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "preset-1",
    name: "Auto-assign to...",
    description: "Automatically assign new tasks to a team member",
    trigger: "task_added",
    action: "assign_task",
    icon: <UserPlus className="h-5 w-5 text-indigo-600" />,
  },
  {
    id: "preset-2",
    name: "Move completed to Done",
    description: "Move tasks to the Done section when completed",
    trigger: "task_completed",
    action: "move_to_section",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  },
  {
    id: "preset-3",
    name: "Set priority on due date",
    description: "Increase priority when due date is approaching",
    trigger: "due_date_approaching",
    action: "set_custom_field",
    icon: <Flag className="h-5 w-5 text-orange-600" />,
  },
  {
    id: "preset-4",
    name: "Notify on overdue",
    description: "Add a comment notification when tasks are overdue",
    trigger: "due_date_approaching",
    action: "add_comment",
    icon: <Bell className="h-5 w-5 text-red-600" />,
  },
];

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: string;
  action: string;
  taskName: string;
  executedAt: string;
  success: boolean;
}

const mockRules: (AutomationRule & { executionCount: number })[] = [
  {
    id: "rule-1",
    name: "Auto-assign new tasks to Sarah",
    projectId: "proj-1",
    enabled: true,
    trigger: "task_added",
    triggerConfig: {},
    action: "assign_task",
    actionConfig: { assigneeId: "user-2", assigneeName: "Sarah Chen" },
    createdById: "user-1",
    executionCount: 47,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-03-20T14:30:00Z",
  },
  {
    id: "rule-2",
    name: "Move completed to Done section",
    projectId: "proj-1",
    enabled: true,
    trigger: "task_completed",
    triggerConfig: {},
    action: "move_to_section",
    actionConfig: { sectionId: "section-done", sectionName: "Done" },
    createdById: "user-1",
    executionCount: 123,
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-03-28T11:00:00Z",
  },
  {
    id: "rule-3",
    name: "Flag approaching deadlines",
    projectId: "proj-1",
    enabled: false,
    trigger: "due_date_approaching",
    triggerConfig: { daysBefore: 2 },
    action: "add_comment",
    actionConfig: { comment: "This task is due soon!" },
    createdById: "user-1",
    executionCount: 8,
    createdAt: "2026-02-20T16:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
  },
];

const mockExecutionLogs: ExecutionLog[] = [
  {
    id: "exec-1",
    ruleId: "rule-2",
    ruleName: "Move completed to Done section",
    trigger: "Task completed",
    action: "Moved to Done",
    taskName: "Design landing page",
    executedAt: "2026-04-03T09:15:00Z",
    success: true,
  },
  {
    id: "exec-2",
    ruleId: "rule-1",
    ruleName: "Auto-assign new tasks to Sarah",
    trigger: "Task added",
    action: "Assigned to Sarah Chen",
    taskName: "Write API documentation",
    executedAt: "2026-04-03T08:30:00Z",
    success: true,
  },
  {
    id: "exec-3",
    ruleId: "rule-2",
    ruleName: "Move completed to Done section",
    trigger: "Task completed",
    action: "Moved to Done",
    taskName: "Fix login bug",
    executedAt: "2026-04-02T17:45:00Z",
    success: true,
  },
  {
    id: "exec-4",
    ruleId: "rule-1",
    ruleName: "Auto-assign new tasks to Sarah",
    trigger: "Task added",
    action: "Assigned to Sarah Chen",
    taskName: "Set up CI pipeline",
    executedAt: "2026-04-02T14:20:00Z",
    success: false,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RuleRow({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: (typeof mockRules)[0];
  onToggle: (id: string) => void;
  onEdit: (rule: (typeof mockRules)[0]) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300",
        !rule.enabled && "opacity-60"
      )}
    >
      <button
        onClick={() => onToggle(rule.id)}
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
        <p className="truncate text-sm font-medium text-gray-900">{rule.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            {TRIGGER_ICONS[rule.trigger]}
            {TRIGGER_LABELS[rule.trigger]}
          </span>
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <span>{ACTION_LABELS[rule.action]}</span>
        </div>
      </div>

      <div className="hidden items-center gap-1 text-xs text-gray-500 sm:flex">
        <Zap className="h-3.5 w-3.5" />
        {rule.executionCount} runs
      </div>

      <Badge variant={rule.enabled ? "success" : "default"}>
        {rule.enabled ? "Active" : "Inactive"}
      </Badge>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(rule)}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Edit rule"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(rule.id)}
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
// Main component
// ---------------------------------------------------------------------------

export function RulesPanel() {
  const [rules, setRules] = React.useState(mockRules);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<(typeof mockRules)[0] | null>(null);

  // Create form state
  const [newName, setNewName] = React.useState("");
  const [newTrigger, setNewTrigger] = React.useState<AutomationTrigger>("task_added");
  const [newAction, setNewAction] = React.useState<AutomationAction>("assign_task");

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const rule: (typeof mockRules)[0] = {
      id: `rule-${Date.now()}`,
      name: newName,
      projectId: "proj-1",
      enabled: true,
      trigger: newTrigger,
      triggerConfig: {},
      action: newAction,
      actionConfig: {},
      createdById: "user-1",
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRules((prev) => [...prev, rule]);
    setNewName("");
    setNewTrigger("task_added");
    setNewAction("assign_task");
    setShowCreate(false);
  };

  const handleApplyPreset = (preset: PresetTemplate) => {
    setNewName(preset.name);
    setNewTrigger(preset.trigger);
    setNewAction(preset.action);
    setShowCreate(true);
  };

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
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
            <Clock className="h-4 w-4" />
            History
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Preset templates */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Quick Templates</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="shrink-0 rounded-lg bg-white p-2 shadow-sm">
                  {preset.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{preset.name}</p>
                  <p className="truncate text-xs text-gray-500">{preset.description}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Rules list */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700">Active Rules</h3>
          {rules.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No automation rules yet.</p>
              <p className="text-xs text-gray-400">
                Create a rule or pick a template to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggle}
                  onEdit={setEditingRule}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showCreate || editingRule !== null}
        onClose={() => {
          setShowCreate(false);
          setEditingRule(null);
        }}
        title={editingRule ? "Edit Rule" : "Create Automation Rule"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Rule Name
            </label>
            <Input
              value={editingRule ? editingRule.name : newName}
              onChange={(e) =>
                editingRule
                  ? setEditingRule({ ...editingRule, name: e.target.value })
                  : setNewName(e.target.value)
              }
              placeholder="e.g. Auto-assign to Sarah"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                When this happens...
              </label>
              <Select
                value={editingRule ? editingRule.trigger : newTrigger}
                onValueChange={(v) =>
                  editingRule
                    ? setEditingRule({ ...editingRule, trigger: v as AutomationTrigger })
                    : setNewTrigger(v as AutomationTrigger)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TRIGGER_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Do this...
              </label>
              <Select
                value={editingRule ? editingRule.action : newAction}
                onValueChange={(v) =>
                  editingRule
                    ? setEditingRule({ ...editingRule, action: v as AutomationAction })
                    : setNewAction(v as AutomationAction)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTION_LABELS) as AutomationAction[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setEditingRule(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              {editingRule ? "Save Changes" : "Create Rule"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Execution History Modal */}
      <Modal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="Execution History"
        size="lg"
      >
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {mockExecutionLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
            >
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  log.success ? "bg-green-500" : "bg-red-500"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">
                  <span className="font-medium">{log.ruleName}</span>
                  <span className="text-gray-500"> on </span>
                  <span className="font-medium">{log.taskName}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {log.trigger} → {log.action}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {formatRelativeDate(log.executedAt)}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
