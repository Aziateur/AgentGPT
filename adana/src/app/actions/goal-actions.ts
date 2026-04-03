"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getGoals() {
  try {
    const goals = await prisma.goal.findMany({
      where: { parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        subGoals: {
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { projects: true, subGoals: true } },
      },
    });
    return goals;
  } catch (error) {
    return [];
  }
}

export async function getGoal(id: string) {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        parent: {
          select: { id: true, name: true, status: true },
        },
        subGoals: {
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
            _count: { select: { projects: true, subGoals: true } },
          },
        },
        projects: {
          include: {
            project: {
              include: {
                _count: { select: { tasks: true } },
                statuses: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    return goal;
  } catch (error) {
    return null;
  }
}

export async function createGoal(data: {
  name: string;
  description?: string;
  status?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  parentId?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const goal = await prisma.goal.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || "on_track",
        period: data.period,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        parentId: data.parentId,
        ownerId: user.id,
      },
    });

    revalidatePath("/goals");
    return { goal };
  } catch (error) {
    return { error: "Failed to create goal" };
  }
}

export async function updateGoal(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    progress?: number;
    period?: string;
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/goals");
    revalidatePath(`/goals/${id}`);
    return { goal };
  } catch (error) {
    return { error: "Failed to update goal" };
  }
}

export async function deleteGoal(id: string) {
  try {
    await prisma.goal.delete({ where: { id } });
    revalidatePath("/goals");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete goal" };
  }
}

export async function linkProjectToGoal(goalId: string, projectId: string) {
  try {
    const link = await prisma.goalProject.create({
      data: { goalId, projectId },
    });

    revalidatePath(`/goals/${goalId}`);
    return { link };
  } catch (error) {
    return { error: "Failed to link project to goal" };
  }
}
