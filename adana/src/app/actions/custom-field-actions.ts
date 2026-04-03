"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomFields(projectId: string) {
  try {
    return prisma.customFieldDef.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { values: true } },
      },
    });
  } catch (error) {
    return [];
  }
}

export async function createCustomField(
  projectId: string,
  data: {
    name: string;
    fieldType: string;
    options?: string[];
  }
) {
  try {
    const field = await prisma.customFieldDef.create({
      data: {
        name: data.name,
        fieldType: data.fieldType,
        options: data.options ? JSON.stringify(data.options) : null,
        projectId,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { field };
  } catch (error) {
    return { error: "Failed to create custom field" };
  }
}

export async function setCustomFieldValue(
  taskId: string,
  fieldId: string,
  value: string | null
) {
  try {
    const fieldValue = await prisma.customFieldValue.upsert({
      where: {
        taskId_fieldId: { taskId, fieldId },
      },
      update: { value },
      create: { taskId, fieldId, value },
      include: { field: true },
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (task?.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${taskId}`);
    return { fieldValue };
  } catch (error) {
    return { error: "Failed to set custom field value" };
  }
}

export async function deleteCustomField(id: string) {
  try {
    const field = await prisma.customFieldDef.findUnique({
      where: { id },
      select: { projectId: true },
    });

    await prisma.customFieldDef.delete({ where: { id } });

    if (field?.projectId) {
      revalidatePath(`/projects/${field.projectId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete custom field" };
  }
}
