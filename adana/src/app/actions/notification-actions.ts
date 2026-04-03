"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getNotifications(userId?: string) {
  try {
    let uid = userId;
    if (!uid) {
      const user = await getCurrentUser();
      if (!user) return [];
      uid = user.id;
    }

    return prisma.notification.findMany({
      where: { userId: uid, archived: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (error) {
    return [];
  }
}

export async function markAsRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return { error: "Failed to mark notification as read" };
  }
}

export async function markAllAsRead(userId?: string) {
  try {
    let uid = userId;
    if (!uid) {
      const user = await getCurrentUser();
      if (!user) return { error: "Not authenticated" };
      uid = user.id;
    }

    await prisma.notification.updateMany({
      where: { userId: uid, read: false },
      data: { read: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return { error: "Failed to mark all notifications as read" };
  }
}

export async function archiveNotification(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { archived: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return { error: "Failed to archive notification" };
  }
}

export async function createNotification(data: {
  type: string;
  title: string;
  message?: string;
  userId: string;
  linkUrl?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        linkUrl: data.linkUrl,
      },
    });

    revalidatePath("/notifications");
    return { notification };
  } catch (error) {
    return { error: "Failed to create notification" };
  }
}

export async function getUnreadCount(userId?: string) {
  try {
    let uid = userId;
    if (!uid) {
      const user = await getCurrentUser();
      if (!user) return 0;
      uid = user.id;
    }

    const count = await prisma.notification.count({
      where: { userId: uid, read: false, archived: false },
    });

    return count;
  } catch (error) {
    return 0;
  }
}
