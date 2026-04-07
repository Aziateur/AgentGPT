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
import type { AutomationTrigger, AutomationAction } from "@/types";

// ---------------------------------------------------------------------------
// Labels & icons
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

// Map DB field names to UI type names
const TRIGGER_TYPE_MAP: Record<string, AutomationTrigger> = {
  task_created: "task_added",
  task_completed: "task_completed",
  task_moved: "task_moved_to_section",
  due_date_approaching: "due_date_approaching",
  assignee_changed: "status_changed",
  field_changed: "custom_field_changed",
  // Also support direct UI values
  task_added: "task_added",
  task_moved_to_section: "task_moved_to_section",
  status_changed: "status_changed",
  custom_field_changed: "custom_field_changed",
};

const ACTION_TYPE_MAP: Record<string, AutomationAction> = {
  assign: "assign_task",
  move_section: "move_to_section",
  set_field: "set_custom_field",
  add_comment: "add_comment",
  mark_complete: "mark_complete",
  set_priority: "set_custom_field",
  // Also support direct UI values
  assign_task: "assign_task",
  set_due_date: "set_due_date",
  move_to_section: "move_to_section",
  set_custom_field: "set_custom_field",
  create_subtask: "create_subtask",
};

// Reverse maps for saving to DB
const TRIGGER_TO_DB: Record<AutomationTrigger, string> = {
  task_added: "task_created",
  task_completed: "task_completed",
  task_moved_to_section: "task_moved",
  due_date_approaching: "due_date_approaching",
  status_changed: "assignee_changed",
  custom_field_changed: "field_changed",
};

const ACTION_TO_DB: Record<AutomationAction, string> = {
  assign_task: "assign",
  set_due_date: "set_field",
  move_to_section: "move_section",
  add_comment: "add_comment",
  mark_complete: "mark_complete",
  set_custom_field: "set_field",
  create_subtask: "add_comment",
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

interface RuleData {
  id: string;
  name: string;
  active: boolean;
  triggerType: string;
  triggerConfig: string;
  actionType: string;
  actionConfig: string;
  projectId: string;
  creatorId: string;
  _count?: { executions: number };
  createdAt: string;
  updatedAt: string;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  success: boolean;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null } | null;
}

// Normalized rule for display
interface DisplayRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
  executionCount: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RuleRow({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: DisplayRule;
  onToggle: (id: string) => void;
  onEdit: (rule: DisplayRule) => void;
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

interface RulesPanelProps {
  projectId: string;
}

export function RulesPanel({ projectId }: RulesPanelProps) {
  const [rules, setRules] = React.useState<DisplayRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<DisplayRule | null>(null);
  const [executionLogs, setExecutionLogs] = React.useState<ExecutionLog[]>([]);

  // Create form state
  const [newName, setNewName] = React.useState("");
  const [newTrigger, setNewTrigger] = React.useState<AutomationTrigger>("task_added");
  const [newAction, setNewAction] = React.useState<AutomationAction>("assign_task");

  const loadRules = React.useCallback(async () => {
    try {
      const { getRules } = await import("@/app/actions/automation-actions");
      const data = await getRules(projectId);
      const display: DisplayRule[] = (data as RuleData[]).map((r) => ({
        id: r.id,
        name: r.name,
        enabled: r.active,
        trigger: TRIGGER_TYPE_MAP[r.triggerType] || "task_added",
        action: ACTION_TYPE_MAP[r.actionType] || "assign_task",
        executionCount: r._count?.executions || 0,
      }));
      setRules(display);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleToggle = async (id: string) => {
    // Optimistic update
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    const { toggleRule } = await import("@/app/actions/automation-actions");
    const result = await toggleRule(id);
    if (result.error) {
      // Revert
      loadRules();
    }
  };

  const handleDelete = async (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    const { deleteRule } = await import("@/app/actions/automation-actions");
    const result = await deleteRule(id);
    if (result.error) {
      loadRules();
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    if (editingRule) {
      // Update existing rule
      const { updateRule } = await import("@/app/actions/automation-actions");
      await updateRule(editingRule.id, {
        name: newName || editingRule.name,
        triggerType: TRIGGER_TO_DB[newTrigger],
        triggerConfig: {},
        actionType: ACTION_TO_DB[newAction],
        actionConfig: {},
      });
      setEditingRule(null);
    } else {
      // Create new rule
      const { createRule } = await import("@/app/actions/automation-actions");
      await createRule({
        name: newName,
        projectId,
        triggerType: TRIGGER_TO_DB[newTrigger],
        triggerConfig: {},
        actionType: ACTION_TO_DB[newAction],
        actionConfig: {},
      });
    }

    setNewName("");
    setNewTrigger("task_added");
    setNewAction("assign_task");
    setShowCreate(false);
    loadRules();
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    // Load execution history for all rules in this project
    const { getRuleExecutions } = await import("@/app/actions/automation-actions");
    const allLogs: ExecutionLog[] = [];
    for (const rule of rules) {
      const logs = await getRuleExecutions(rule.id);
      allLogs.push(...(logs as ExecutionLog[]));
    }
    allLogs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setExecutionLogs(allLogs);
  };

  const handleApplyPreset = (preset: PresetTemplate) => {
    setNewName(preset.name);
    setNewTrigger(preset.trigger);
    setNewAction(preset.action);
    setShowCreate(true);
  };

  const handleEdit = (rule: DisplayRule) => {
    setNewName(rule.name);
    setNewTrigger(rule.trigger);
    setNewAction(rule.action);
    setEditingRule(rule);
    setShowCreate(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

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
          <Button variant="ghost" size="sm" onClick={handleShowHistory}>
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
                  onEdit={handleEdit}
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
          setNewName("");
          setNewTrigger("task_added");
          setNewAction("assign_task");
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
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Auto-assign to Sarah"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                When this happens...
              </label>
              <Select
                value={newTrigger}
                onValueChange={(v) => setNewTrigger(v as AutomationTrigger)}
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
                value={newAction}
                onValueChange={(v) => setNewAction(v as AutomationAction)}
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
                setNewName("");
                setNewTrigger("task_added");
                setNewAction("assign_task");
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
          {executionLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No execution history yet.
            </div>
          ) : (
            executionLogs.map((log) => (
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
                    <span className="font-medium">
                      {log.user?.name || "System"}
                    </span>
                    <span className="text-gray-500"> - </span>
                    <span>{log.details || "No details"}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatRelativeDate(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
