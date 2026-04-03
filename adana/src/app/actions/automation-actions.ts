"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getRules(projectId: string) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { executions: true } },
      },
    });
    return rules;
  } catch (error) {
    return [];
  }
}

export async function createRule(data: {
  name: string;
  projectId: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const rule = await prisma.automationRule.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        triggerType: data.triggerType,
        triggerConfig: JSON.stringify(data.triggerConfig),
        actionType: data.actionType,
        actionConfig: JSON.stringify(data.actionConfig),
        creatorId: user.id,
      },
    });

    revalidatePath(`/projects/${data.projectId}`);
    return { rule };
  } catch (error) {
    return { error: "Failed to create automation rule" };
  }
}

export async function updateRule(
  id: string,
  data: {
    name?: string;
    triggerType?: string;
    triggerConfig?: Record<string, unknown>;
    actionType?: string;
    actionConfig?: Record<string, unknown>;
  }
) {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) updateData.triggerConfig = JSON.stringify(data.triggerConfig);
    if (data.actionType !== undefined) updateData.actionType = data.actionType;
    if (data.actionConfig !== undefined) updateData.actionConfig = JSON.stringify(data.actionConfig);

    const rule = await prisma.automationRule.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/projects/${rule.projectId}`);
    return { rule };
  } catch (error) {
    return { error: "Failed to update automation rule" };
  }
}

export async function deleteRule(id: string) {
  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id },
      select: { projectId: true },
    });

    await prisma.automationRule.delete({ where: { id } });

    if (rule?.projectId) {
      revalidatePath(`/projects/${rule.projectId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete automation rule" };
  }
}

export async function toggleRule(id: string) {
  try {
    const rule = await prisma.automationRule.findUnique({ where: { id } });
    if (!rule) return { error: "Rule not found" };

    const updated = await prisma.automationRule.update({
      where: { id },
      data: { active: !rule.active },
    });

    revalidatePath(`/projects/${rule.projectId}`);
    return { rule: updated, active: updated.active };
  } catch (error) {
    return { error: "Failed to toggle automation rule" };
  }
}

export async function executeRule(ruleId: string, taskId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });
    if (!rule) return { error: "Rule not found" };
    if (!rule.active) return { error: "Rule is inactive" };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { error: "Task not found" };

    let success = true;
    let details = "";

    try {
      const actionConfig = JSON.parse(rule.actionConfig);

      switch (rule.actionType) {
        case "assign": {
          await prisma.task.update({
            where: { id: taskId },
            data: { assigneeId: actionConfig.assigneeId },
          });
          details = `Assigned task to user ${actionConfig.assigneeId}`;
          break;
        }
        case "move_section": {
          await prisma.task.update({
            where: { id: taskId },
            data: { sectionId: actionConfig.sectionId },
          });
          details = `Moved task to section ${actionConfig.sectionId}`;
          break;
        }
        case "set_field": {
          await prisma.customFieldValue.upsert({
            where: {
              taskId_fieldId: { taskId, fieldId: actionConfig.fieldId },
            },
            update: { value: actionConfig.value },
            create: {
              taskId,
              fieldId: actionConfig.fieldId,
              value: actionConfig.value,
            },
          });
          details = `Set field ${actionConfig.fieldId} to ${actionConfig.value}`;
          break;
        }
        case "add_comment": {
          await prisma.comment.create({
            data: {
              text: actionConfig.text || "Auto-generated comment",
              taskId,
              authorId: user.id,
            },
          });
          details = "Added auto comment";
          break;
        }
        case "mark_complete": {
          await prisma.task.update({
            where: { id: taskId },
            data: { completed: true, completedAt: new Date() },
          });
          details = "Marked task as complete";
          break;
        }
        case "set_priority": {
          await prisma.task.update({
            where: { id: taskId },
            data: { priority: actionConfig.priority },
          });
          details = `Set priority to ${actionConfig.priority}`;
          break;
        }
        default:
          success = false;
          details = `Unknown action type: ${rule.actionType}`;
      }
    } catch (e) {
      success = false;
      details = `Execution error: ${e instanceof Error ? e.message : "Unknown error"}`;
    }

    const execution = await prisma.ruleExecution.create({
      data: {
        ruleId,
        userId: user.id,
        success,
        details,
      },
    });

    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${taskId}`);
    return { execution, success, details };
  } catch (error) {
    return { error: "Failed to execute rule" };
  }
}

export async function getRuleExecutions(ruleId: string) {
  try {
    return prisma.ruleExecution.findMany({
      where: { ruleId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  } catch (error) {
    return [];
  }
}

export async function getDefaultRuleTemplates() {
  return [
    {
      name: "Auto-assign new tasks",
      triggerType: "task_created",
      triggerConfig: {},
      actionType: "assign",
      actionConfig: { assigneeId: "" },
      description: "Automatically assign new tasks to a specific team member.",
    },
    {
      name: "Move completed tasks to Done",
      triggerType: "task_completed",
      triggerConfig: {},
      actionType: "move_section",
      actionConfig: { sectionName: "Done" },
      description: "When a task is marked complete, move it to the Done section.",
    },
    {
      name: "Set high priority on overdue",
      triggerType: "due_date_approaching",
      triggerConfig: { daysBefore: 0 },
      actionType: "set_priority",
      actionConfig: { priority: "high" },
      description: "Set priority to high when a task becomes overdue.",
    },
    {
      name: "Notify on assignment change",
      triggerType: "assignee_changed",
      triggerConfig: {},
      actionType: "add_comment",
      actionConfig: { text: "Assignee has been updated." },
      description: "Add a comment when the task assignee changes.",
    },
    {
      name: "Mark complete when moved to Done",
      triggerType: "task_moved",
      triggerConfig: { toSection: "Done" },
      actionType: "mark_complete",
      actionConfig: {},
      description: "Automatically mark a task complete when moved to Done.",
    },
    {
      name: "Auto-categorize by field",
      triggerType: "field_changed",
      triggerConfig: { fieldName: "Type" },
      actionType: "move_section",
      actionConfig: {},
      description: "Move tasks to a specific section based on a custom field value.",
    },
  ];
}
