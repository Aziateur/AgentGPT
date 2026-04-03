"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getTasks(
  projectId?: string,
  filters?: {
    assigneeId?: string;
    completed?: boolean;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    dueBefore?: string;
    dueAfter?: string;
  }
) {
  try {
    const where: Record<string, unknown> = {};

    if (projectId) where.projectId = projectId;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.completed !== undefined) where.completed = filters.completed;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.search) {
      where.title = { contains: filters.search };
    }
    if (filters?.dueBefore || filters?.dueAfter) {
      where.dueDate = {};
      if (filters?.dueBefore)
        (where.dueDate as Record<string, unknown>).lte = new Date(filters.dueBefore);
      if (filters?.dueAfter)
        (where.dueDate as Record<string, unknown>).gte = new Date(filters.dueAfter);
    }

    // Only top-level tasks (not subtasks)
    where.parentId = null;

    const orderBy: Record<string, string> = {};
    const sortBy = filters?.sortBy || "position";
    const sortOrder = filters?.sortOrder || "asc";
    orderBy[sortBy] = sortOrder;

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        section: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: { select: { subtasks: true, comments: true, likes: true } },
      },
    });

    return tasks;
  } catch (error) {
    return [];
  }
}

export async function getTask(id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        section: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true } },
        subtasks: {
          orderBy: { position: "asc" },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            likes: true,
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        tags: { include: { tag: true } },
        customValues: {
          include: { field: true },
        },
        blockedBy: {
          include: {
            blockingTask: {
              select: { id: true, title: true, completed: true },
            },
          },
        },
        blocking: {
          include: {
            blockedTask: {
              select: { id: true, title: true, completed: true },
            },
          },
        },
        likes: true,
        followers: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true, comments: true, likes: true } },
      },
    });

    return task;
  } catch (error) {
    return null;
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: string;
  taskType?: string;
  parentId?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    // Get the next position in the section or project
    const lastTask = await prisma.task.findFirst({
      where: {
        sectionId: data.sectionId || undefined,
        projectId: data.projectId || undefined,
        parentId: data.parentId || null,
      },
      orderBy: { position: "desc" },
    });

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        sectionId: data.sectionId,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        taskType: data.taskType || "task",
        parentId: data.parentId,
        creatorId: user.id,
        position: (lastTask?.position ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (data.projectId) {
      revalidatePath(`/projects/${data.projectId}`);
    }
    revalidatePath("/");
    return { task };
  } catch (error) {
    return { error: "Failed to create task" };
  }
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    startDate?: string | null;
    priority?: string | null;
    sectionId?: string;
    position?: number;
    taskType?: string;
    approvalStatus?: string;
  }
) {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.sectionId !== undefined) updateData.sectionId = data.sectionId;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.taskType !== undefined) updateData.taskType = data.taskType;
    if (data.approvalStatus !== undefined) updateData.approvalStatus = data.approvalStatus;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true } },
      },
    });

    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${id}`);
    return { task };
  } catch (error) {
    return { error: "Failed to update task" };
  }
}

export async function deleteTask(id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { projectId: true },
    });

    await prisma.task.delete({ where: { id } });

    if (task?.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete task" };
  }
}

export async function toggleComplete(id: string) {
  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return { error: "Task not found" };

    const updated = await prisma.task.update({
      where: { id },
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
    });

    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${id}`);
    return { task: updated };
  } catch (error) {
    return { error: "Failed to toggle task completion" };
  }
}

export async function duplicateTask(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const original = await prisma.task.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!original) return { error: "Task not found" };

    const duplicate = await prisma.task.create({
      data: {
        title: `${original.title} (copy)`,
        description: original.description,
        projectId: original.projectId,
        sectionId: original.sectionId,
        assigneeId: original.assigneeId,
        dueDate: original.dueDate,
        startDate: original.startDate,
        priority: original.priority,
        taskType: original.taskType,
        creatorId: user.id,
        position: original.position + 1,
        tags: {
          create: original.tags.map((t) => ({
            tagId: t.tagId,
          })),
        },
      },
    });

    if (original.projectId) {
      revalidatePath(`/projects/${original.projectId}`);
    }
    return { task: duplicate };
  } catch (error) {
    return { error: "Failed to duplicate task" };
  }
}

export async function moveTask(id: string, sectionId: string) {
  try {
    const lastTask = await prisma.task.findFirst({
      where: { sectionId },
      orderBy: { position: "desc" },
    });

    const task = await prisma.task.update({
      where: { id },
      data: {
        sectionId,
        position: (lastTask?.position ?? -1) + 1,
      },
    });

    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    return { task };
  } catch (error) {
    return { error: "Failed to move task" };
  }
}

export async function addSubtask(
  parentId: string,
  data: { title: string; assigneeId?: string; dueDate?: string }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const parent = await prisma.task.findUnique({ where: { id: parentId } });
    if (!parent) return { error: "Parent task not found" };

    const lastSubtask = await prisma.task.findFirst({
      where: { parentId },
      orderBy: { position: "desc" },
    });

    const subtask = await prisma.task.create({
      data: {
        title: data.title,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        parentId,
        projectId: parent.projectId,
        sectionId: parent.sectionId,
        creatorId: user.id,
        position: (lastSubtask?.position ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (parent.projectId) {
      revalidatePath(`/projects/${parent.projectId}`);
    }
    revalidatePath(`/tasks/${parentId}`);
    return { subtask };
  } catch (error) {
    return { error: "Failed to add subtask" };
  }
}

export async function getMyTasks(userId?: string) {
  try {
    let uid = userId;
    if (!uid) {
      const user = await getCurrentUser();
      if (!user) return { today: [], upcoming: [], later: [] };
      uid = user.id;
    }

    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const baseCriteria = {
      assigneeId: uid,
      completed: false,
      parentId: null,
    };

    const include = {
      project: { select: { id: true, name: true, color: true } },
      section: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      _count: { select: { subtasks: true } },
    } as const;

    const [today, upcoming, later] = await Promise.all([
      prisma.task.findMany({
        where: {
          ...baseCriteria,
          OR: [
            { dueDate: { lte: todayEnd } },
            { dueDate: null },
          ],
        },
        include,
        orderBy: { position: "asc" },
      }),
      prisma.task.findMany({
        where: {
          ...baseCriteria,
          dueDate: { gt: todayEnd, lte: weekEnd },
        },
        include,
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: {
          ...baseCriteria,
          dueDate: { gt: weekEnd },
        },
        include,
        orderBy: { dueDate: "asc" },
      }),
    ]);

    return { today, upcoming, later };
  } catch (error) {
    return { today: [], upcoming: [], later: [] };
  }
}

export async function setApprovalStatus(
  id: string,
  status: "pending" | "approved" | "changes_requested" | "rejected"
) {
  try {
    const task = await prisma.task.update({
      where: { id },
      data: { approvalStatus: status },
    });

    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath(`/tasks/${id}`);
    return { task };
  } catch (error) {
    return { error: "Failed to set approval status" };
  }
}
