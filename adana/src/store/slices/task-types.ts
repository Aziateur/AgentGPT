import { supabase } from "@/lib/supabase";
import type { TaskTypeDef } from "@/types";

export function createTaskTypesSlice(set: any, get: any) {
  return {
    taskTypes: [] as TaskTypeDef[],

    fetchTaskTypes: async () => {
      try {
        const { data, error } = await supabase.from("task_types").select("*");
        if (error) throw error;
        const rows = (data || []).map(
          (r: any): TaskTypeDef => ({
            id: r.id,
            projectId: r.project_id ?? null,
            name: r.name,
            color: r.color ?? "#4c6ef5",
            icon: r.icon ?? null,
            createdAt: r.created_at,
          })
        );
        set({ taskTypes: rows });
      } catch (err) {
        console.error("fetchTaskTypes failed", err);
      }
    },

    createTaskType: async (
      data: Partial<TaskTypeDef> & { name: string; projectId?: string | null }
    ): Promise<TaskTypeDef> => {
      const now = new Date().toISOString();
      const t: TaskTypeDef = {
        id: crypto.randomUUID(),
        projectId: data.projectId ?? null,
        name: data.name,
        color: data.color ?? "#4c6ef5",
        icon: data.icon ?? null,
        createdAt: now,
      };
      set((s: any) => ({ taskTypes: [...(s.taskTypes ?? []), t] }));
      try {
        await supabase.from("task_types").insert({
          id: t.id,
          project_id: t.projectId,
          name: t.name,
          color: t.color,
          icon: t.icon,
          created_at: t.createdAt,
        });
      } catch (err) {
        console.error("createTaskType failed", err);
      }
      return t;
    },

    deleteTaskType: async (id: string) => {
      set((s: any) => ({
        taskTypes: (s.taskTypes ?? []).filter((t: TaskTypeDef) => t.id !== id),
      }));
      try {
        await supabase.from("task_types").delete().eq("id", id);
      } catch (err) {
        console.error("deleteTaskType failed", err);
      }
    },

    getProjectTaskTypes: (projectId: string): TaskTypeDef[] => {
      return ((get().taskTypes ?? []) as TaskTypeDef[]).filter(
        (t) => t.projectId === projectId
      );
    },
  };
}
