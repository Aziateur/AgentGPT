import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  mockUsers,
  mockProjects,
  mockSections,
  mockTasks,
  mockNotifications,
  mockCurrentUser,
} from "@/lib/mock-data";
import type { User, Project, Section, Task, Notification } from "@/types";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mappers
// ---------------------------------------------------------------------------

function dbToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    color: (r.color as string) ?? "#6366f1",
    icon: (r.icon as string) ?? "folder",
    archived: (r.archived as boolean) ?? false,
    favorite: (r.favorite as boolean) ?? false,
    defaultView: (r.default_view as string) ?? "list",
    creatorId: (r.owner_id as string) ?? "",
  };
}

function projectToDb(p: Partial<Project>) {
  const row: Record<string, unknown> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.color !== undefined) row.color = p.color;
  if (p.icon !== undefined) row.icon = p.icon;
  if (p.archived !== undefined) row.archived = p.archived;
  if (p.favorite !== undefined) row.favorite = p.favorite;
  if (p.defaultView !== undefined) row.default_view = p.defaultView;
  if (p.creatorId !== undefined) row.owner_id = p.creatorId;
  return row;
}

function dbToSection(r: Record<string, unknown>): Section {
  return {
    id: r.id as string,
    name: r.name as string,
    position: (r.position as number) ?? 0,
    projectId: (r.project_id as string) ?? "",
  };
}

function sectionToDb(s: Partial<Section>) {
  const row: Record<string, unknown> = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.name !== undefined) row.name = s.name;
  if (s.position !== undefined) row.position = s.position;
  if (s.projectId !== undefined) row.project_id = s.projectId;
  return row;
}

function dbToTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? null,
    completed: (r.completed as boolean) ?? false,
    completedAt: (r.completed_at as string) ?? null,
    dueDate: (r.due_date as string) ?? null,
    dueTime: (r.due_time as string) ?? null,
    startDate: (r.start_date as string) ?? null,
    priority: (r.priority as string) ?? null,
    taskType: (r.task_type as string) ?? "task",
    approvalStatus: (r.approval_status as string) ?? null,
    position: (r.position as number) ?? 0,
    isTemplate: (r.is_template as boolean) ?? false,
    assigneeId: (r.assignee_id as string) ?? null,
    creatorId: (r.creator_id as string) ?? "",
    projectId: (r.project_id as string) ?? null,
    sectionId: (r.section_id as string) ?? null,
    parentId: (r.parent_id as string) ?? null,
  };
}

function taskToDb(t: Partial<Task>) {
  const row: Record<string, unknown> = {};
  if (t.id !== undefined) row.id = t.id;
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.completed !== undefined) row.completed = t.completed;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt;
  if (t.dueDate !== undefined) row.due_date = t.dueDate;
  if (t.dueTime !== undefined) row.due_time = t.dueTime;
  if (t.startDate !== undefined) row.start_date = t.startDate;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.taskType !== undefined) row.task_type = t.taskType;
  if (t.approvalStatus !== undefined) row.approval_status = t.approvalStatus;
  if (t.position !== undefined) row.position = t.position;
  if (t.isTemplate !== undefined) row.is_template = t.isTemplate;
  if (t.assigneeId !== undefined) row.assignee_id = t.assigneeId;
  if (t.creatorId !== undefined) row.creator_id = t.creatorId;
  if (t.projectId !== undefined) row.project_id = t.projectId;
  if (t.sectionId !== undefined) row.section_id = t.sectionId;
  if (t.parentId !== undefined) row.parent_id = t.parentId;
  return row;
}

function dbToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    avatar: (r.avatar as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

interface AppState {
  // Data
  users: User[];
  projects: Project[];
  sections: Section[];
  tasks: Task[];
  notifications: Notification[];
  currentUser: User;

  // State flags
  initialized: boolean;
  loading: boolean;

  // Init
  init: () => Promise<void>;

  // Project mutations
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  // Task mutations
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;

  // Section mutations
  createSection: (data: Partial<Section>) => Promise<Section>;
  updateSection: (id: string, name: string) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  // Notification mutations
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  archiveNotification: (id: string) => void;

  // Helpers
  getProjectTasks: (projectId: string) => Task[];
  getProjectSections: (projectId: string) => Section[];
  getMyTasks: () => { today: Task[]; upcoming: Task[]; later: Task[] };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  projects: [],
  sections: [],
  tasks: [],
  notifications: [],
  currentUser: mockCurrentUser,
  initialized: false,
  loading: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });

    try {
      // Fetch all data from Supabase in parallel
      const [usersRes, projectsRes, sectionsRes, tasksRes] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("sections").select("*").order("position", { ascending: true }),
        supabase.from("tasks").select("*").order("position", { ascending: true }),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const users = (usersRes.data || []).map(dbToUser);
      let projects = (projectsRes.data || []).map(dbToProject);
      let sections = (sectionsRes.data || []).map(dbToSection);
      let tasks = (tasksRes.data || []).map(dbToTask);

      // If DB is empty, seed it with mock data
      if (projects.length === 0) {
        await seedSupabase();
        // Re-fetch after seeding
        const [p2, s2, t2] = await Promise.all([
          supabase.from("projects").select("*").order("created_at", { ascending: false }),
          supabase.from("sections").select("*").order("position", { ascending: true }),
          supabase.from("tasks").select("*").order("position", { ascending: true }),
        ]);
        projects = (p2.data || []).map(dbToProject);
        sections = (s2.data || []).map(dbToSection);
        tasks = (t2.data || []).map(dbToTask);
      }

      const currentUser = users.find((u) => u.id === "demo-user") || users[0] || mockCurrentUser;

      set({
        users: users.length ? users : mockUsers,
        projects,
        sections,
        tasks,
        notifications: mockNotifications, // notifications aren't in Supabase yet
        currentUser,
        initialized: true,
        loading: false,
      });
    } catch (err) {
      console.warn("Supabase fetch failed, using mock data:", err);
      set({
        users: mockUsers,
        projects: mockProjects,
        sections: mockSections,
        tasks: mockTasks,
        notifications: mockNotifications,
        currentUser: mockCurrentUser,
        initialized: true,
        loading: false,
      });
    }
  },

  // -- Project mutations ----------------------------------------------------

  createProject: async (data) => {
    const id = crypto.randomUUID();
    const project: Project = {
      id,
      name: data.name || "New Project",
      description: data.description ?? null,
      color: data.color || "#6366f1",
      icon: data.icon || "folder",
      archived: false,
      favorite: false,
      defaultView: data.defaultView || "list",
      creatorId: get().currentUser.id,
    };

    set((s) => ({ projects: [project, ...s.projects] }));

    // Also create default sections
    const defaultSections: Section[] = [
      { id: crypto.randomUUID(), name: "To Do", position: 0, projectId: id },
      { id: crypto.randomUUID(), name: "In Progress", position: 1, projectId: id },
      { id: crypto.randomUUID(), name: "Done", position: 2, projectId: id },
    ];
    set((s) => ({ sections: [...s.sections, ...defaultSections] }));

    // Write to Supabase
    try {
      await supabase.from("projects").insert(projectToDb(project));
      for (const sec of defaultSections) {
        await supabase.from("sections").insert(sectionToDb(sec));
      }
    } catch {}

    return project;
  },

  updateProject: async (id, updates) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    try {
      await supabase.from("projects").update(projectToDb(updates)).eq("id", id);
    } catch {}
  },

  deleteProject: async (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      sections: s.sections.filter((sec) => sec.projectId !== id),
    }));
    try {
      await supabase.from("tasks").delete().eq("project_id", id);
      await supabase.from("sections").delete().eq("project_id", id);
      await supabase.from("projects").delete().eq("id", id);
    } catch {}
  },

  toggleFavorite: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const newFav = !project.favorite;
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, favorite: newFav } : p)),
    }));
    try {
      await supabase.from("projects").update({ favorite: newFav }).eq("id", id);
    } catch {}
  },

  // -- Task mutations -------------------------------------------------------

  createTask: async (data) => {
    const id = crypto.randomUUID();
    const task: Task = {
      id,
      title: data.title || "New Task",
      description: data.description ?? null,
      completed: false,
      completedAt: null,
      dueDate: data.dueDate ?? null,
      dueTime: data.dueTime ?? null,
      startDate: data.startDate ?? null,
      priority: data.priority ?? "none",
      taskType: data.taskType ?? "task",
      approvalStatus: null,
      position: get().tasks.filter((t) => t.projectId === data.projectId).length,
      isTemplate: false,
      assigneeId: data.assigneeId ?? null,
      creatorId: get().currentUser.id,
      projectId: data.projectId ?? null,
      sectionId: data.sectionId ?? null,
      parentId: data.parentId ?? null,
    };

    set((s) => ({ tasks: [...s.tasks, task] }));

    try {
      await supabase.from("tasks").insert(taskToDb(task));
    } catch {}

    return task;
  },

  updateTask: async (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    try {
      await supabase.from("tasks").update(taskToDb(updates)).eq("id", id);
    } catch {}
  },

  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    try {
      await supabase.from("tasks").delete().eq("id", id);
    } catch {}
  },

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    const completedAt = completed ? new Date().toISOString() : null;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed, completedAt } : t)),
    }));
    try {
      await supabase.from("tasks").update({ completed, completed_at: completedAt }).eq("id", id);
    } catch {}
  },

  // -- Section mutations ----------------------------------------------------

  createSection: async (data) => {
    const id = crypto.randomUUID();
    const section: Section = {
      id,
      name: data.name || "New Section",
      position: get().sections.filter((s) => s.projectId === data.projectId).length,
      projectId: data.projectId || "",
    };

    set((s) => ({ sections: [...s.sections, section] }));

    try {
      await supabase.from("sections").insert(sectionToDb(section));
    } catch {}

    return section;
  },

  updateSection: async (id, name) => {
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === id ? { ...sec, name } : sec)),
    }));
    try {
      await supabase.from("sections").update({ name }).eq("id", id);
    } catch {}
  },

  deleteSection: async (id) => {
    // Move tasks to no section
    set((s) => ({
      sections: s.sections.filter((sec) => sec.id !== id),
      tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: null } : t)),
    }));
    try {
      await supabase.from("tasks").update({ section_id: null }).eq("section_id", id);
      await supabase.from("sections").delete().eq("id", id);
    } catch {}
  },

  // -- Notification mutations -----------------------------------------------

  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllNotificationsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  archiveNotification: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, archived: true } : n)),
    }));
  },

  // -- Helpers --------------------------------------------------------------

  getProjectTasks: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId && !t.parentId);
  },

  getProjectSections: (projectId) => {
    return get().sections.filter((s) => s.projectId === projectId);
  },

  getMyTasks: () => {
    const userId = get().currentUser.id;
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);

    const myTasks = get().tasks.filter((t) => t.assigneeId === userId && !t.completed);

    const today = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) <= todayEnd
    );
    const upcoming = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) > todayEnd && new Date(t.dueDate) <= weekEnd
    );
    const later = myTasks.filter(
      (t) => !t.dueDate || new Date(t.dueDate) > weekEnd
    );

    return { today, upcoming, later };
  },
}));

// ---------------------------------------------------------------------------
// Seed helper: insert mock data into empty Supabase
// ---------------------------------------------------------------------------

async function seedSupabase() {
  try {
    // Insert projects
    for (const p of mockProjects) {
      await supabase.from("projects").upsert(projectToDb(p));
    }
    // Insert sections
    for (const s of mockSections) {
      await supabase.from("sections").upsert(sectionToDb(s));
    }
    // Insert tasks
    for (const t of mockTasks) {
      await supabase.from("tasks").upsert(taskToDb(t));
    }
  } catch (err) {
    console.warn("Failed to seed Supabase:", err);
  }
}
