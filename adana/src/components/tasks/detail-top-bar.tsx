"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  Heart,
  Link2,
  Maximize2,
  MoreHorizontal,
  Play,
  Plus,
  Share2,
  Square,
  X,
} from "lucide-react";
import { DetailMoreMenu } from "./detail-more-menu";
import type { Task, User } from "@/types";

export interface DetailTopBarProps {
  task: Task;
  followers: Array<{ user?: User; userId?: string }>;
  liked: boolean;
  isTimerRunning: boolean;
  manualMinutes: number | "";
  isPrivate: boolean;

  onToggleComplete: () => void;
  onToggleTimer: () => void;
  onSetManualMinutes: (n: number | "") => void;
  onSubmitManualMinutes: () => void;
  onAddCollaborator: () => void;
  onShare: () => void;
  onLike: () => void;
  onCopyLink: () => void;
  onOpenFullscreen: () => void;
  onClose: () => void;

  // more menu
  onAddToAnotherProject: () => void;
  onFocusAddSubtask: () => void;
  onFocusAddTag: () => void;
  onUploadAttachment: () => void;
  onCreateFollowUp: () => void;
  onMergeDuplicates: () => void;
  onConvertTo: (type: "task" | "milestone" | "approval") => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onTogglePrivate: () => void;
  onDelete: () => void;
}

export function DetailTopBar(props: DetailTopBarProps) {
  const {
    task,
    followers,
    liked,
    isTimerRunning,
    manualMinutes,
    isPrivate,
    onToggleComplete,
    onToggleTimer,
    onSetManualMinutes,
    onSubmitManualMinutes,
    onAddCollaborator,
    onShare,
    onLike,
    onCopyLink,
    onOpenFullscreen,
    onClose,
    onAddToAnotherProject,
    onFocusAddSubtask,
    onFocusAddTag,
    onUploadAttachment,
    onCreateFollowUp,
    onMergeDuplicates,
    onConvertTo,
    onDuplicate,
    onPrint,
    onTogglePrivate,
    onDelete,
  } = props;

  const [showMore, setShowMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  function handleCopyLink() {
    onCopyLink();
    setToast("Link copied");
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-3 py-2">
      {/* Mark complete / completed pill */}
      <button
        onClick={onToggleComplete}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
          task.completed
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
        {task.completed ? "Completed" : "Mark complete"}
      </button>

      <span className="mx-1 h-5 w-px bg-gray-200" />

      {/* Start timer */}
      <button
        onClick={onToggleTimer}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
          isTimerRunning
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title={isTimerRunning ? "Stop timer" : "Start timer"}
      >
        {isTimerRunning ? <Square className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {isTimerRunning ? "Stop" : "Start timer"}
      </button>

      {/* Add time */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          value={manualMinutes}
          onChange={(e) =>
            onSetManualMinutes(e.target.value === "" ? "" : Number(e.target.value))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitManualMinutes();
          }}
          placeholder="Add time"
          className="w-20 rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
        <button
          onClick={onSubmitManualMinutes}
          disabled={!manualMinutes || (typeof manualMinutes === "number" && manualMinutes <= 0)}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          title="Add time"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Assignee + add collaborator */}
      <div className="flex items-center -space-x-1">
        {task.assignee && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-medium text-indigo-600"
            title={task.assignee.name || "Assignee"}
          >
            {(task.assignee.name || "?")[0].toUpperCase()}
          </div>
        )}
        {followers.slice(0, 2).map((f, i) => {
          const name = f.user?.name || "?";
          return (
            <div
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-600"
              title={name}
            >
              {name[0]?.toUpperCase()}
            </div>
          );
        })}
        <button
          onClick={onAddCollaborator}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-50 text-gray-500 hover:bg-gray-100"
          title="Add collaborator"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Share */}
      <button
        onClick={onShare}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        title="Share"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        className={`rounded p-1.5 transition ${
          liked ? "text-red-500" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
        title="Like"
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="Copy task link"
      >
        <Link2 className="h-4 w-4" />
      </button>

      {/* Fullscreen */}
      <button
        onClick={onOpenFullscreen}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="Open in fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setShowMore((v) => !v)}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <DetailMoreMenu
          open={showMore}
          onClose={() => setShowMore(false)}
          taskType={task.taskType || "task"}
          isPrivate={isPrivate}
          onAddToAnotherProject={onAddToAnotherProject}
          onAddSubtask={onFocusAddSubtask}
          onAddTags={onFocusAddTag}
          onUploadAttachment={onUploadAttachment}
          onCreateFollowUp={onCreateFollowUp}
          onMergeDuplicates={onMergeDuplicates}
          onConvertTo={onConvertTo}
          onDuplicate={onDuplicate}
          onPrint={onPrint}
          onTogglePrivate={onTogglePrivate}
          onDelete={onDelete}
        />
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-1 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
