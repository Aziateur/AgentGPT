"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTags() {
  try {
    return prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { tasks: true } },
      },
    });
  } catch (error) {
    return [];
  }
}

export async function createTag(name: string, color: string = "#6c757d") {
  try {
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      return { error: "A tag with this name already exists", tag: existing };
    }

    const tag = await prisma.tag.create({
      data: { name, color },
    });

    return { tag };
  } catch (error) {
    return { error: "Failed to create tag" };
  }
}

export async function addTagToTask(taskId: string, tagId: string) {
  try {
    const taskTag = await prisma.taskTag.create({
      data: { taskId, tagId },
      include: {
        tag: true,
      },
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (task?.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${taskId}`);
    return { taskTag };
  } catch (error) {
    return { error: "Failed to add tag to task" };
  }
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  try {
    await prisma.taskTag.delete({
      where: { taskId_tagId: { taskId, tagId } },
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (task?.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${taskId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to remove tag from task" };
  }
}
