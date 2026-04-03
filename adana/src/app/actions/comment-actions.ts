"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getComments(taskId: string) {
  try {
    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        likes: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        _count: { select: { likes: true } },
      },
    });
  } catch (error) {
    return [];
  }
}

export async function addComment(taskId: string, text: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const comment = await prisma.comment.create({
      data: {
        text,
        taskId,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    revalidatePath(`/tasks/${taskId}`);
    return { comment };
  } catch (error) {
    return { error: "Failed to add comment" };
  }
}

export async function deleteComment(id: string) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { taskId: true },
    });

    await prisma.comment.delete({ where: { id } });

    if (comment?.taskId) {
      revalidatePath(`/tasks/${comment.taskId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete comment" };
  }
}

export async function toggleTaskLike(taskId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const existing = await prisma.taskLike.findUnique({
      where: { taskId_userId: { taskId, userId: user.id } },
    });

    if (existing) {
      await prisma.taskLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.taskLike.create({
        data: { taskId, userId: user.id },
      });
    }

    revalidatePath(`/tasks/${taskId}`);
    return { liked: !existing };
  } catch (error) {
    return { error: "Failed to toggle like" };
  }
}

export async function toggleCommentLike(commentId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentLike.create({
        data: { commentId, userId: user.id },
      });
    }

    revalidatePath("/");
    return { liked: !existing };
  } catch (error) {
    return { error: "Failed to toggle comment like" };
  }
}

export async function toggleFollowTask(taskId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const existing = await prisma.taskFollower.findUnique({
      where: { taskId_userId: { taskId, userId: user.id } },
    });

    if (existing) {
      await prisma.taskFollower.delete({ where: { id: existing.id } });
    } else {
      await prisma.taskFollower.create({
        data: { taskId, userId: user.id },
      });
    }

    revalidatePath(`/tasks/${taskId}`);
    return { following: !existing };
  } catch (error) {
    return { error: "Failed to toggle follow" };
  }
}
