"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getPortfolios() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { projects: true } },
      },
    });
    return portfolios;
  } catch (error) {
    return [];
  }
}

export async function getPortfolio(id: string) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        projects: {
          include: {
            project: {
              include: {
                creator: { select: { id: true, name: true, avatar: true } },
                statuses: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  include: {
                    author: { select: { id: true, name: true, avatar: true } },
                  },
                },
                _count: { select: { tasks: true, members: true } },
              },
            },
          },
        },
      },
    });
    return portfolio;
  } catch (error) {
    return null;
  }
}

export async function createPortfolio(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const portfolio = await prisma.portfolio.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#4c6ef5",
        ownerId: user.id,
      },
    });

    revalidatePath("/portfolios");
    return { portfolio };
  } catch (error) {
    return { error: "Failed to create portfolio" };
  }
}

export async function addProjectToPortfolio(portfolioId: string, projectId: string) {
  try {
    const link = await prisma.portfolioProject.create({
      data: { portfolioId, projectId },
    });

    revalidatePath(`/portfolios/${portfolioId}`);
    return { link };
  } catch (error) {
    return { error: "Failed to add project to portfolio" };
  }
}

export async function removeProjectFromPortfolio(portfolioId: string, projectId: string) {
  try {
    await prisma.portfolioProject.delete({
      where: {
        portfolioId_projectId: { portfolioId, projectId },
      },
    });

    revalidatePath(`/portfolios/${portfolioId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to remove project from portfolio" };
  }
}
