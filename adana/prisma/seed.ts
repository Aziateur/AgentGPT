import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@adana.app" },
    update: {},
    create: {
      email: "demo@adana.app",
      name: "Demo User",
      password: "demo123",
      avatar: null,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "sarah@adana.app" },
    update: {},
    create: {
      email: "sarah@adana.app",
      name: "Sarah Chen",
      password: "demo123",
      avatar: null,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "alex@adana.app" },
    update: {},
    create: {
      email: "alex@adana.app",
      name: "Alex Johnson",
      password: "demo123",
      avatar: null,
    },
  });

  // Create team
  const team = await prisma.team.upsert({
    where: { id: "team-engineering" },
    update: {},
    create: {
      id: "team-engineering",
      name: "Engineering",
      description: "Product engineering team",
    },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: {},
    create: { teamId: team.id, userId: user.id, role: "admin" },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user2.id } },
    update: {},
    create: { teamId: team.id, userId: user2.id, role: "member" },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user3.id } },
    update: {},
    create: { teamId: team.id, userId: user3.id, role: "member" },
  });

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { id: "project-website" },
    update: {},
    create: {
      id: "project-website",
      name: "Website Redesign",
      description: "Redesign the company website with a modern look and feel",
      color: "#4c6ef5",
      icon: "globe",
      creatorId: user.id,
      teamId: team.id,
      favorite: true,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "project-mobile" },
    update: {},
    create: {
      id: "project-mobile",
      name: "Mobile App v2",
      description: "Build version 2 of the mobile application",
      color: "#51cf66",
      icon: "smartphone",
      creatorId: user.id,
      teamId: team.id,
    },
  });

  const project3 = await prisma.project.upsert({
    where: { id: "project-marketing" },
    update: {},
    create: {
      id: "project-marketing",
      name: "Q2 Marketing Campaign",
      description: "Plan and execute Q2 marketing initiatives",
      color: "#ff6b6b",
      icon: "megaphone",
      creatorId: user2.id,
      teamId: team.id,
    },
  });

  // Add project members
  for (const proj of [project1, project2, project3]) {
    for (const u of [user, user2, user3]) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: proj.id, userId: u.id } },
        update: {},
        create: {
          projectId: proj.id,
          userId: u.id,
          role: u.id === proj.creatorId ? "owner" : "editor",
        },
      });
    }
  }

  // Create sections for project 1
  const sections1 = await Promise.all([
    prisma.section.upsert({
      where: { id: "section-todo" },
      update: {},
      create: { id: "section-todo", name: "To Do", position: 0, projectId: project1.id },
    }),
    prisma.section.upsert({
      where: { id: "section-inprogress" },
      update: {},
      create: { id: "section-inprogress", name: "In Progress", position: 1, projectId: project1.id },
    }),
    prisma.section.upsert({
      where: { id: "section-review" },
      update: {},
      create: { id: "section-review", name: "In Review", position: 2, projectId: project1.id },
    }),
    prisma.section.upsert({
      where: { id: "section-done" },
      update: {},
      create: { id: "section-done", name: "Done", position: 3, projectId: project1.id },
    }),
  ]);

  // Create tasks
  const now = new Date();
  const tasks = [
    { id: "task-1", title: "Design new homepage mockup", sectionId: sections1[1].id, assigneeId: user2.id, priority: "high", dueDate: new Date(now.getTime() + 2 * 86400000) },
    { id: "task-2", title: "Implement responsive navigation", sectionId: sections1[0].id, assigneeId: user3.id, priority: "medium", dueDate: new Date(now.getTime() + 5 * 86400000) },
    { id: "task-3", title: "Set up CI/CD pipeline", sectionId: sections1[2].id, assigneeId: user.id, priority: "high", dueDate: new Date(now.getTime() + 1 * 86400000) },
    { id: "task-4", title: "Write API documentation", sectionId: sections1[0].id, assigneeId: user2.id, priority: "low", dueDate: new Date(now.getTime() + 7 * 86400000) },
    { id: "task-5", title: "Performance optimization audit", sectionId: sections1[0].id, assigneeId: user.id, priority: "medium", dueDate: new Date(now.getTime() + 3 * 86400000) },
    { id: "task-6", title: "User testing sessions", sectionId: sections1[1].id, assigneeId: user3.id, priority: "high", dueDate: new Date(now.getTime() + 4 * 86400000), taskType: "milestone" },
    { id: "task-7", title: "Final design approval", sectionId: sections1[2].id, assigneeId: user.id, priority: "high", dueDate: new Date(now.getTime() + 6 * 86400000), taskType: "approval" },
    { id: "task-8", title: "Deploy to staging", sectionId: sections1[3].id, assigneeId: user.id, priority: "medium", completed: true, completedAt: new Date(now.getTime() - 86400000) },
    { id: "task-9", title: "Create style guide", sectionId: sections1[3].id, assigneeId: user2.id, priority: "low", completed: true, completedAt: new Date(now.getTime() - 2 * 86400000) },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        title: task.title,
        sectionId: task.sectionId,
        projectId: project1.id,
        assigneeId: task.assigneeId,
        creatorId: user.id,
        priority: task.priority,
        dueDate: task.dueDate,
        taskType: task.taskType || "task",
        completed: task.completed || false,
        completedAt: task.completedAt || null,
        position: tasks.indexOf(task),
      },
    });
  }

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: "frontend" }, update: {}, create: { name: "frontend", color: "#4c6ef5" } }),
    prisma.tag.upsert({ where: { name: "backend" }, update: {}, create: { name: "backend", color: "#51cf66" } }),
    prisma.tag.upsert({ where: { name: "design" }, update: {}, create: { name: "design", color: "#ff6b6b" } }),
    prisma.tag.upsert({ where: { name: "bug" }, update: {}, create: { name: "bug", color: "#fcc419" } }),
    prisma.tag.upsert({ where: { name: "feature" }, update: {}, create: { name: "feature", color: "#845ef7" } }),
  ]);

  // Add dependencies
  await prisma.dependency.upsert({
    where: { blockedTaskId_blockingTaskId: { blockedTaskId: "task-7", blockingTaskId: "task-6" } },
    update: {},
    create: { blockedTaskId: "task-7", blockingTaskId: "task-6" },
  });

  await prisma.dependency.upsert({
    where: { blockedTaskId_blockingTaskId: { blockedTaskId: "task-2", blockingTaskId: "task-1" } },
    update: {},
    create: { blockedTaskId: "task-2", blockingTaskId: "task-1" },
  });

  // Create comments
  await prisma.comment.upsert({
    where: { id: "comment-1" },
    update: {},
    create: {
      id: "comment-1",
      text: "Looking great! Let's make sure we test on mobile devices too.",
      taskId: "task-1",
      authorId: user.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: "comment-2" },
    update: {},
    create: {
      id: "comment-2",
      text: "I've updated the design to include the new color scheme.",
      taskId: "task-1",
      authorId: user2.id,
    },
  });

  // Create notifications
  const notifications = [
    { userId: user.id, type: "assigned", title: "New task assigned", message: "You've been assigned 'Set up CI/CD pipeline'" },
    { userId: user.id, type: "commented", title: "New comment", message: "Sarah commented on 'Design new homepage mockup'" },
    { userId: user.id, type: "completed", title: "Task completed", message: "Alex completed 'Deploy to staging'" },
  ];
  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  // Create portfolio
  const portfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio-q2" },
    update: {},
    create: {
      id: "portfolio-q2",
      name: "Q2 2026 Initiatives",
      description: "All Q2 projects tracked together",
      ownerId: user.id,
    },
  });

  for (const proj of [project1, project2, project3]) {
    await prisma.portfolioProject.upsert({
      where: { portfolioId_projectId: { portfolioId: portfolio.id, projectId: proj.id } },
      update: {},
      create: { portfolioId: portfolio.id, projectId: proj.id },
    });
  }

  // Create goals
  await prisma.goal.upsert({
    where: { id: "goal-launch" },
    update: {},
    create: {
      id: "goal-launch",
      name: "Launch new website by Q2",
      description: "Complete redesign and launch the new company website",
      status: "on_track",
      progress: 45,
      period: "Q2_2026",
      ownerId: user.id,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-mobile" },
    update: {},
    create: {
      id: "goal-mobile",
      name: "Ship Mobile App v2",
      description: "Release version 2 with all planned features",
      status: "at_risk",
      progress: 25,
      period: "Q2_2026",
      ownerId: user2.id,
    },
  });

  // Create automation rule
  await prisma.automationRule.upsert({
    where: { id: "rule-1" },
    update: {},
    create: {
      id: "rule-1",
      name: "Move completed to Done",
      triggerType: "task_completed",
      triggerConfig: JSON.stringify({}),
      actionType: "move_section",
      actionConfig: JSON.stringify({ sectionId: "section-done" }),
      projectId: project1.id,
      creatorId: user.id,
    },
  });

  await prisma.automationRule.upsert({
    where: { id: "rule-2" },
    update: {},
    create: {
      id: "rule-2",
      name: "Auto-assign high priority to lead",
      triggerType: "task_created",
      triggerConfig: JSON.stringify({ priority: "high" }),
      actionType: "assign",
      actionConfig: JSON.stringify({ userId: user.id }),
      projectId: project1.id,
      creatorId: user.id,
    },
  });

  // Create project statuses
  const statuses = [
    { projectId: project1.id, authorId: user.id, status: "on_track", text: "Design phase nearly complete. On schedule for Q2 launch." },
    { projectId: project2.id, authorId: user2.id, status: "at_risk", text: "Some delays in the API integration. Need additional resources." },
    { projectId: project3.id, authorId: user2.id, status: "on_track", text: "Campaign planning underway. Content creation started." },
  ];
  for (const s of statuses) {
    await prisma.projectStatus.create({ data: s });
  }

  // Create custom fields
  const customField = await prisma.customFieldDef.upsert({
    where: { id: "field-story-points" },
    update: {},
    create: {
      id: "field-story-points",
      name: "Story Points",
      fieldType: "number",
      projectId: project1.id,
    },
  });

  await prisma.customFieldDef.upsert({
    where: { id: "field-sprint" },
    update: {},
    create: {
      id: "field-sprint",
      name: "Sprint",
      fieldType: "dropdown",
      options: JSON.stringify(["Sprint 1", "Sprint 2", "Sprint 3", "Backlog"]),
      projectId: project1.id,
    },
  });

  console.log("Seed completed successfully!");
  console.log(`Created ${await prisma.user.count()} users`);
  console.log(`Created ${await prisma.project.count()} projects`);
  console.log(`Created ${await prisma.task.count()} tasks`);
  console.log(`Created ${await prisma.team.count()} teams`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
