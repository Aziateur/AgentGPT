import { supabase } from "@/lib/supabase";
import type { TagExt, CustomFieldDefExt, CustomFieldValueExt } from "@/types";

type SetFn = (partial: any) => void;
type GetFn = () => any;

// ---------- Tags Slice ----------

export function createTagsSlice(set: SetFn, get: GetFn) {
  return {
    createTag: async (name: string, color = "#4c6ef5"): Promise<TagExt> => {
      const now = new Date().toISOString();
      const tag: TagExt = {
        id: crypto.randomUUID(),
        name,
        color,
        createdAt: now,
      };
      // Optimistic local update
      set({ tags: [...(get().tags as TagExt[]), tag] });
      try {
        await supabase.from("tags").insert({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          created_at: tag.createdAt,
        });
      } catch (err) {
        console.error("createTag failed", err);
      }
      return tag;
    },

    deleteTag: async (id: string) => {
      const prevTags = get().tags as TagExt[];
      const prevTaskTags = get().taskTags as { taskId: string; tagId: string }[];
      set({
        tags: prevTags.filter((t) => t.id !== id),
        taskTags: prevTaskTags.filter((tt) => tt.tagId !== id),
      });
      try {
        await supabase.from("task_tags").delete().eq("tag_id", id);
        await supabase.from("tags").delete().eq("id", id);
      } catch (err) {
        console.error("deleteTag failed", err);
      }
    },

    addTagToTask: async (taskId: string, tagId: string) => {
      const prev = get().taskTags as { taskId: string; tagId: string }[];
      if (prev.some((tt) => tt.taskId === taskId && tt.tagId === tagId)) {
        return;
      }
      set({ taskTags: [...prev, { taskId, tagId }] });
      try {
        await supabase.from("task_tags").insert({
          task_id: taskId,
          tag_id: tagId,
        });
      } catch (err) {
        console.error("addTagToTask failed", err);
      }
    },

    removeTagFromTask: async (taskId: string, tagId: string) => {
      const prev = get().taskTags as { taskId: string; tagId: string }[];
      set({
        taskTags: prev.filter(
          (tt) => !(tt.taskId === taskId && tt.tagId === tagId)
        ),
      });
      try {
        await supabase
          .from("task_tags")
          .delete()
          .eq("task_id", taskId)
          .eq("tag_id", tagId);
      } catch (err) {
        console.error("removeTagFromTask failed", err);
      }
    },

    getTaskTags: (taskId: string): TagExt[] => {
      const taskTags = get().taskTags as { taskId: string; tagId: string }[];
      const tags = get().tags as TagExt[];
      const tagIds = taskTags
        .filter((tt) => tt.taskId === taskId)
        .map((tt) => tt.tagId);
      return tags.filter((t) => tagIds.includes(t.id));
    },
  };
}

// ---------- Custom Fields Slice ----------

export function createCustomFieldsSlice(set: SetFn, get: GetFn) {
  return {
    createCustomFieldDef: async (
      data: Partial<CustomFieldDefExt>
    ): Promise<CustomFieldDefExt> => {
      const now = new Date().toISOString();
      const def: CustomFieldDefExt = {
        id: data.id ?? crypto.randomUUID(),
        projectId: data.projectId ?? null,
        name: data.name ?? "Untitled field",
        fieldType: data.fieldType ?? "text",
        options: data.options ?? null,
        required: data.required ?? false,
        position: data.position ?? 0,
        createdAt: data.createdAt ?? now,
      };
      set({
        customFieldDefs: [...(get().customFieldDefs as CustomFieldDefExt[]), def],
      });
      try {
        await supabase.from("custom_field_defs").insert({
          id: def.id,
          project_id: def.projectId,
          name: def.name,
          field_type: def.fieldType,
          options: def.options,
          required: def.required,
          position: def.position,
          created_at: def.createdAt,
        });
      } catch (err) {
        console.error("createCustomFieldDef failed", err);
      }
      return def;
    },

    updateCustomFieldDef: async (
      id: string,
      updates: Partial<CustomFieldDefExt>
    ) => {
      const prev = get().customFieldDefs as CustomFieldDefExt[];
      set({
        customFieldDefs: prev.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      });
      const dbUpdates: Record<string, any> = {};
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.fieldType !== undefined) dbUpdates.field_type = updates.fieldType;
      if (updates.options !== undefined) dbUpdates.options = updates.options;
      if (updates.required !== undefined) dbUpdates.required = updates.required;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
      try {
        await supabase
          .from("custom_field_defs")
          .update(dbUpdates)
          .eq("id", id);
      } catch (err) {
        console.error("updateCustomFieldDef failed", err);
      }
    },

    deleteCustomFieldDef: async (id: string) => {
      const prevDefs = get().customFieldDefs as CustomFieldDefExt[];
      const prevVals = get().customFieldValues as CustomFieldValueExt[];
      set({
        customFieldDefs: prevDefs.filter((d) => d.id !== id),
        customFieldValues: prevVals.filter((v) => v.fieldId !== id),
      });
      try {
        await supabase.from("custom_field_values").delete().eq("field_id", id);
        await supabase.from("custom_field_defs").delete().eq("id", id);
      } catch (err) {
        console.error("deleteCustomFieldDef failed", err);
      }
    },

    setCustomFieldValue: async (
      taskId: string,
      fieldId: string,
      value: Partial<CustomFieldValueExt>
    ) => {
      const now = new Date().toISOString();
      const prev = get().customFieldValues as CustomFieldValueExt[];
      const existing = prev.find(
        (v) => v.taskId === taskId && v.fieldId === fieldId
      );
      const merged: CustomFieldValueExt = {
        id: existing?.id ?? value.id ?? crypto.randomUUID(),
        taskId,
        fieldId,
        valueText: value.valueText ?? existing?.valueText ?? null,
        valueNumber: value.valueNumber ?? existing?.valueNumber ?? null,
        valueDate: value.valueDate ?? existing?.valueDate ?? null,
        valueUserId: value.valueUserId ?? existing?.valueUserId ?? null,
        valueSelectIds:
          value.valueSelectIds ?? existing?.valueSelectIds ?? null,
        valueBool:
          value.valueBool !== undefined
            ? value.valueBool
            : existing?.valueBool ?? null,
        updatedAt: now,
      };
      const next = existing
        ? prev.map((v) =>
            v.taskId === taskId && v.fieldId === fieldId ? merged : v
          )
        : [...prev, merged];
      set({ customFieldValues: next });
      try {
        await supabase.from("custom_field_values").upsert(
          {
            id: merged.id,
            task_id: merged.taskId,
            field_id: merged.fieldId,
            value_text: merged.valueText,
            value_number: merged.valueNumber,
            value_date: merged.valueDate,
            value_user_id: merged.valueUserId,
            value_select_ids: merged.valueSelectIds,
            value_bool: merged.valueBool,
            updated_at: merged.updatedAt,
          },
          { onConflict: "task_id,field_id" }
        );
      } catch (err) {
        console.error("setCustomFieldValue failed", err);
      }
    },

    getCustomFieldValues: (taskId: string): CustomFieldValueExt[] => {
      const values = get().customFieldValues as CustomFieldValueExt[];
      return values.filter((v) => v.taskId === taskId);
    },

    getProjectCustomFields: (projectId: string): CustomFieldDefExt[] => {
      const defs = get().customFieldDefs as CustomFieldDefExt[];
      return defs
        .filter((d) => d.projectId === projectId)
        .sort((a, b) => a.position - b.position);
    },
  };
}
