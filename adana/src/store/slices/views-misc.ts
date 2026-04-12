import { supabase } from "@/lib/supabase";
import type {
  SavedView,
  Dashboard,
  DashboardWidget,
  Task,
  RecurrenceRule,
  TaskProjectLink,
} from "@/types";

type SetFn = (partial: any) => void;
type GetFn = () => any;

// ---------- Saved Views Slice ----------

export function createSavedViewsSlice(set: SetFn, get: GetFn) {
  return {
    createSavedView: async (
      data: Partial<SavedView> & { name: string; viewType: SavedView["viewType"] }
    ): Promise<SavedView> => {
      const now = new Date().toISOString();
      const currentUser = get().currentUser;
      const view: SavedView = {
        id: data.id ?? crypto.randomUUID(),
        projectId: data.projectId ?? null,
        userId: data.userId ?? currentUser?.id ?? null,
        name: data.name,
        viewType: data.viewType,
        filters: data.filters ?? [],
        sort: data.sort ?? [],
        groupBy: data.groupBy ?? null,
        createdAt: data.createdAt ?? now,
      };
      set({ savedViews: [...(get().savedViews as SavedView[]), view] });
      try {
        await supabase.from("saved_views").insert({
          id: view.id,
          project_id: view.projectId,
          user_id: view.userId,
          name: view.name,
          view_type: view.viewType,
          filters: view.filters,
          sort: view.sort,
          group_by: view.groupBy,
          created_at: view.createdAt,
        });
      } catch (err) {
        console.error("createSavedView failed", err);
      }
      return view;
    },

    updateSavedView: async (id: string, updates: Partial<SavedView>) => {
      const prev = get().savedViews as SavedView[];
      set({
        savedViews: prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      });
      const dbUpdates: Record<string, any> = {};
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
      if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.viewType !== undefined) dbUpdates.view_type = updates.viewType;
      if (updates.filters !== undefined) dbUpdates.filters = updates.filters;
      if (updates.sort !== undefined) dbUpdates.sort = updates.sort;
      if (updates.groupBy !== undefined) dbUpdates.group_by = updates.groupBy;
      try {
        await supabase.from("saved_views").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateSavedView failed", err);
      }
    },

    deleteSavedView: async (id: string) => {
      const prev = get().savedViews as SavedView[];
      set({ savedViews: prev.filter((v) => v.id !== id) });
      try {
        await supabase.from("saved_views").delete().eq("id", id);
      } catch (err) {
        console.error("deleteSavedView failed", err);
      }
    },
  };
}

// ---------- Dashboards Slice ----------

export function createDashboardsSlice(set: SetFn, get: GetFn) {
  return {
    createDashboard: async (name: string, scopeId?: string): Promise<Dashboard> => {
      const now = new Date().toISOString();
      const currentUser = get().currentUser;
      const dashboard: Dashboard = {
        id: crypto.randomUUID(),
        ownerId: currentUser?.id ?? null,
        scopeId: scopeId ?? null,
        name,
        createdAt: now,
      };
      set({ dashboards: [...(get().dashboards as Dashboard[]), dashboard] });
      try {
        await supabase.from("dashboards").insert({
          id: dashboard.id,
          owner_id: dashboard.ownerId,
          scope_id: dashboard.scopeId,
          name: dashboard.name,
          created_at: dashboard.createdAt,
        });
      } catch (err) {
        console.error("createDashboard failed", err);
      }
      return dashboard;
    },

    deleteDashboard: async (id: string) => {
      const prevDashboards = get().dashboards as Dashboard[];
      const prevWidgets = get().dashboardWidgets as DashboardWidget[];
      set({
        dashboards: prevDashboards.filter((d) => d.id !== id),
        dashboardWidgets: prevWidgets.filter((w) => w.dashboardId !== id),
      });
      try {
        await supabase.from("dashboard_widgets").delete().eq("dashboard_id", id);
        await supabase.from("dashboards").delete().eq("id", id);
      } catch (err) {
        console.error("deleteDashboard failed", err);
      }
    },

    addWidget: async (
      dashboardId: string,
      type: DashboardWidget["type"],
      config: Record<string, unknown>
    ): Promise<DashboardWidget> => {
      const now = new Date().toISOString();
      const widget: DashboardWidget = {
        id: crypto.randomUUID(),
        dashboardId,
        type,
        config,
        position: { x: 0, y: 0, w: 6, h: 4 },
        createdAt: now,
      };
      set({
        dashboardWidgets: [
          ...(get().dashboardWidgets as DashboardWidget[]),
          widget,
        ],
      });
      try {
        await supabase.from("dashboard_widgets").insert({
          id: widget.id,
          dashboard_id: widget.dashboardId,
          type: widget.type,
          config: widget.config,
          position: widget.position,
          created_at: widget.createdAt,
        });
      } catch (err) {
        console.error("addWidget failed", err);
      }
      return widget;
    },

    updateWidget: async (id: string, updates: Partial<DashboardWidget>) => {
      const prev = get().dashboardWidgets as DashboardWidget[];
      set({
        dashboardWidgets: prev.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      });
      const dbUpdates: Record<string, any> = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.config !== undefined) dbUpdates.config = updates.config;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
      try {
        await supabase.from("dashboard_widgets").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateWidget failed", err);
      }
    },

    deleteWidget: async (id: string) => {
      const prev = get().dashboardWidgets as DashboardWidget[];
      set({ dashboardWidgets: prev.filter((w) => w.id !== id) });
      try {
        await supabase.from("dashboard_widgets").delete().eq("id", id);
      } catch (err) {
        console.error("deleteWidget failed", err);
      }
    },
  };
}

