"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Paperclip,
  Download,
  Play,
  Square,
  Clock,
  Repeat,
  Lock,
} from "lucide-react";
import { SubtaskList } from "./subtask-list";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/lib/supabase";
import type { Task, Comment as CommentType } from "@/types";

// -- Helpers ------------------------------------------------------------------

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-600 bg-red-50" },
  medium: { label: "Medium", color: "text-yellow-600 bg-yellow-50" },
  low: { label: "Low", color: "text-blue-600 bg-blue-50" },
  none: { label: "None", color: "text-gray-500 bg-gray-50" },
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
  onUpdate?: (taskId: string, updates: Partial<Task>) => void | Promise<void>;
  onDelete?: (taskId: string) => void | Promise<void>;
  onDuplicate?: (taskId: string) => void | Promise<void>;
  onToggleComplete?: (taskId: string) => void | Promise<void>;
  onAddComment?: (taskId: string, text: string) => void | Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => void | Promise<void>;
  onToggleSubtaskComplete?: (subtaskId: string) => void | Promise<void>;
  onToggleLike?: (taskId: string) => void | Promise<void>;
  onToggleFollow?: (taskId: string) => void | Promise<void>;
  onSetApprovalStatus?: (taskId: string, status: string) => void | Promise<void>;
}

// -- Component ----------------------------------------------------------------

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleComplete,
  onAddComment,
  onAddSubtask,
  onToggleSubtaskComplete,
  onToggleLike,
  onToggleFollow,
  onSetApprovalStatus,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDeps, setShowDeps] = useState(true);
  const [showCustomFields, setShowCustomFields] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // -- Extended sections state --
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<
    "text" | "number" | "date" | "checkbox" | "single_select" | "multi_select" | "people"
  >("text");
  const [uploading, setUploading] = useState(false);
  const [manualMinutes, setManualMinutes] = useState<number | "">("");
  const [addBlockerTaskId, setAddBlockerTaskId] = useState("");
  const [addBlockedTaskId, setAddBlockedTaskId] = useState("");
  const [addProjectId, setAddProjectId] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -- Store selectors (pull only what we need) --
  const allTags = useAppStore((s) => s.tags);
  const allTasks = useAppStore((s) => s.tasks);
  const allProjects = useAppStore((s) => s.projects);
  const allUsers = useAppStore((s) => s.users);
  const taskTagsState = useAppStore((s) => s.taskTags);
  const taskDepsState = useAppStore((s) => s.taskDeps);
  const taskProjectsState = useAppStore((s) => s.taskProjects);
  const customFieldDefs = useAppStore((s) => s.customFieldDefs);
  const customFieldValuesState = useAppStore((s) => s.customFieldValues);
  const attachmentsState = useAppStore((s) => s.attachments);
  const timeEntriesState = useAppStore((s) => (s as any).timeEntries) as
    | import("@/types").TimeEntry[]
    | undefined;

  // -- Store actions --
  const createTag = useAppStore((s) => s.createTag);
  const addTagToTask = useAppStore((s) => s.addTagToTask);
  const removeTagFromTask = useAppStore((s) => s.removeTagFromTask);
  const getTaskTags = useAppStore((s) => s.getTaskTags);

  const getProjectCustomFields = useAppStore((s) => s.getProjectCustomFields);
  const setCustomFieldValue = useAppStore((s) => s.setCustomFieldValue);
  const getCustomFieldValues = useAppStore((s) => s.getCustomFieldValues);
  const createCustomFieldDef = useAppStore((s) => s.createCustomFieldDef);

  const addAttachmentStore = useAppStore((s) => s.addAttachment);
  const deleteAttachment = useAppStore((s) => s.deleteAttachment);
  const getTaskAttachments = useAppStore((s) => s.getTaskAttachments);

  const addDependency = useAppStore((s) => s.addDependency);
  const removeDependency = useAppStore((s) => s.removeDependency);
  const getBlockers = useAppStore((s) => s.getBlockers);
  const getBlocked = useAppStore((s) => s.getBlocked);
  const isTaskBlocked = useAppStore((s) => s.isTaskBlocked);

  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const addTimeEntry = useAppStore((s) => s.addTimeEntry);
  const getTaskTimeEntries = useAppStore((s) => s.getTaskTimeEntries);
  const getTaskActualMinutes = useAppStore((s) => s.getTaskActualMinutes);

  const addTaskToProject = useAppStore((s) => s.addTaskToProject);
  const removeTaskFromProject = useAppStore((s) => s.removeTaskFromProject);
  const getTaskProjects = useAppStore((s) => s.getTaskProjects);

  const updateTaskStore = useAppStore((s) => s.updateTask);

  const projectTaskTypes = useAppStore((s) =>
    task.projectId ? s.getProjectTaskTypes(task.projectId) : []
  );

  // Derive data from task prop
  const subtasks: Task[] = (task.subtasks as Task[]) || [];
  const comments: CommentType[] = (task.comments as CommentType[]) || [];
  const blockedBy = task.blockedBy || [];
  const blocking = task.blocking || [];
  const tags = task.tags || [];
  const customValues = task.customValues || [];
  const followers = task.followers || [];
  const likes = task.likes || [];

  // Sync state when task prop changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
  }, [task.id, task.title, task.description]);

  // Check if current user has liked/followed (approximate - check if any like/follower exists)
  useEffect(() => {
    setLiked((likes as Array<{ userId?: string }>).length > 0);
    setFollowing((followers as Array<{ userId?: string }>).length > 0);
  }, [likes, followers]);

  const assignee = task.assignee;
  const priority = priorityConfig[task.priority || "none"] || priorityConfig.none;
  const isMilestone = task.taskType === "milestone";
  const isApproval = task.taskType === "approval";

  function handleTitleBlur() {
    setIsEditingTitle(false);
    if (title.trim() && title.trim() !== task.title) {
      onUpdate?.(task.id, { title: title.trim() });
    }
  }

  function handleDescriptionBlur() {
    if (description !== (task.description || "")) {
      onUpdate?.(task.id, { description });
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await onAddComment?.(task.id, newComment.trim());
      setNewComment("");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleLike() {
    setLiked(!liked);
    await onToggleLike?.(task.id);
  }

  async function handleFollow() {
    setFollowing(!following);
    await onToggleFollow?.(task.id);
  }

  async function handleDelete() {
    setShowActions(false);
    await onDelete?.(task.id);
  }

  async function handleDuplicate() {
    setShowActions(false);
    await onDuplicate?.(task.id);
  }

  async function handleApprove() {
    await onSetApprovalStatus?.(task.id, "approved");
  }

  async function handleReject() {
    await onSetApprovalStatus?.(task.id, "rejected");
  }

  // -- Derived data for new sections (recomputes when store state changes) --
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _deps = [taskTagsState, taskDepsState, taskProjectsState, customFieldValuesState, attachmentsState, timeEntriesState, allTags];

  const currentTaskTags = useMemo(() => getTaskTags(task.id), [getTaskTags, task.id, taskTagsState]);
  const currentTaskTagIds = useMemo(() => new Set(currentTaskTags.map((t) => t.id)), [currentTaskTags]);
  const tagSuggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return [];
    return allTags
      .filter((t) => t.name.toLowerCase().includes(q) && !currentTaskTagIds.has(t.id))
      .slice(0, 8);
  }, [allTags, tagInput, currentTaskTagIds]);

  const projectCustomFields = useMemo(
    () => (task.projectId ? getProjectCustomFields(task.projectId) : []),
    [getProjectCustomFields, task.projectId, customFieldDefs]
  );
  const taskCustomValues = useMemo(
    () => getCustomFieldValues(task.id),
    [getCustomFieldValues, task.id, customFieldValuesState]
  );
  const customValueByField = useMemo(() => {
    const m = new Map<string, import("@/types").CustomFieldValueExt>();
    for (const v of taskCustomValues) m.set(v.fieldId, v);
    return m;
  }, [taskCustomValues]);

  const taskAttachments = useMemo(
    () => getTaskAttachments(task.id),
    [getTaskAttachments, task.id, attachmentsState]
  );

  const blockers = useMemo(() => getBlockers(task.id), [getBlockers, task.id, taskDepsState]);
  const blockedTasks = useMemo(() => getBlocked(task.id), [getBlocked, task.id, taskDepsState]);
  const taskIsBlocked = useMemo(() => isTaskBlocked(task.id), [isTaskBlocked, task.id, taskDepsState]);

  const timeEntries = useMemo(
    () => getTaskTimeEntries(task.id),
    [getTaskTimeEntries, task.id, timeEntriesState]
  );
  const actualMinutes = useMemo(
    () => getTaskActualMinutes(task.id),
    [getTaskActualMinutes, task.id, timeEntriesState]
  );
  const openTimerEntry = useMemo(
    () => timeEntries.find((e) => !e.endedAt) || null,
    [timeEntries]
  );

  const taskProjectIds = useMemo(
    () => getTaskProjects(task.id),
    [getTaskProjects, task.id, taskProjectsState]
  );
  const multiHomedProjects = useMemo(() => {
    const ids = new Set<string>(taskProjectIds);
    if (task.projectId) ids.add(task.projectId);
    return Array.from(ids)
      .map((id) => allProjects.find((p) => p.id === id))
      .filter(Boolean) as Array<{ id: string; name: string; color?: string }>;
  }, [taskProjectIds, task.projectId, allProjects]);

  const projectTasksForDeps = useMemo(() => {
    if (!task.projectId) return allTasks.filter((t) => t.id !== task.id);
    const blockerIds = new Set(blockers.map((b) => b.id));
    const blockedIds = new Set(blockedTasks.map((b) => b.id));
    return allTasks.filter(
      (t) =>
        t.id !== task.id &&
        t.projectId === task.projectId &&
        !blockerIds.has(t.id) &&
        !blockedIds.has(t.id)
    );
  }, [allTasks, task.id, task.projectId, blockers, blockedTasks]);

  const recurrence = ((task as any).recurrence || null) as
    | { freq?: string; interval?: number }
    | null;
  const recurrenceFreq = recurrence?.freq ?? "none";
  const recurrenceInterval = recurrence?.interval ?? 1;

  // -- Handlers --

  async function handleAddTagByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = allTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!currentTaskTagIds.has(existing.id)) {
        await addTagToTask(task.id, existing.id);
      }
    } else {
      const created = await createTag(trimmed);
      await addTagToTask(task.id, created.id);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  }

  async function handleRemoveTag(tagId: string) {
    await removeTagFromTask(task.id, tagId);
  }

  async function handleAddExistingTag(tagId: string) {
    await addTagToTask(task.id, tagId);
    setTagInput("");
    setShowTagSuggestions(false);
  }

  async function handleCustomFieldChange(
    def: import("@/types").CustomFieldDefExt,
    patch: Partial<import("@/types").CustomFieldValueExt>
  ) {
    await setCustomFieldValue(task.id, def.id, patch);
  }

  async function handleCreateCustomField() {
    if (!newFieldName.trim() || !task.projectId) return;
    await createCustomFieldDef({
      projectId: task.projectId,
      name: newFieldName.trim(),
      fieldType: newFieldType,
      position: projectCustomFields.length,
    });
    setNewFieldName("");
    setNewFieldType("text");
    setShowAddCustomField(false);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${task.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("attachments")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          console.error("Upload failed", error);
          continue;
        }
        await addAttachmentStore({
          taskId: task.id,
          filename: file.name,
          storagePath: path,
          mimeType: file.type || null,
          sizeBytes: file.size,
        });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment(id: string) {
    await deleteAttachment(id);
  }

  async function handleAddBlocker() {
    if (!addBlockerTaskId) return;
    await addDependency(addBlockerTaskId, task.id);
    setAddBlockerTaskId("");
  }

  async function handleAddBlocked() {
    if (!addBlockedTaskId) return;
    await addDependency(task.id, addBlockedTaskId);
    setAddBlockedTaskId("");
  }

  async function handleRemoveBlocker(blockerId: string) {
    const edge = taskDepsState.find(
      (d) => d.blockerTaskId === blockerId && d.blockedTaskId === task.id
    );
    if (edge) await removeDependency(edge.id);
  }

  async function handleRemoveBlocked(blockedId: string) {
    const edge = taskDepsState.find(
      (d) => d.blockerTaskId === task.id && d.blockedTaskId === blockedId
    );
    if (edge) await removeDependency(edge.id);
  }

  async function handleToggleTimer() {
    if (openTimerEntry) {
      await stopTimer(openTimerEntry.id);
    } else {
      await startTimer(task.id);
    }
  }

  async function handleAddManualTime() {
    if (!manualMinutes || manualMinutes <= 0) return;
    await addTimeEntry(task.id, Number(manualMinutes));
    setManualMinutes("");
  }

  async function handleRecurrenceChange(
    freq: string,
    interval: number = recurrenceInterval || 1
  ) {
    if (freq === "none") {
      await updateTaskStore(task.id, { recurrence: null } as any);
    } else {
      await updateTaskStore(task.id, { recurrence: { freq, interval } } as any);
    }
  }

  async function handleAddToProject() {
    if (!addProjectId) return;
    await addTaskToProject(task.id, addProjectId);
    setAddProjectId("");
  }

  async function handleRemoveFromProject(projectId: string) {
    if (projectId === task.projectId) return;
    await removeTaskFromProject(task.id, projectId);
  }

  function formatBytes(bytes?: number | null) {
    if (!bytes || bytes <= 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Completed indicator */}
        <button
          onClick={() => onToggleComplete?.(task.id)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            task.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {task.completed && (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

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
          onClick={handleLike}
          className={`rounded p-1.5 transition ${liked ? "text-red-500" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
          title="Like"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </button>

        {/* Follow */}
        <button
          onClick={handleFollow}
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
              <button
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Move to...
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
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
        {/* Blocked banner */}
        {taskIsBlocked && (
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
            <Lock className="h-3.5 w-3.5" />
            Blocked — waiting on {blockers.filter((b) => !b.completed).length} incomplete task
            {blockers.filter((b) => !b.completed).length === 1 ? "" : "s"}
          </div>
        )}
        <div className="p-5">
          {/* Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === "Enter") handleTitleBlur(); if (e.key === "Escape") { setTitle(task.title); setIsEditingTitle(false); } }}
              autoFocus
              className="mb-4 w-full border-b-2 border-indigo-400 bg-transparent text-lg font-bold text-gray-900 outline-none"
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className="mb-4 cursor-text text-lg font-bold text-gray-900 hover:text-indigo-700"
            >
              {task.title}
            </h2>
          )}

          {/* Approval buttons */}
          {isApproval && task.approvalStatus === "pending" && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <ThumbsUp className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={handleReject}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
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
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                    {(assignee.name || "?")[0].toUpperCase()}
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

            {/* Task type */}
            <div className="flex items-center gap-3">
              <Milestone className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Type</span>
              <select
                value={task.taskType || "task"}
                onChange={(e) => onUpdate?.(task.id, { taskType: e.target.value })}
                className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-800 focus:border-indigo-400 focus:outline-none"
              >
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
                <option value="approval">Approval</option>
                {projectTaskTypes.map((tt) => (
                  <option key={tt.id} value={`custom:${tt.id}`}>
                    {tt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="flex items-center gap-3">
              <FolderKanban className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Project</span>
              <span className="text-sm text-gray-900">
                {task.project ? (task.project as { name: string }).name : "No project"}
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="w-20 text-xs text-gray-500">Tags</span>
              <div className="flex items-center gap-1.5">
                {(tags as Array<{ tag?: { id: string; name: string; color: string }; id: string }>).map((tt) => {
                  const t = tt.tag || tt;
                  return (
                    <span
                      key={t.id}
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: `${(t as { color?: string }).color || "#6366f1"}20`, color: (t as { color?: string }).color || "#6366f1" }}
                    >
                      {(t as { name: string }).name}
                    </span>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-sm text-gray-400">No tags</span>
                )}
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
              onBlur={handleDescriptionBlur}
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
              onToggleComplete={(id) => {
                onToggleSubtaskComplete?.(id);
              }}
              onAddSubtask={(name) => {
                onAddSubtask?.(task.id, name);
              }}
            />
          </div>

          {/* Tags (enhanced) */}
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Tag className="h-3.5 w-3.5" /> Tags
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {currentTaskTags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${t.color}20`, color: t.color }}
                >
                  {t.name}
                  <button
                    onClick={() => handleRemoveTag(t.id)}
                    className="rounded-full hover:bg-black/10"
                    aria-label={`Remove ${t.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {currentTaskTags.length === 0 && (
                <span className="text-xs text-gray-400">No tags</span>
              )}
            </div>
            <div className="relative mt-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTagByName(tagInput);
                  } else if (e.key === "Escape") {
                    setTagInput("");
                    setShowTagSuggestions(false);
                  }
                }}
                placeholder="Add a tag... (Enter to create)"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {tagSuggestions.map((t) => (
                    <button
                      key={t.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddExistingTag(t.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom Fields (enhanced) */}
          <div className="mb-6">
            <button
              onClick={() => setShowCustomFields(!showCustomFields)}
              className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {showCustomFields ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Custom Fields
            </button>
            {showCustomFields && (
              <div className="space-y-2">
                {projectCustomFields.length === 0 && (
                  <p className="text-xs text-gray-400">No custom fields defined for this project</p>
                )}
                {projectCustomFields.map((def) => {
                  const val = customValueByField.get(def.id);
                  const choices = def.options?.choices || [];
                  return (
                    <div key={def.id} className="flex items-start gap-3">
                      <span className="mt-1.5 w-24 shrink-0 text-xs text-gray-500">{def.name}</span>
                      <div className="min-w-0 flex-1">
                        {def.fieldType === "text" && (
                          <input
                            type="text"
                            defaultValue={val?.valueText ?? ""}
                            onBlur={(e) =>
                              handleCustomFieldChange(def, { valueText: e.target.value || null })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        )}
                        {def.fieldType === "number" && (
                          <input
                            type="number"
                            defaultValue={val?.valueNumber ?? ""}
                            onBlur={(e) =>
                              handleCustomFieldChange(def, {
                                valueNumber: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        )}
                        {def.fieldType === "date" && (
                          <input
                            type="date"
                            defaultValue={val?.valueDate ? val.valueDate.slice(0, 10) : ""}
                            onBlur={(e) =>
                              handleCustomFieldChange(def, { valueDate: e.target.value || null })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        )}
                        {def.fieldType === "checkbox" && (
                          <input
                            type="checkbox"
                            checked={!!val?.valueBool}
                            onChange={(e) =>
                              handleCustomFieldChange(def, { valueBool: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        )}
                        {def.fieldType === "single_select" && (
                          <select
                            value={val?.valueSelectIds?.[0] ?? ""}
                            onChange={(e) =>
                              handleCustomFieldChange(def, {
                                valueSelectIds: e.target.value ? [e.target.value] : null,
                              })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          >
                            <option value="">—</option>
                            {choices.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {def.fieldType === "multi_select" && (
                          <div className="flex flex-wrap gap-2">
                            {choices.length === 0 && (
                              <span className="text-xs text-gray-400">No choices defined</span>
                            )}
                            {choices.map((c) => {
                              const selected = val?.valueSelectIds?.includes(c.id) ?? false;
                              return (
                                <label key={c.id} className="flex items-center gap-1 text-xs text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => {
                                      const prev = val?.valueSelectIds || [];
                                      const next = e.target.checked
                                        ? [...prev, c.id]
                                        : prev.filter((id) => id !== c.id);
                                      handleCustomFieldChange(def, {
                                        valueSelectIds: next.length ? next : null,
                                      });
                                    }}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  {c.label}
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {def.fieldType === "people" && (
                          <select
                            value={val?.valueUserId ?? ""}
                            onChange={(e) =>
                              handleCustomFieldChange(def, { valueUserId: e.target.value || null })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          >
                            <option value="">Unassigned</option>
                            {allUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {def.fieldType === "formula" && (
                          <span className="text-sm text-gray-400">
                            {val?.valueText ?? val?.valueNumber ?? "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add custom field */}
                {!showAddCustomField ? (
                  <button
                    onClick={() => setShowAddCustomField(true)}
                    disabled={!task.projectId}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" /> Add custom field
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-gray-200 p-2">
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Field name"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as typeof newFieldType)}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="single_select">Single select</option>
                      <option value="multi_select">Multi select</option>
                      <option value="people">People</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateCustomField}
                        disabled={!newFieldName.trim() || !task.projectId}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCustomField(false);
                          setNewFieldName("");
                          setNewFieldType("text");
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Paperclip className="h-3.5 w-3.5" /> Attachments
            </h3>
            <div className="space-y-1.5">
              {taskAttachments.length === 0 && (
                <p className="text-xs text-gray-400">No attachments</p>
              )}
              {taskAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-gray-900">{att.filename}</div>
                    <div className="text-[10px] text-gray-400">
                      {att.mimeType || "file"}
                      {att.sizeBytes ? ` · ${formatBytes(att.sizeBytes)}` : ""}
                    </div>
                  </div>
                  {att.publicUrl && (
                    <a
                      href={att.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                  {uploading ? "Uploading..." : "Attach file"}
                </button>
              </div>
            </div>
          </div>

          {/* Dependencies (enhanced) */}
          <div className="mb-6">
            <button
              onClick={() => setShowDeps(!showDeps)}
              className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {showDeps ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Dependencies
            </button>
            {showDeps && (
              <div className="space-y-3">
                {/* Blocked by */}
                <div>
                  <div className="mb-1 text-[11px] font-medium text-gray-500">Blocked by</div>
                  <div className="space-y-1.5">
                    {blockers.length === 0 && (
                      <p className="text-xs text-gray-400">No blockers</p>
                    )}
                    {blockers.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
                      >
                        <Link2 className="h-3.5 w-3.5 text-gray-400" />
                        <span
                          className={`flex-1 text-sm ${
                            b.completed ? "text-gray-400 line-through" : "text-gray-900"
                          }`}
                        >
                          {b.title}
                        </span>
                        <button
                          onClick={() => handleRemoveBlocker(b.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove blocker"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <select
                        value={addBlockerTaskId}
                        onChange={(e) => setAddBlockerTaskId(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">+ Add blocker...</option>
                        {projectTasksForDeps.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddBlocker}
                        disabled={!addBlockerTaskId}
                        className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Blocking */}
                <div>
                  <div className="mb-1 text-[11px] font-medium text-gray-500">Blocking</div>
                  <div className="space-y-1.5">
                    {blockedTasks.length === 0 && (
                      <p className="text-xs text-gray-400">Not blocking anything</p>
                    )}
                    {blockedTasks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
                      >
                        <Link2 className="h-3.5 w-3.5 text-gray-400" />
                        <span
                          className={`flex-1 text-sm ${
                            b.completed ? "text-gray-400 line-through" : "text-gray-900"
                          }`}
                        >
                          {b.title}
                        </span>
                        <button
                          onClick={() => handleRemoveBlocked(b.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove dependency"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <select
                        value={addBlockedTaskId}
                        onChange={(e) => setAddBlockedTaskId(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">+ Add blocked task...</option>
                        {projectTasksForDeps.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddBlocked}
                        disabled={!addBlockedTaskId}
                        className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time Tracking */}
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Clock className="h-3.5 w-3.5" /> Time Tracking
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-900">
                  Total: <span className="font-medium">{formatMinutes(actualMinutes)}</span>
                </span>
                {openTimerEntry && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                    Timer running
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleTimer}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
                    openTimerEntry ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {openTimerEntry ? (
                    <>
                      <Square className="h-3 w-3" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" /> Start timer
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={manualMinutes}
                    onChange={(e) =>
                      setManualMinutes(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Minutes"
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    onClick={handleAddManualTime}
                    disabled={!manualMinutes || manualMinutes <= 0}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Repeat className="h-3.5 w-3.5" /> Recurrence
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={recurrenceFreq}
                onChange={(e) => handleRecurrenceChange(e.target.value, recurrenceInterval)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {recurrenceFreq !== "none" && (
                <>
                  <span className="text-xs text-gray-500">every</span>
                  <input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={(e) =>
                      handleRecurrenceChange(recurrenceFreq, Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="text-xs text-gray-500">
                    {recurrenceFreq === "daily"
                      ? "day(s)"
                      : recurrenceFreq === "weekly"
                      ? "week(s)"
                      : "month(s)"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Projects (Multi-homing) */}
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <FolderKanban className="h-3.5 w-3.5" /> Projects
            </h3>
            <div className="space-y-1.5">
              {multiHomedProjects.length === 0 && (
                <p className="text-xs text-gray-400">Not in any project</p>
              )}
              {multiHomedProjects.map((p) => {
                const isPrimary = p.id === task.projectId;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-1.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.color || "#6366f1" }}
                    />
                    <span className="flex-1 text-sm text-gray-900">{p.name}</span>
                    {isPrimary && (
                      <span className="text-[10px] font-medium text-gray-400">primary</span>
                    )}
                    {!isPrimary && (
                      <button
                        onClick={() => handleRemoveFromProject(p.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove from project"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2">
                <select
                  value={addProjectId}
                  onChange={(e) => setAddProjectId(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">+ Add to project...</option>
                  {allProjects
                    .filter((p) => !multiHomedProjects.some((mp) => mp.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddToProject}
                  disabled={!addProjectId}
                  className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments ({comments.length})
            </h3>
            <div className="space-y-3">
              {comments.map((comment) => {
                const author = comment.author;
                const initial = author?.name?.[0]?.toUpperCase() || "?";
                return (
                  <div key={comment.id} className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">{author?.name || "Unknown"}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-700">{comment.text}</p>
                      {comment.likes && (comment.likes as unknown[]).length > 0 && (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Heart className="h-2.5 w-2.5" /> {(comment.likes as unknown[]).length}
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
                U
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
                  disabled={!newComment.trim() || isSubmittingComment}
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
