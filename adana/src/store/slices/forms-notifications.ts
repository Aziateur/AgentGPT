import { supabase } from "@/lib/supabase";
import type {
  FormExt,
  FormFieldExt,
  FormSubmissionExt,
  NotificationItem,
} from "@/types";

type SetFn = (partial: any) => void;
type GetFn = () => any;

// ---------- Forms Slice ----------

export function createFormsSlice(set: SetFn, get: GetFn) {
  return {
    createForm: async (
      data: Partial<FormExt> & { title: string }
    ): Promise<FormExt> => {
      const now = new Date().toISOString();
      const form: FormExt = {
        id: crypto.randomUUID(),
        projectId: data.projectId ?? null,
        title: data.title,
        description: data.description ?? null,
        publicSlug: data.publicSlug ?? null,
        settings: data.settings ?? {},
        enabled: data.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      };
      // Optimistic local update
      set({ forms: [...(get().forms as FormExt[]), form] });
      try {
        await supabase.from("forms").insert({
          id: form.id,
          project_id: form.projectId,
          title: form.title,
          description: form.description,
          public_slug: form.publicSlug,
          settings: form.settings,
          enabled: form.enabled,
          created_at: form.createdAt,
          updated_at: form.updatedAt,
        });
      } catch (err) {
        console.error("createForm failed", err);
      }
      return form;
    },

    updateForm: async (id: string, updates: Partial<FormExt>) => {
      const prev = get().forms as FormExt[];
      const now = new Date().toISOString();
      set({
        forms: prev.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: now } : f
        ),
      });
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: now };
        if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.publicSlug !== undefined) dbUpdates.public_slug = updates.publicSlug;
        if (updates.settings !== undefined) dbUpdates.settings = updates.settings;
        if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
        await supabase.from("forms").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateForm failed", err);
      }
    },

    deleteForm: async (id: string) => {
      const prevForms = get().forms as FormExt[];
      const prevFields = get().formFields as FormFieldExt[];
      const prevSubs = get().formSubmissions as FormSubmissionExt[];
      set({
        forms: prevForms.filter((f) => f.id !== id),
        formFields: prevFields.filter((ff) => ff.formId !== id),
        formSubmissions: prevSubs.filter((s) => s.formId !== id),
      });
      try {
        await supabase.from("form_submissions").delete().eq("form_id", id);
        await supabase.from("form_fields").delete().eq("form_id", id);
        await supabase.from("forms").delete().eq("id", id);
      } catch (err) {
        console.error("deleteForm failed", err);
      }
    },

    createFormField: async (
      data: Partial<FormFieldExt> & {
        formId: string;
        label: string;
        fieldType: string;
      }
    ): Promise<FormFieldExt> => {
      const allFields = get().formFields as FormFieldExt[];
      const position =
        data.position ??
        allFields.filter((f) => f.formId === data.formId).length;
      const field: FormFieldExt = {
        id: crypto.randomUUID(),
        formId: data.formId,
        label: data.label,
        fieldType: data.fieldType,
        options: data.options ?? null,
        required: data.required ?? false,
        position,
      };
      set({ formFields: [...allFields, field] });
      try {
        await supabase.from("form_fields").insert({
          id: field.id,
          form_id: field.formId,
          label: field.label,
          field_type: field.fieldType,
          options: field.options,
          required: field.required,
          position: field.position,
        });
      } catch (err) {
        console.error("createFormField failed", err);
      }
      return field;
    },

    updateFormField: async (id: string, updates: Partial<FormFieldExt>) => {
      const prev = get().formFields as FormFieldExt[];
      set({
        formFields: prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      });
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.label !== undefined) dbUpdates.label = updates.label;
        if (updates.fieldType !== undefined) dbUpdates.field_type = updates.fieldType;
        if (updates.options !== undefined) dbUpdates.options = updates.options;
        if (updates.required !== undefined) dbUpdates.required = updates.required;
        if (updates.position !== undefined) dbUpdates.position = updates.position;
        await supabase.from("form_fields").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateFormField failed", err);
      }
    },

    deleteFormField: async (id: string) => {
      const prev = get().formFields as FormFieldExt[];
      set({ formFields: prev.filter((f) => f.id !== id) });
      try {
        await supabase.from("form_fields").delete().eq("id", id);
      } catch (err) {
        console.error("deleteFormField failed", err);
      }
    },

    submitForm: async (
      formId: string,
      payload: Record<string, unknown>
    ): Promise<FormSubmissionExt> => {
      const forms = get().forms as FormExt[];
      const form = forms.find((f) => f.id === formId);
      const allFields = get().formFields as FormFieldExt[];
      const fields = allFields
        .filter((f) => f.formId === formId)
        .sort((a, b) => a.position - b.position);

      // Determine task title
      let title: string | undefined;
      const mapping =
        (form?.settings as Record<string, unknown> | undefined)?.mapping as
          | Record<string, string>
          | undefined;
      const mappingTitleField = mapping?.title;
      if (mappingTitleField && payload[mappingTitleField] != null) {
        title = String(payload[mappingTitleField]);
      } else {
        const firstTextField = fields.find(
          (f) =>
            f.fieldType === "text" ||
            f.fieldType === "short_text" ||
            f.fieldType === "long_text"
        );
        if (firstTextField && payload[firstTextField.id] != null) {
          title = String(payload[firstTextField.id]);
        } else if (firstTextField && payload[firstTextField.label] != null) {
          title = String(payload[firstTextField.label]);
        }
      }
      if (!title || !title.trim()) {
        title = `${form?.title ?? "Form"} submission`;
      }

      // Determine task description
      let description: string | undefined;
      const mappingDescField = mapping?.description;
      if (mappingDescField && payload[mappingDescField] != null) {
        description = String(payload[mappingDescField]);
      } else {
        const usedKeys = new Set<string>();
        if (mappingTitleField) usedKeys.add(mappingTitleField);
        const lines: string[] = [];
        for (const field of fields) {
          if (usedKeys.has(field.id) || usedKeys.has(field.label)) continue;
          const value =
            payload[field.id] !== undefined
              ? payload[field.id]
              : payload[field.label];
          if (value === undefined || value === null || value === "") continue;
          lines.push(`**${field.label}**: ${String(value)}\n`);
        }
        description = lines.join("");
      }

      // Create the task via store's createTask
      const task = await get().createTask({
        title,
        description: description || null,
        projectId: form?.projectId ?? null,
      });

      const now = new Date().toISOString();
      const submission: FormSubmissionExt = {
        id: crypto.randomUUID(),
        formId,
        taskId: task?.id ?? null,
        payload,
        submittedAt: now,
      };
      set({
        formSubmissions: [
          ...(get().formSubmissions as FormSubmissionExt[]),
          submission,
        ],
      });
      try {
        await supabase.from("form_submissions").insert({
          id: submission.id,
          form_id: submission.formId,
          task_id: submission.taskId,
          payload: submission.payload,
          submitted_at: submission.submittedAt,
        });
      } catch (err) {
        console.error("submitForm failed", err);
      }
      return submission;
    },
  };
}

