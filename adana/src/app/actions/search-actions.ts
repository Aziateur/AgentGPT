"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth-actions";

export async function globalSearch(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { tasks: [], projects: [], users: [] };
    }

    const searchTerm = query.trim();

    const [tasks, projects, users] = await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        take: 20,
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
          archived: false,
        },
        take: 10,
        include: {
          _count: { select: { tasks: true, members: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { email: { contains: searchTerm } },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true, avatar: true },
      }),
    ]);

    return { tasks, projects, users };
  } catch (error) {
    return { tasks: [], projects: [], users: [] };
  }
}

export async function advancedSearch(filters: {
  query?: string;
  projectId?: string;
  assigneeId?: string;
  completed?: boolean;
  priority?: string;
  taskType?: string;
  dueBefore?: string;
  dueAfter?: string;
  createdBefore?: string;
  createdAfter?: string;
  hasAttachments?: boolean;
  tags?: string[];
}) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query } },
        { description: { contains: filters.query } },
      ];
    }
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.completed !== undefined) where.completed = filters.completed;
    if (filters.priority) where.priority = filters.priority;
    if (filters.taskType) where.taskType = filters.taskType;

    if (filters.dueBefore || filters.dueAfter) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueBefore) dueDateFilter.lte = new Date(filters.dueBefore);
      if (filters.dueAfter) dueDateFilter.gte = new Date(filters.dueAfter);
      where.dueDate = dueDateFilter;
    }

    if (filters.createdBefore || filters.createdAfter) {
      const createdFilter: Record<string, Date> = {};
      if (filters.createdBefore) createdFilter.lte = new Date(filters.createdBefore);
      if (filters.createdAfter) createdFilter.gte = new Date(filters.createdAfter);
      where.createdAt = createdFilter;
    }

    if (filters.hasAttachments) {
      where.attachments = { some: {} };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: filters.tags },
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      take: 100,
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        section: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return tasks;
  } catch (error) {
    return [];
  }
}

export async function saveSearch(
  name: string,
  query: string,
  filters: Record<string, unknown>
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const savedSearch = await prisma.savedSearch.create({
      data: {
        name,
        query,
        filters: JSON.stringify(filters),
        userId: user.id,
      },
    });

    return { savedSearch };
  } catch (error) {
    return { error: "Failed to save search" };
  }
}

export async function getSavedSearches(userId?: string) {
  try {
    let uid = userId;
    if (!uid) {
      const user = await getCurrentUser();
      if (!user) return [];
      uid = user.id;
    }

    const searches = await prisma.savedSearch.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
    });

    return searches.map((s: (typeof searches)[number]) => ({
      ...s,
      filters: JSON.parse(s.filters),
    }));
  } catch (error) {
    return [];
  }
}
