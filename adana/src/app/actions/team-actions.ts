"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeams() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true, projects: true } },
      },
    });
    return teams;
  } catch (error) {
    return [];
  }
}

export async function getTeam(id: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        projects: {
          where: { archived: false },
          include: {
            _count: { select: { tasks: true, members: true } },
            creator: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: { select: { members: true, projects: true } },
      },
    });
    return team;
  } catch (error) {
    return null;
  }
}

export async function createTeam(data: {
  name: string;
  description?: string;
}) {
  try {
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    revalidatePath("/teams");
    return { team };
  } catch (error) {
    return { error: "Failed to create team" };
  }
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: string = "member"
) {
  try {
    const member = await prisma.teamMember.create({
      data: { teamId, userId, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    revalidatePath(`/teams/${teamId}`);
    return { member };
  } catch (error) {
    return { error: "Failed to add team member" };
  }
}

export async function removeTeamMember(teamId: string, userId: string) {
  try {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to remove team member" };
  }
}