// ---------- Multi-Homing Slice ----------

export function createMultiHomingSlice(set: SetFn, get: GetFn) {
  return {
    addTaskToProject: async (
      taskId: string,
      projectId: string,
      sectionId?: string | null
    ) => {
      const prev = get().taskProjects as TaskProjectLink[];
      if (prev.some((tp) => tp.taskId === taskId && tp.projectId === projectId)) {
        return;
      }
      const now = new Date().toISOString();
      const link: TaskProjectLink = {
        taskId,
        projectId,
        sectionId: sectionId ?? null,
        createdAt: now,
      };
      set({ taskProjects: [...prev, link] });
      try {
        await supabase.from("task_projects").insert({
          task_id: link.taskId,
          project_id: link.projectId,
          section_id: link.sectionId,
          created_at: link.createdAt,
        });
      } catch (err) {
        console.error("addTaskToProject failed", err);
      }
    },

    removeTaskFromProject: async (taskId: string, projectId: string) => {
      const prev = get().taskProjects as TaskProjectLink[];
      set({
        taskProjects: prev.filter(
          (tp) => !(tp.taskId === taskId && tp.projectId === projectId)
        ),
      });
      try {
        await supabase
          .from("task_projects")
          .delete()
          .eq("task_id", taskId)
          .eq("project_id", projectId);
      } catch (err) {
        console.error("removeTaskFromProject failed", err);
      }
    },

    getTaskProjects: (taskId: string): string[] => {
      const taskProjects = get().taskProjects as TaskProjectLink[];
      return taskProjects
        .filter((tp) => tp.taskId === taskId)
        .map((tp) => tp.projectId);
    },
  };
}

// ---------- Recurrence Slice ----------

export function createRecurrenceSlice(set: SetFn, get: GetFn) {
  return {
    spawnRecurrence: async (taskId: string): Promise<Task | null> => {
      const tasks = get().tasks as Task[];
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return null;
      const recurrence = (task as any).recurrence as RecurrenceRule | null | undefined;
      if (!recurrence) return null;

      const baseDateStr = task.dueDate;
      const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
      const interval = recurrence.interval ?? 1;
      const next = new Date(baseDate.getTime());

      switch (recurrence.freq) {
        case "daily":
          next.setDate(next.getDate() + interval);
          break;
        case "weekly":
          next.setDate(next.getDate() + 7 * interval);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + interval);
          break;
        case "yearly":
          next.setFullYear(next.getFullYear() + interval);
          break;
      }

      if (recurrence.endOn) {
        const endOn = new Date(recurrence.endOn);
        if (next.getTime() > endOn.getTime()) {
          return null;
        }
      }

      const nextIso = next.toISOString();
      const createTask = get().createTask;
      if (typeof createTask !== "function") return null;

      const newTask = await createTask({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        priority: task.priority,
        projectId: task.projectId,
        sectionId: task.sectionId,
        parentId: task.parentId,
        taskType: task.taskType,
        isTemplate: task.isTemplate,
        dueDate: nextIso,
        recurrence: recurrence,
      });

      return (newTask as Task) ?? null;
    },
  };
}