// ---------- Notifications Slice ----------

export function createNotificationsSlice(set: SetFn, get: GetFn) {
  return {
    createNotification: async (
      n: Partial<NotificationItem> & {
        userId: string;
        type: string;
        title: string;
      }
    ) => {
      const now = new Date().toISOString();
      const notif: NotificationItem = {
        id: crypto.randomUUID(),
        userId: n.userId,
        actorId: n.actorId ?? null,
        type: n.type,
        taskId: n.taskId ?? null,
        projectId: n.projectId ?? null,
        title: n.title,
        message: n.message ?? null,
        linkUrl: n.linkUrl ?? null,
        read: n.read ?? false,
        archived: n.archived ?? false,
        snoozedUntil: n.snoozedUntil ?? null,
        createdAt: now,
      };
      set({
        notificationsExt: [
          notif,
          ...(get().notificationsExt as NotificationItem[]),
        ],
      });
      try {
        await supabase.from("notifications").insert({
          id: notif.id,
          user_id: notif.userId,
          actor_id: notif.actorId,
          type: notif.type,
          task_id: notif.taskId,
          project_id: notif.projectId,
          title: notif.title,
          message: notif.message,
          link_url: notif.linkUrl,
          read: notif.read,
          archived: notif.archived,
          snoozed_until: notif.snoozedUntil,
          created_at: notif.createdAt,
        });
      } catch (err) {
        console.error("createNotification failed", err);
      }
      return notif;
    },

    markNotificationExtRead: async (id: string) => {
      const prev = get().notificationsExt as NotificationItem[];
      set({
        notificationsExt: prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      });
      try {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id);
      } catch (err) {
        console.error("markNotificationExtRead failed", err);
      }
    },

    markAllNotificationsExtRead: async () => {
      const currentUserId = get().currentUser?.id;
      const prev = get().notificationsExt as NotificationItem[];
      set({
        notificationsExt: prev.map((n) =>
          n.userId === currentUserId && !n.read ? { ...n, read: true } : n
        ),
      });
      try {
        if (currentUserId) {
          await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", currentUserId)
            .eq("read", false);
        }
      } catch (err) {
        console.error("markAllNotificationsExtRead failed", err);
      }
    },

    archiveNotificationExt: async (id: string) => {
      const prev = get().notificationsExt as NotificationItem[];
      set({
        notificationsExt: prev.map((n) =>
          n.id === id ? { ...n, archived: true } : n
        ),
      });
      try {
        await supabase
          .from("notifications")
          .update({ archived: true })
          .eq("id", id);
      } catch (err) {
        console.error("archiveNotificationExt failed", err);
      }
    },

    snoozeNotification: async (id: string, until: string) => {
      const prev = get().notificationsExt as NotificationItem[];
      set({
        notificationsExt: prev.map((n) =>
          n.id === id ? { ...n, snoozedUntil: until } : n
        ),
      });
      try {
        await supabase
          .from("notifications")
          .update({ snoozed_until: until })
          .eq("id", id);
      } catch (err) {
        console.error("snoozeNotification failed", err);
      }
    },
  };
}
