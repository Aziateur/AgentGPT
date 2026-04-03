"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addDependency(blockedTaskId: string, blockingTaskId: string) {
  try {
    if (blockedTaskId === blockingTaskId) {
      return { error: "A task cannot depend on itself" };
    }

    // Check for circular dependency
    const wouldCreateCycle = await checkCircularDependency(
      blockingTaskId,
      blockedTaskId
    );
    if (wouldCreateCycle) {
      return { error: "This would create a circular dependency" };
    }

    const dependency = await prisma.dependency.create({
      data: { blockedTaskId, blockingTaskId },
      include: {
        blockedTask: { select: { id: true, title: true } },
        blockingTask: { select: { id: true, title: true } },
      },
    });

    revalidatePath(`/tasks/${blockedTaskId}`);
    revalidatePath(`/tasks/${blockingTaskId}`);
    return { dependency };
  } catch (error) {
    return { error: "Failed to add dependency" };
  }
}

async function checkCircularDependency(
  taskId: string,
  targetId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  if (taskId === targetId) return true;
  if (visited.has(taskId)) return false;
  visited.add(taskId);

  const deps = await prisma.dependency.findMany({
    where: { blockedTaskId: taskId },
    select: { blockingTaskId: true },
  });

  for (const dep of deps) {
    if (await checkCircularDependency(dep.blockingTaskId, targetId, visited)) {
      return true;
    }
  }

  return false;
}

export async function removeDependency(id: string) {
  try {
    const dep = await prisma.dependency.findUnique({
      where: { id },
      select: { blockedTaskId: true, blockingTaskId: true },
    });

    await prisma.dependency.delete({ where: { id } });

    if (dep) {
      revalidatePath(`/tasks/${dep.blockedTaskId}`);
      revalidatePath(`/tasks/${dep.blockingTaskId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to remove dependency" };
  }
}

export async function getDependencies(taskId: string) {
  try {
    const [blockedBy, blocking] = await Promise.all([
      prisma.dependency.findMany({
        where: { blockedTaskId: taskId },
        include: {
          blockingTask: {
            select: { id: true, title: true, completed: true, assignee: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
      prisma.dependency.findMany({
        where: { blockingTaskId: taskId },
        include: {
          blockedTask: {
            select: { id: true, title: true, completed: true, assignee: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
    ]);

    return { blockedBy, blocking };
  } catch (error) {
    return { blockedBy: [], blocking: [] };
  }
}

export async function getBlockedTasks(taskId: string) {
  try {
    const deps = await prisma.dependency.findMany({
      where: { blockingTaskId: taskId },
      include: {
        blockedTask: {
          select: { id: true, title: true, completed: true, dueDate: true },
        },
      },
    });
    return deps.map((d) => d.blockedTask);
  } catch (error) {
    return [];
  }
}

export async function getBlockingTasks(taskId: string) {
  try {
    const deps = await prisma.dependency.findMany({
      where: { blockedTaskId: taskId },
      include: {
        blockingTask: {
          select: { id: true, title: true, completed: true, dueDate: true },
        },
      },
    });
    return deps.map((d) => d.blockingTask);
  } catch (error) {
    return [];
  }
}
