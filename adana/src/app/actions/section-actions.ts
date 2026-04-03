"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSections(projectId: string) {
  try {
    return prisma.section.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
      include: {
        _count: { select: { tasks: true } },
      },
    });
  } catch (error) {
    return [];
  }
}

export async function createSection(projectId: string, name: string) {
  try {
    const lastSection = await prisma.section.findFirst({
      where: { projectId },
      orderBy: { position: "desc" },
    });

    const section = await prisma.section.create({
      data: {
        name,
        projectId,
        position: (lastSection?.position ?? -1) + 1,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { section };
  } catch (error) {
    return { error: "Failed to create section" };
  }
}

export async function updateSection(id: string, name: string) {
  try {
    const section = await prisma.section.update({
      where: { id },
      data: { name },
    });

    revalidatePath(`/projects/${section.projectId}`);
    return { section };
  } catch (error) {
    return { error: "Failed to update section" };
  }
}

export async function deleteSection(id: string) {
  try {
    const section = await prisma.section.findUnique({
      where: { id },
      select: { projectId: true },
    });

    // Move tasks to no section before deleting
    await prisma.task.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

    await prisma.section.delete({ where: { id } });

    if (section?.projectId) {
      revalidatePath(`/projects/${section.projectId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete section" };
  }
}

export async function reorderSections(projectId: string, sectionIds: string[]) {
  try {
    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.section.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to reorder sections" };
  }
}
