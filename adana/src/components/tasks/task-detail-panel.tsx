"use client";

import { useState } from "react";
import {
  X,
  User,
  Calendar,
  Flag,
  FolderKanban,
  Tag,
  Heart,
  Bell,
  MoreHorizontal,
  Copy,
  Trash2,
  ArrowRightLeft,
  Milestone,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Link2,
  ChevronDown,
  ChevronRight,
  Plus,
  Send,
} from "lucide-react";
import { SubtaskList } from "./subtask-list";
import type { Task, Comment as CommentType } from "@/types";

// -- Mock data ----------------------------------------------------------------

const mockSubtasks: Task[] = [
  { id: "st1", name: "Create wireframe sketch", title: "Create wireframe sketch", description: null, htmlDescription: null, status: "completed", priority: "medium", type: "task", completed: true, completedAt: new Date().toISOString(), assigneeId: "user-2", creatorId: "demo-user", projectId: "p1", sectionId: "s1", parentTaskId: "t1", order: 0, position: 0, dueDate: null, startDate: null, estimatedMinutes: null, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [], dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0, attachmentCount: 0, commentCount: 0, customFieldValues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "st2", name: "Get stakeholder feedback", title: "Get stakeholder feedback", description: null, htmlDescription: null, status: "in_progress", priority: "high", type: "task", completed: false, completedAt: null, assigneeId: "demo-user", creatorId: "demo-user", projectId: "p1", sectionId: "s1", parentTaskId: "t1", order: 1, position: 1, dueDate: new Date(Date.now() + 172800000).toISOString(), startDate: null, estimatedMinutes: null, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [], dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0, attachmentCount: 0, commentCount: 0, customFieldValues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "st3", name: "Finalize design", title: "Finalize design", description: null, htmlDescription: null, status: "not_started", priority: "medium", type: "task", completed: false, completedAt: null, assigneeId: null, creatorId: "demo-user", projectId: "p1", sectionId: "s1", parentTaskId: "t1", order: 2, position: 2, dueDate: null, startDate: null, estimatedMinutes: null, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [], dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0, attachmentCount: 0, commentCount: 0, customFieldValues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const mockComments: CommentType[] = [
  { id: "c1", taskId: "t1", authorId: "user-2", text: "Looking great! Can we also add a dark mode variant?", htmlText: null, isPinned: false, parentCommentId: null, likes: 2, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "c2", taskId: "t1", authorId: "demo-user", text: "Good idea, I will add that to the scope.", htmlText: null, isPinned: false, parentCommentId: null, likes: 1, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString() },
];

const mockDependencies = [
  { id: "d1", label: "Set up project structure", type: "blocked_by", completed: true },
  { id: "d2", label: "Create color palette", type: "blocking", completed: false },
];

const mockTags = [
  { id: "tg1", name: "Design", color: "#7c3aed" },
  { id: "tg2", name: "Q2", color: "#059669" },
];

const assignees: Record<string, { name: string; initial: string; color: string }> = {
  "demo-user": { name: "Demo User", initial: "D", color: "bg-indigo-100 text-indigo-600" },
  "user-2": { name: "Sarah Chen", initial: "S", color: "bg-purple-100 text-purple-600" },
  "user-3": { name: "Alex Kim", initial: "A", color: "bg-blue-100 text-blue-600" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-600 bg-red-50" },
  medium: { label: "Medium", color: "text-yellow-600 bg-yellow-50" },
  low: { label: "Low", color: "text-blue-600 bg-blue-50" },
  none: { label: "None", color: "text-gray-500 bg-gray-50" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "text-gray-600 bg-gray-100" },
  in_progress: { label: "In Progress", color: "text-blue-600 bg-blue-50" },
  completed: { label: "Completed", color: "text-green-600 bg-green-50" },
  deferred: { label: "Deferred", color: "text-orange-600 bg-orange-50" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// -- Props --------------------------------------------------------------------

export interface TaskDetailPanelProps {
  task: Task;
  onClose?: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

// -- Component ----------------------------------------------------------------

export function TaskDetailPanel({ task, onClose, onUpdate }: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.name);
  const [description, setDescription] = useState(task.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDeps, setShowDeps] = useState(true);
  const [showCustomFields, setShowCustomFields] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(mockComments);
  const [subtasks, setSubtasks] = useState(mockSubtasks);

  const assignee = task.assigneeId ? assignees[task.assigneeId] : null;
  const priority = priorityConfig[task.priority] || priorityConfig.none;
  const status = statusConfig[task.status] || statusConfig.not_started;
  const isMilestone = task.type === "milestone";
  const isApproval = task.type === "approval";

  function handleTitleBlur() {
    setIsEditingTitle(false);
    if (title.trim() && title.trim() !== task.name) {
      onUpdate?.(task.id, { name: title.trim() });
    }
  }

  function handleAddComment() {
    if (!newComment.trim()) return;
    const comment: CommentType = {
      id: `c${Date.now()}`,
      taskId: task.id,
      authorId: "demo-user",
      text: newComment.trim(),
      htmlText: null,
      isPinned: false,
      parentCommentId: null,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setComments([...comments, comment]);
    setNewComment("");
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Status */}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
          {status.label}
        </span>

        {/* Milestone / Approval indicator */}
        {isMilestone && (
          <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
            <Milestone className="h-3 w-3" /> Milestone
          </span>
        )}
        {isApproval && (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            <ThumbsUp className="h-3 w-3" /> Approval
          </span>
        )}

        <div className="flex-1" />

        {/* Like */}
        <button
          onClick={() => setLiked(!liked)}
          className={`rounded p-1.5 transition ${liked ? "text-red-500" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
          title="Like"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </button>

        {/* Follow */}
        <button
          onClick={() => setFollowing(!following)}
          className={`rounded p-1.5 transition ${following ? "text-indigo-500" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
          title={following ? "Unfollow" : "Follow"}
        >
          <Bell className={`h-4 w-4 ${following ? "fill-current" : ""}`} />
        </button>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showActions && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Move to...
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="p-5">
          {/* Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === "Enter") handleTitleBlur(); if (e.key === "Escape") { setTitle(task.name); setIsEditingTitle(false); } }}
              autoFocus
              className="mb-4 w-full border-b-2 border-indigo-400 bg-transparent text-lg font-bold text-gray-900 outline-none"
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className="mb-4 cursor-text text-lg font-bold text-gray-900 hover:text-indigo-700"
            >
              {task.name}
            </h2>
          )}

          {/* Approval buttons */}
          {isApproval && task.approvalStatus === "pending" && (
            <div className="mb-4 flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                <ThumbsUp className="h-4 w-4" /> Approve
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                <ThumbsDown className="h-4 w-4" /> Reject
              </button>
            </div>
          )}

          {/* Meta fields */}
          <div className="mb-6 space-y-3">
            {/* Assignee */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Assignee</span>
              {assignee ? (
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${assignee.color}`}>
                    {assignee.initial}
                  </div>
                  <span className="text-sm text-gray-900">{assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>

            {/* Due date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Due date</span>
              <span className="text-sm text-gray-900">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "No due date"}
              </span>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <Flag className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Priority</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </div>

            {/* Project */}
            <div className="flex items-center gap-3">
              <FolderKanban className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Project</span>
              <span className="text-sm text-gray-900">Website Redesign</span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Tags</span>
              <div className="flex items-center gap-1.5">
                {mockTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
                <button className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Subtasks */}
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Subtasks
            </h3>
            <SubtaskList
              subtasks={subtasks}
              onToggleComplete={(id, completed) =>
                setSubtasks((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, completed, completedAt: completed ? new Date().toISOString() : null } : s))
                )
              }
              onAddSubtask={(name) => {
                const newSubtask: Task = {
                  id: `st${Date.now()}`, name, title: name, description: null, htmlDescription: null,
                  status: "not_started", priority: "none", type: "task", completed: false, completedAt: null,
                  assigneeId: null, creatorId: "demo-user", projectId: task.projectId, sectionId: task.sectionId,
                  parentTaskId: task.id, order: subtasks.length, position: subtasks.length, dueDate: null, startDate: null,
                  estimatedMinutes: null, actualMinutes: null, tagIds: [], followerIds: [], subtaskIds: [],
                  dependencyIds: [], approvalStatus: null, approverIds: [], likes: 0, attachmentCount: 0,
                  commentCount: 0, customFieldValues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                };
                setSubtasks([...subtasks, newSubtask]);
              }}
            />
          </div>

          {/* Dependencies */}
          <div className="mb-6">
            <button
              onClick={() => setShowDeps(!showDeps)}
              className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {showDeps ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Dependencies
            </button>
            {showDeps && (
              <div className="space-y-2">
                {mockDependencies.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
                    <Link2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs capitalize text-gray-500">{dep.type.replace("_", " ")}</span>
                    <span className={`flex-1 text-sm ${dep.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {dep.label}
                    </span>
                  </div>
                ))}
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <Plus className="h-3 w-3" /> Add dependency
                </button>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="mb-6">
            <button
              onClick={() => setShowCustomFields(!showCustomFields)}
              className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {showCustomFields ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Custom Fields
            </button>
            {showCustomFields && (
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs">Story Points</span>
                  <span className="text-gray-900">5</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs">Sprint</span>
                  <span className="text-gray-900">Sprint 14</span>
                </div>
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <Plus className="h-3 w-3" /> Add field
                </button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments ({comments.length})
            </h3>
            <div className="space-y-3">
              {comments.map((comment) => {
                const author = assignees[comment.authorId] || { name: "Unknown", initial: "?", color: "bg-gray-100 text-gray-600" };
                return (
                  <div key={comment.id} className="flex gap-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${author.color}`}>
                      {author.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">{author.name}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-700">{comment.text}</p>
                      {comment.likes > 0 && (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Heart className="h-2.5 w-2.5" /> {comment.likes}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add comment */}
            <div className="mt-4 flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                D
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(); }}
                  placeholder="Write a comment..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="rounded p-1 text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
