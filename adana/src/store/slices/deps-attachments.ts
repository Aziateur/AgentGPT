import { supabase } from "@/lib/supabase";
import type { TaskDependencyEdge, AttachmentFile, Task } from "@/types";

type SetFn = (partial: any) => void;
type GetFn = () => any;

// ---------- Dependencies Slice ----------

export function createDepsSlice(set: SetFn, get: GetFn) {
  return {
    addDependency: async (
      blockerTaskId: string,
      blockedTaskId: string
    ): Promise<TaskDependencyEdge | null> => {
      const prev = get().taskDeps as TaskDependencyEdge[];
      // Guard against duplicates (same blocker+blocked pair already exists)
      const dup = prev.find(
        (d) =>
          d.blockerTaskId === blockerTaskId &&
          d.blockedTaskId === blockedTaskId
      );
      if (dup) {
        return null;
      }
      const now = new Date().toISOString();
      const edge: TaskDependencyEdge = {
        id: crypto.randomUUID(),
        blockerTaskId,
        blockedTaskId,
        depType: "finish_to_start",
        createdAt: now,
      };
      set({ taskDeps: [...prev, edge] });
      try {
        await supabase.from("task_dependencies").insert({
          id: edge.id,
          blocker_task_id: edge.blockerTaskId,
          blocked_task_id: edge.blockedTaskId,
          dep_type: edge.depType,
          created_at: edge.createdAt,
        });
      } catch (err) {
        console.error("addDependency failed", err);
      }
      return edge;
    },

    removeDependency: async (id: string) => {
      const prev = get().taskDeps as TaskDependencyEdge[];
      set({ taskDeps: prev.filter((d) => d.id !== id) });
      try {
        await supabase.from("task_dependencies").delete().eq("id", id);
      } catch (err) {
        console.error("removeDependency failed", err);
      }
    },

    getBlockers: (taskId: string): Task[] => {
      const deps = get().taskDeps as TaskDependencyEdge[];
      const tasks = get().tasks as Task[];
      const blockerIds = deps
        .filter((d) => d.blockedTaskId === taskId)
        .map((d) => d.blockerTaskId);
      return tasks.filter((t) => blockerIds.includes(t.id));
    },

    getBlocked: (taskId: string): Task[] => {
      const deps = get().taskDeps as TaskDependencyEdge[];
      const tasks = get().tasks as Task[];
      const blockedIds = deps
        .filter((d) => d.blockerTaskId === taskId)
        .map((d) => d.blockedTaskId);
      return tasks.filter((t) => blockedIds.includes(t.id));
    },

    isTaskBlocked: (taskId: string): boolean => {
      const deps = get().taskDeps as TaskDependencyEdge[];
      const tasks = get().tasks as Task[];
      const blockerIds = deps
        .filter((d) => d.blockedTaskId === taskId)
        .map((d) => d.blockerTaskId);
      if (blockerIds.length === 0) return false;
      return tasks.some(
        (t) => blockerIds.includes(t.id) && t.completed === false
      );
    },
  };
}

// ---------- Attachments Slice ----------

export function createAttachmentsSlice(set: SetFn, get: GetFn) {
  return {
    addAttachment: async (
      data: Partial<AttachmentFile> & { filename: string; storagePath: string }
    ): Promise<AttachmentFile> => {
      const now = new Date().toISOString();
      let publicUrl: string | null = data.publicUrl ?? null;
      try {
        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(data.storagePath);
        publicUrl = urlData?.publicUrl ?? publicUrl;
      } catch (err) {
        console.error("getPublicUrl failed", err);
      }
      const att: AttachmentFile = {
        id: data.id ?? crypto.randomUUID(),
        taskId: data.taskId ?? null,
        projectId: data.projectId ?? null,
        uploaderId: data.uploaderId ?? null,
        filename: data.filename,
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? null,
        storagePath: data.storagePath,
        publicUrl,
        createdAt: data.createdAt ?? now,
      };
      set({
        attachments: [...(get().attachments as AttachmentFile[]), att],
      });
      try {
        await supabase.from("attachments").insert({
          id: att.id,
          task_id: att.taskId,
          project_id: att.projectId,
          uploader_id: att.uploaderId,
          filename: att.filename,
          mime_type: att.mimeType,
          size_bytes: att.sizeBytes,
          storage_path: att.storagePath,
          public_url: att.publicUrl,
          created_at: att.createdAt,
        });
      } catch (err) {
        console.error("addAttachment failed", err);
      }
      return att;
    },

    deleteAttachment: async (id: string) => {
      const prev = get().attachments as AttachmentFile[];
      const target = prev.find((a) => a.id === id);
      set({ attachments: prev.filter((a) => a.id !== id) });
      if (target?.storagePath) {
        try {
          await supabase.storage
            .from("attachments")
            .remove([target.storagePath]);
        } catch (err) {
          console.error("deleteAttachment storage remove failed", err);
        }
      }
      try {
        await supabase.from("attachments").delete().eq("id", id);
      } catch (err) {
        console.error("deleteAttachment failed", err);
      }
    },

    getTaskAttachments: (taskId: string): AttachmentFile[] => {
      const attachments = get().attachments as AttachmentFile[];
      return attachments.filter((a) => a.taskId === taskId);
    },
  };
}
