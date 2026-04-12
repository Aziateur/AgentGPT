import { supabase } from "@/lib/supabase";
import type { AutomationRuleExt, RuleExecutionExt, TimeEntry } from "@/types";

type SetFn = (partial: any) => void;
type GetFn = () => any;

// ---------- Rules Slice ----------

export function createRulesSlice(set: SetFn, get: GetFn) {
  return {
    createRule: async (
      data: Partial<AutomationRuleExt> & { name: string; triggerType: string }
    ): Promise<AutomationRuleExt> => {
      const now = new Date().toISOString();
      const rule: AutomationRuleExt = {
        id: data.id ?? crypto.randomUUID(),
        projectId: data.projectId ?? null,
        name: data.name,
        enabled: data.enabled ?? true,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig ?? {},
        actions: data.actions ?? [],
        scope: data.scope ?? "project",
        userId: data.userId ?? null,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      // Optimistic local update
      set({ rules: [...(get().rules as AutomationRuleExt[]), rule] });
      try {
        await supabase.from("automation_rules").insert({
          id: rule.id,
          project_id: rule.projectId,
          name: rule.name,
          enabled: rule.enabled,
          trigger_type: rule.triggerType,
          trigger_config: rule.triggerConfig,
          actions: rule.actions,
          scope: rule.scope,
          user_id: rule.userId,
          created_at: rule.createdAt,
          updated_at: rule.updatedAt,
        });
      } catch (err) {
        console.error("createRule failed", err);
      }
      return rule;
    },

    updateRule: async (id: string, updates: Partial<AutomationRuleExt>) => {
      const now = new Date().toISOString();
      const prev = get().rules as AutomationRuleExt[];
      set({
        rules: prev.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: now } : r
        ),
      });
      const dbUpdates: Record<string, any> = { updated_at: now };
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
      if (updates.triggerType !== undefined) dbUpdates.trigger_type = updates.triggerType;
      if (updates.triggerConfig !== undefined) dbUpdates.trigger_config = updates.triggerConfig;
      if (updates.actions !== undefined) dbUpdates.actions = updates.actions;
      if (updates.scope !== undefined) dbUpdates.scope = updates.scope;
      if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
      try {
        await supabase.from("automation_rules").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateRule failed", err);
      }
    },

    deleteRule: async (id: string) => {
      const prevRules = get().rules as AutomationRuleExt[];
      const prevExecs = get().ruleExecutions as RuleExecutionExt[];
      set({
        rules: prevRules.filter((r) => r.id !== id),
        ruleExecutions: prevExecs.filter((e) => e.ruleId !== id),
      });
      try {
        await supabase.from("rule_executions").delete().eq("rule_id", id);
        await supabase.from("automation_rules").delete().eq("id", id);
      } catch (err) {
        console.error("deleteRule failed", err);
      }
    },

    toggleRule: async (id: string) => {
      const now = new Date().toISOString();
      const prev = get().rules as AutomationRuleExt[];
      const target = prev.find((r) => r.id === id);
      if (!target) return;
      const nextEnabled = !target.enabled;
      set({
        rules: prev.map((r) =>
          r.id === id ? { ...r, enabled: nextEnabled, updatedAt: now } : r
        ),
      });
      try {
        await supabase
          .from("automation_rules")
          .update({ enabled: nextEnabled, updated_at: now })
          .eq("id", id);
      } catch (err) {
        console.error("toggleRule failed", err);
      }
    },

    logRuleExecution: async (
      ruleId: string,
      taskId: string | null,
      status: "success" | "failed" | "skipped",
      log?: string
    ) => {
      const now = new Date().toISOString();
      const exec: RuleExecutionExt = {
        id: crypto.randomUUID(),
        ruleId,
        taskId: taskId ?? null,
        status,
        log: log ?? null,
        executedAt: now,
      };
      set({
        ruleExecutions: [
          ...(get().ruleExecutions as RuleExecutionExt[]),
          exec,
        ],
      });
      try {
        await supabase.from("rule_executions").insert({
          id: exec.id,
          rule_id: exec.ruleId,
          task_id: exec.taskId,
          status: exec.status,
          log: exec.log,
          executed_at: exec.executedAt,
        });
      } catch (err) {
        console.error("logRuleExecution failed", err);
      }
    },
  };
}

