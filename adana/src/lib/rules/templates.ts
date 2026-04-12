import type { AutomationRuleExt } from "@/types";

export type RuleTemplate = {
  name: string;
  description: string;
  rule: Omit<AutomationRuleExt, "id" | "createdAt" | "updatedAt">;
};

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    name: "Auto-assign new tasks",
    description:
      "When a task is created in this project, automatically assign it to a specific user.",
    rule: {
      name: "Auto-assign new tasks",
      enabled: true,
      triggerType: "task_created",
      triggerConfig: {},
      actions: [
        { type: "assign", config: { userId: "<select user>" } },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "Move to Done when completed",
    description:
      "When a task is marked complete, move it to the Done section.",
    rule: {
      name: "Move to Done when completed",
      enabled: true,
      triggerType: "task_completed",
      triggerConfig: {},
      actions: [
        { type: "move_section", config: { sectionId: "<select Done section>" } },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "High priority gets reviewer",
    description:
      "When a task's priority is set to high, assign a reviewer.",
    rule: {
      name: "High priority gets reviewer",
      enabled: true,
      triggerType: "custom_field_changed",
      triggerConfig: {},
      actions: [
        {
          type: "assign",
          config: { userId: "<select reviewer>" },
          condition: { field: "priority", operator: "eq", value: "high" },
        },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "Notify on due soon",
    description:
      "When a task's due date is approaching, notify the assignee.",
    rule: {
      name: "Notify on due soon",
      enabled: true,
      triggerType: "due_date_approaching",
      triggerConfig: { daysBefore: 1 },
      actions: [
        {
          type: "notify",
          config: {
            userId: "<assignee>",
            title: "Task due soon",
            message: "This task is due within 24 hours.",
          },
        },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "Auto-tag approved",
    description:
      "When an approval task is completed, add the 'approved' tag.",
    rule: {
      name: "Auto-tag approved",
      enabled: true,
      triggerType: "task_completed",
      triggerConfig: {},
      actions: [
        {
          type: "add_tag",
          config: { tagId: "<select approved tag>" },
          condition: { field: "taskType", operator: "eq", value: "approval" },
        },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "Subtask on creation",
    description:
      "When a new task is created, automatically add a standard subtask.",
    rule: {
      name: "Subtask on creation",
      enabled: true,
      triggerType: "task_created",
      triggerConfig: {},
      actions: [
        { type: "add_subtask", config: { title: "Review & plan" } },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "Archive on complete",
    description:
      "When a task is completed, move it to an archive section.",
    rule: {
      name: "Archive on complete",
      enabled: true,
      triggerType: "task_completed",
      triggerConfig: {},
      actions: [
        { type: "move_section", config: { sectionId: "<select archive section>" } },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
  {
    name: "Escalate overdue",
    description:
      "When a task's due date has passed, set priority to high and notify.",
    rule: {
      name: "Escalate overdue",
      enabled: true,
      triggerType: "due_date_approaching",
      triggerConfig: { daysBefore: 0 },
      actions: [
        { type: "set_priority", config: { priority: "high" } },
        {
          type: "notify",
          config: {
            userId: "<assignee>",
            title: "Overdue task escalated",
            message: "This task is overdue and has been set to high priority.",
          },
        },
      ],
      scope: "project",
      projectId: null,
      userId: null,
    },
  },
];
