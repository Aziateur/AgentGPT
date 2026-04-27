import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Activity log slice
//
// Each mutation that's worth showing on the task "All activity" tab calls
// `logActivity({ taskId, type, ... })`. Events are persisted to Supabase
// `activity_events` table (graceful fallback if missing).
// ---------------------------------------------------------------------------

export type ActivityEventType =
  | "created"
  | "assigned"
  | "due_date_set"
  | "start_date_set"
  | "priority_set"
  | "completed"
  | "uncompleted"
  | "commented"
  | "attached"
  | "made_subtask"
  | "dependency_added"
  | "dependency_removed"
  | "custom_field_changed"
  | "project_added"
  | "project_removed"
  | "tag_added"
  | "tag_removed"
  | "status_changed"
  | "type_converted"
  | "recurrence_spawned"
  | "deleted"
  | "restored";

export interface ActivityEvent {
  id: string;
  taskId: string | null;
  projectId: string | null;
  actorId: string;
  type: ActivityEventType;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityState {
  activityEvents: ActivityEvent[];
  fetchActivity: () => Promise<void>;
  logActivity: (
    e: Omit<ActivityEvent, "id" | "createdAt" | "actorId"> & {
      actorId?: string;
      payload?: Record<string, unknown> | null;
    }
  ) => Promise<void>;
  getTaskActivity: (taskId: string) => ActivityEvent[];
  getProjectActivity: (projectId: string, limit?: number) => ActivityEvent[];
}

const ACTIVITY_LIMIT = 500;

export const createActivitySlice: StateCreator<
  ActivityState & { currentUser: { id: string } },
  [],
  [],
  ActivityState
> = (set, get) => ({
  activityEvents: [],

  fetchActivity: async () => {
    try {
      const { data } = await supabase
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_LIMIT);
      const rows = (data || []) as Array<Record<string, unknown>>;
      set({
        activityEvents: rows.map((r) => ({
          id: r.id as string,
          taskId: (r.task_id as string) ?? null,
          projectId: (r.project_id as string) ?? null,
          actorId: (r.actor_id as string) ?? "",
          type: (r.type as ActivityEventType) ?? "created",
          payload: (r.payload as Record<string, unknown>) ?? null,
          createdAt: (r.created_at as string) ?? new Date().toISOString(),
        })),
      });
    } catch {
      set({ activityEvents: [] });
    }
  },

  logActivity: async (e) => {
    const me = e.actorId ?? get().currentUser.id;
    const now = new Date().toISOString();
    const ev: ActivityEvent = {
      id: crypto.randomUUID(),
      taskId: e.taskId,
      projectId: e.projectId,
      actorId: me,
      type: e.type,
      payload: e.payload ?? null,
      createdAt: now,
    };
    set((s) => ({ activityEvents: [ev, ...s.activityEvents].slice(0, ACTIVITY_LIMIT) }));
    try {
      await supabase.from("activity_events").insert({
        id: ev.id,
        task_id: ev.taskId,
        project_id: ev.projectId,
        actor_id: ev.actorId,
        type: ev.type,
        payload: ev.payload,
        created_at: ev.createdAt,
      });
    } catch {
      // graceful fallback if table missing
    }
  },

  getTaskActivity: (taskId) => get().activityEvents.filter((e) => e.taskId === taskId),
  getProjectActivity: (projectId, limit = 100) =>
    get()
      .activityEvents.filter((e) => e.projectId === projectId)
      .slice(0, limit),
});