// ---------- Time Slice ----------

export function createTimeSlice(set: SetFn, get: GetFn) {
  return {
    startTimer: async (taskId: string): Promise<TimeEntry> => {
      const now = new Date().toISOString();
      const currentUser = get().currentUser;
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        taskId,
        userId: currentUser?.id ?? "",
        startedAt: now,
        endedAt: null,
        durationMinutes: null,
        note: null,
        createdAt: now,
      };
      set({ timeEntries: [...(get().timeEntries as TimeEntry[]), entry] });
      try {
        await supabase.from("time_entries").insert({
          id: entry.id,
          task_id: entry.taskId,
          user_id: entry.userId,
          started_at: entry.startedAt,
          ended_at: entry.endedAt,
          duration_minutes: entry.durationMinutes,
          note: entry.note,
          created_at: entry.createdAt,
        });
      } catch (err) {
        console.error("startTimer failed", err);
      }
      return entry;
    },

    stopTimer: async (entryId: string, note?: string) => {
      const prev = get().timeEntries as TimeEntry[];
      const target = prev.find((e) => e.id === entryId);
      if (!target) return;
      const endedAt = new Date().toISOString();
      const startedMs = new Date(target.startedAt).getTime();
      const endedMs = new Date(endedAt).getTime();
      const durationMinutes = Math.round((endedMs - startedMs) / 60000);
      const updated: TimeEntry = {
        ...target,
        endedAt,
        durationMinutes,
        note: note !== undefined ? note : target.note ?? null,
      };
      set({
        timeEntries: prev.map((e) => (e.id === entryId ? updated : e)),
      });
      const dbUpdates: Record<string, any> = {
        ended_at: endedAt,
        duration_minutes: durationMinutes,
      };
      if (note !== undefined) dbUpdates.note = note;
      try {
        await supabase.from("time_entries").update(dbUpdates).eq("id", entryId);
      } catch (err) {
        console.error("stopTimer failed", err);
      }
    },

    addTimeEntry: async (
      taskId: string,
      minutes: number,
      note?: string
    ): Promise<TimeEntry> => {
      const now = new Date().toISOString();
      const currentUser = get().currentUser;
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        taskId,
        userId: currentUser?.id ?? "",
        startedAt: now,
        endedAt: now,
        durationMinutes: minutes,
        note: note ?? null,
        createdAt: now,
      };
      set({ timeEntries: [...(get().timeEntries as TimeEntry[]), entry] });
      try {
        await supabase.from("time_entries").insert({
          id: entry.id,
          task_id: entry.taskId,
          user_id: entry.userId,
          started_at: entry.startedAt,
          ended_at: entry.endedAt,
          duration_minutes: entry.durationMinutes,
          note: entry.note,
          created_at: entry.createdAt,
        });
      } catch (err) {
        console.error("addTimeEntry failed", err);
      }
      return entry;
    },

    deleteTimeEntry: async (id: string) => {
      const prev = get().timeEntries as TimeEntry[];
      set({ timeEntries: prev.filter((e) => e.id !== id) });
      try {
        await supabase.from("time_entries").delete().eq("id", id);
      } catch (err) {
        console.error("deleteTimeEntry failed", err);
      }
    },

    getTaskTimeEntries: (taskId: string): TimeEntry[] => {
      const entries = get().timeEntries as TimeEntry[];
      return entries.filter((e) => e.taskId === taskId);
    },

    getTaskActualMinutes: (taskId: string): number => {
      const entries = get().timeEntries as TimeEntry[];
      return entries
        .filter((e) => e.taskId === taskId && e.durationMinutes != null)
        .reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
    },
  };
}
