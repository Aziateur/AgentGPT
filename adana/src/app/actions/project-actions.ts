"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { archived: false },
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }],
    });

    return projects.map((p) => ({
      ...p,
      memberCount: p._count.members,
      taskCount: p._count.tasks,
    }));
  } catch (error) {
    return [];
  }
}

export async function getProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              orderBy: { position: "asc" },
              include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                tags: { include: { tag: true } },
                _count: { select: { subtasks: true, comments: true } },
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        statuses: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { tasks: true, members: true } },
      },
    });

    return project;
  } catch (error) {
    return null;
  }
}

export async function createProject(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  defaultView?: string;
  teamId?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#4c6ef5",
        icon: data.icon || "folder",
        defaultView: data.defaultView || "list",
        creatorId: user.id,
        teamId: data.teamId,
        sections: {
          create: [
            { name: "To do", position: 0 },
            { name: "In progress", position: 1 },
            { name: "Done", position: 2 },
          ],
        },
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/projects");
    return { project };
  } catch (error) {
    return { error: "Failed to create project" };
  }
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    defaultView?: string;
  }
) {
  try {
    const project = await prisma.project.update({
      where: { id },
      data,
    });

    revalidatePath("/");
    revalidatePath(`/projects/${id}`);
    return { project };
  } catch (error) {
    return { error: "Failed to update project" };
  }
}

export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete project" };
  }
}

export async function archiveProject(id: string) {
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return { error: "Project not found" };

    await prisma.project.update({
      where: { id },
      data: { archived: !project.archived },
    });

    revalidatePath("/");
    revalidatePath(`/projects/${id}`);
    return { success: true, archived: !project.archived };
  } catch (error) {
    return { error: "Failed to archive project" };
  }
}

export async function toggleFavorite(id: string) {
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return { error: "Project not found" };

    await prisma.project.update({
      where: { id },
      data: { favorite: !project.favorite },
    });

    revalidatePath("/");
    revalidatePath(`/projects/${id}`);
    return { success: true, favorite: !project.favorite };
  } catch (error) {
    return { error: "Failed to toggle favorite" };
  }
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: string = "editor"
) {
  try {
    const member = await prisma.projectMember.create({
      data: { projectId, userId, role },
    });

    revalidatePath(`/projects/${projectId}`);
    return { member };
  } catch (error) {
    return { error: "Failed to add project member" };
  }
}

export async function createProjectStatus(
  projectId: string,
  status: string,
  text?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const projectStatus = await prisma.projectStatus.create({
      data: {
        status,
        text,
        projectId,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { status: projectStatus };
  } catch (error) {
    return { error: "Failed to create project status" };
  }
}

export async function getProjectStatuses(projectId: string) {
  try {
    return prisma.projectStatus.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
  } catch (error) {
    return [];
  }
}
