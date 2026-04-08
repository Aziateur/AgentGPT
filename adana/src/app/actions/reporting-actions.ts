"use server";

import { prisma } from "@/lib/prisma";

export async function getProjectStats(projectId: string) {
  try {
    const [tasks, sections] = await Promise.all([
      prisma.task.findMany({
        where: { projectId, parentId: null },
        select: {
          id: true,
          completed: true,
          priority: true,
          assigneeId: true,
          sectionId: true,
          dueDate: true,
          completedAt: true,
        },
      }),
      prisma.section.findMany({
        where: { projectId },
        select: { id: true, name: true },
      }),
    ]);

    type TaskRow = (typeof tasks)[number];
    type UserInfo = { id: string; name: string; avatar: string | null };

    const total = tasks.length;
    const completed = tasks.filter((t: TaskRow) => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Tasks by status (section)
    const sectionMap = new Map(sections.map((s: (typeof sections)[number]) => [s.id, s.name]));
    const bySection: Record<string, number> = {};
    for (const task of tasks) {
      const sectionName = task.sectionId
        ? sectionMap.get(task.sectionId) || "Unknown"
        : "No Section";
      bySection[sectionName as string] = (bySection[sectionName as string] || 0) + 1;
    }

    // Tasks by priority
    const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0, none: 0 };
    for (const task of tasks) {
      const p = task.priority || "none";
      byPriority[p] = (byPriority[p] || 0) + 1;
    }

    // Tasks by assignee
    const assigneeIds = Array.from(new Set(tasks.map((t: TaskRow) => t.assigneeId).filter(Boolean))) as string[];
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, avatar: true },
    });
    const assigneeMap = new Map(assignees.map((a: UserInfo) => [a.id, a]));

    const byAssignee: { user: UserInfo; count: number; completedCount: number }[] = [];
    const assigneeCounts = new Map<string, { count: number; completed: number }>();

    for (const task of tasks) {
      const aid = task.assigneeId || "unassigned";
      const current = assigneeCounts.get(aid) || { count: 0, completed: 0 };
      current.count++;
      if (task.completed) current.completed++;
      assigneeCounts.set(aid, current);
    }

    for (const [aid, counts] of Array.from(assigneeCounts)) {
      const user: UserInfo = aid === "unassigned"
        ? { id: "unassigned", name: "Unassigned", avatar: null }
        : (assigneeMap.get(aid) as UserInfo) || { id: aid, name: "Unknown", avatar: null };
      byAssignee.push({ user, count: counts.count, completedCount: counts.completed });
    }
    byAssignee.sort((a: { count: number }, b: { count: number }) => b.count - a.count);

    // Overdue count
    const now = new Date();
    const overdue = tasks.filter(
      (t: TaskRow) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;

    return {
      total,
      completed,
      completionRate,
      overdue,
      bySection,
      byPriority,
      byAssignee,
    };
  } catch (error) {
    return {
      total: 0,
      completed: 0,
      completionRate: 0,
      overdue: 0,
      bySection: {},
      byPriority: {},
      byAssignee: [],
    };
  }
}

export async function getWorkloadData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        assignedTasks: {
          where: { completed: false, parentId: null },
          select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            project: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    type UserRow = (typeof users)[number];
    type AssignedTask = UserRow["assignedTasks"][number];

    return users.map((u: UserRow) => {
      const overdue = u.assignedTasks.filter(
        (t: AssignedTask) => t.dueDate && new Date(t.dueDate) < new Date()
      ).length;

      return {
        user: { id: u.id, name: u.name, avatar: u.avatar },
        taskCount: u.assignedTasks.length,
        overdueCount: overdue,
        tasks: u.assignedTasks,
      };
    }).sort((a: { taskCount: number }, b: { taskCount: number }) => b.taskCount - a.taskCount);
  } catch (error) {
    return [];
  }
}

export async function getDashboardData() {
  try {
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalUsers,
      recentTasks,
      recentActivity,
    ] = await Promise.all([
      prisma.project.count({ where: { archived: false } }),
      prisma.task.count({ where: { parentId: null } }),
      prisma.task.count({ where: { completed: true, parentId: null } }),
      prisma.task.count({
        where: {
          completed: false,
          parentId: null,
          dueDate: { lt: new Date() },
        },
      }),
      prisma.user.count(),
      prisma.task.findMany({
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          task: { select: { id: true, title: true } },
        },
      }),
    ]);

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalUsers,
      completionRate,
      recentTasks,
      recentActivity,
    };
  } catch (error) {
    return {
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      totalUsers: 0,
      completionRate: 0,
      recentTasks: [],
      recentActivity: [],
    };
  }
}

export async function getTaskCompletionTrend(projectId: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentId: null,
        completedAt: { gte: startDate },
      },
      select: { completedAt: true },
      orderBy: { completedAt: "asc" },
    });

    // Also get tasks created in that period
    const createdTasks = await prisma.task.findMany({
      where: {
        projectId,
        parentId: null,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Build daily trend
    const trend: { date: string; completed: number; created: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayCompleted = tasks.filter((t: { completedAt: Date | null }) => {
        if (!t.completedAt) return false;
        return t.completedAt.toISOString().split("T")[0] === dateStr;
      }).length;

      const dayCreated = createdTasks.filter((t: { createdAt: Date }) => {
        return t.createdAt.toISOString().split("T")[0] === dateStr;
      }).length;

      trend.push({ date: dateStr, completed: dayCompleted, created: dayCreated });
    }

    return trend;
  } catch (error) {
    return [];
  }
}
