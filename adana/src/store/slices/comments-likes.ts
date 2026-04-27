import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Comment, CommentLike, TaskLike, TaskFollower, NotificationItem } from "@/types";

export interface CommentsLikesState {
  comments: Comment[];
  commentLikes: CommentLike[];
  taskLikes: TaskLike[];
  taskFollowers: TaskFollower[];

  fetchCommentsAndLikes: () => Promise<void>;

  createComment: (taskId: string, text: string) => Promise<Comment>;
  updateComment: (id: string, text: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<void>;

  toggleTaskLike: (taskId: string) => Promise<void>;
  toggleTaskFollower: (taskId: string) => Promise<void>;

  getTaskComments: (taskId: string) => Comment[];
  isTaskLikedByMe: (taskId: string) => boolean;
  isTaskFollowedByMe: (taskId: string) => boolean;
  getTaskFollowers: (taskId: string) => TaskFollower[];
  getTaskLikes: (taskId: string) => TaskLike[];
}

const MENTION_RE = /@([a-zA-Z][a-zA-Z0-9._-]{1,30})/g;

export const createCommentsLikesSlice: StateCreator<
  CommentsLikesState & { currentUser: { id: string }; users: Array<{ id: string; name: string }>; notificationsExt: NotificationItem[] },
  [],
  [],
  CommentsLikesState
> = (set, get) => ({
  comments: [],
  commentLikes: [],
  taskLikes: [],
  taskFollowers: [],

  fetchCommentsAndLikes: async () => {
    const safe = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
      try {
        return await fn();
      } catch {
        return [];
      }
    };
    const [c, cl, tl, tf] = await Promise.all([
      safe(async () => ((await supabase.from("comments").select("*").order("created_at", { ascending: true })).data || []) as any[]),
      safe(async () => ((await supabase.from("comment_likes").select("*")).data || []) as any[]),
      safe(async () => ((await supabase.from("task_likes").select("*")).data || []) as any[]),
      safe(async () => ((await supabase.from("task_followers").select("*")).data || []) as any[]),
    ]);
    set({
      comments: c.map((r: any) => ({
        id: r.id,
        text: r.text ?? r.content ?? "",
        taskId: r.task_id,
        authorId: r.author_id ?? r.user_id ?? "",
        createdAt: r.created_at,
        updatedAt: r.updated_at ?? r.created_at,
      })),
      commentLikes: cl.map((r: any) => ({
        id: r.id,
        commentId: r.comment_id,
        userId: r.user_id,
      })),
      taskLikes: tl.map((r: any) => ({
        id: r.id,
        taskId: r.task_id,
        userId: r.user_id,
      })),
      taskFollowers: tf.map((r: any) => ({
        id: r.id,
        taskId: r.task_id,
        userId: r.user_id,
      })),
    });
  },

  createComment: async (taskId, text) => {
    const me = get().currentUser.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const created: Comment = { id, text, taskId, authorId: me, createdAt: now, updatedAt: now };

    set((s) => ({ comments: [...s.comments, created] }));

    try {
      await supabase.from("comments").insert({
        id,
        task_id: taskId,
        author_id: me,
        text,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      console.warn("createComment supabase failed", err);
    }

    // Activity log
    const log = (get() as any).logActivity as
      | undefined
      | ((e: { taskId: string; projectId: string | null; type: string; payload: unknown }) => Promise<void>);
    if (log) {
      log({ taskId, projectId: null, type: "commented", payload: { commentId: id, preview: text.slice(0, 80) } }).catch(() => {});
    }

    // Auto-follow on comment
    const alreadyFollowing = get().taskFollowers.some((f) => f.taskId === taskId && f.userId === me);
    if (!alreadyFollowing) {
      await get().toggleTaskFollower(taskId);
    }

    // @-mention notifications
    const matches = Array.from(text.matchAll(MENTION_RE)).map((m) => m[1].toLowerCase());
    if (matches.length > 0) {
      const users = get().users;
      const mentioned = users.filter((u) =>
        matches.some((m) => (u.name || "").toLowerCase().replace(/\s+/g, "").includes(m))
      );
      const notifs = mentioned.map((u): NotificationItem => ({
        id: crypto.randomUUID(),
        userId: u.id,
        actorId: me,
        type: "mention",
        taskId,
        projectId: null,
        title: "You were mentioned in a comment",
        message: text.slice(0, 140),
        linkUrl: `/project/list?task=${taskId}`,
        read: false,
        archived: false,
        snoozedUntil: null,
        createdAt: now,
      }));
      if (notifs.length > 0) {
        set((s) => ({ notificationsExt: [...notifs, ...s.notificationsExt] }));
        try {
          await supabase.from("notifications").insert(notifs.map((n) => ({
            id: n.id,
            user_id: n.userId,
            actor_id: n.actorId,
            type: n.type,
            task_id: n.taskId,
            project_id: n.projectId,
            title: n.title,
            message: n.message,
            link_url: n.linkUrl,
            read: n.read,
            archived: n.archived,
            created_at: n.createdAt,
          })));
        } catch (err) {
          console.warn("mention notifications insert failed", err);
        }
      }
    }

    return created;
  },

  updateComment: async (id, text) => {
    const now = new Date().toISOString();
    set((s) => ({
      comments: s.comments.map((c) => (c.id === id ? { ...c, text, updatedAt: now } : c)),
    }));
    try {
      await supabase.from("comments").update({ text, updated_at: now }).eq("id", id);
    } catch (err) {
      console.warn("updateComment supabase failed", err);
    }
  },

  deleteComment: async (id) => {
    set((s) => ({
      comments: s.comments.filter((c) => c.id !== id),
      commentLikes: s.commentLikes.filter((cl) => cl.commentId !== id),
    }));
    try {
      await supabase.from("comments").delete().eq("id", id);
    } catch (err) {
      console.warn("deleteComment supabase failed", err);
    }
  },

  toggleCommentLike: async (commentId) => {
    const me = get().currentUser.id;
    const existing = get().commentLikes.find((cl) => cl.commentId === commentId && cl.userId === me);
    if (existing) {
      set((s) => ({ commentLikes: s.commentLikes.filter((cl) => cl.id !== existing.id) }));
      try {
        await supabase.from("comment_likes").delete().eq("id", existing.id);
      } catch (err) {
        console.warn("toggleCommentLike unlike failed", err);
      }
    } else {
      const newLike: CommentLike = { id: crypto.randomUUID(), commentId, userId: me };
      set((s) => ({ commentLikes: [...s.commentLikes, newLike] }));
      try {
        await supabase.from("comment_likes").insert({
          id: newLike.id,
          comment_id: commentId,
          user_id: me,
        });
      } catch (err) {
        console.warn("toggleCommentLike like failed", err);
      }
    }
  },

  toggleTaskLike: async (taskId) => {
    const me = get().currentUser.id;
    const existing = get().taskLikes.find((tl) => tl.taskId === taskId && tl.userId === me);
    if (existing) {
      set((s) => ({ taskLikes: s.taskLikes.filter((tl) => tl.id !== existing.id) }));
      try {
        await supabase.from("task_likes").delete().eq("id", existing.id);
      } catch (err) {
        console.warn("toggleTaskLike unlike failed", err);
      }
    } else {
      const newLike: TaskLike = { id: crypto.randomUUID(), taskId, userId: me };
      set((s) => ({ taskLikes: [...s.taskLikes, newLike] }));
      try {
        await supabase.from("task_likes").insert({ id: newLike.id, task_id: taskId, user_id: me });
      } catch (err) {
        console.warn("toggleTaskLike like failed", err);
      }
    }
  },

  toggleTaskFollower: async (taskId) => {
    const me = get().currentUser.id;
    const existing = get().taskFollowers.find((tf) => tf.taskId === taskId && tf.userId === me);
    if (existing) {
      set((s) => ({ taskFollowers: s.taskFollowers.filter((tf) => tf.id !== existing.id) }));
      try {
        await supabase.from("task_followers").delete().eq("id", existing.id);
      } catch (err) {
        console.warn("toggleTaskFollower unfollow failed", err);
      }
    } else {
      const newFollower: TaskFollower = { id: crypto.randomUUID(), taskId, userId: me };
      set((s) => ({ taskFollowers: [...s.taskFollowers, newFollower] }));
      try {
        await supabase.from("task_followers").insert({ id: newFollower.id, task_id: taskId, user_id: me });
      } catch (err) {
        console.warn("toggleTaskFollower follow failed", err);
      }
    }
  },

  getTaskComments: (taskId) => get().comments.filter((c) => c.taskId === taskId),
  isTaskLikedByMe: (taskId) => {
    const me = get().currentUser.id;
    return get().taskLikes.some((tl) => tl.taskId === taskId && tl.userId === me);
  },
  isTaskFollowedByMe: (taskId) => {
    const me = get().currentUser.id;
    return get().taskFollowers.some((tf) => tf.taskId === taskId && tf.userId === me);
  },
  getTaskFollowers: (taskId) => get().taskFollowers.filter((tf) => tf.taskId === taskId),
  getTaskLikes: (taskId) => get().taskLikes.filter((tl) => tl.taskId === taskId),
});
