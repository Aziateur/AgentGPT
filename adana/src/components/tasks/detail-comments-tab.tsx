"use client";

import { useMemo, useState } from "react";
import { AtSign, Heart, Send } from "lucide-react";
import type { Comment as CommentType } from "@/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export interface DetailCommentsTabProps {
  comments: CommentType[];
  sortAsc: boolean;
  newComment: string;
  isSubmitting: boolean;
  onChangeComment: (v: string) => void;
  onSubmitComment: () => void;
  onShowMentionPicker?: () => void;
}

export function DetailCommentsTab({
  comments,
  sortAsc,
  newComment,
  isSubmitting,
  onChangeComment,
  onSubmitComment,
  onShowMentionPicker,
}: DetailCommentsTabProps) {
  const sorted = useMemo(() => {
    const arr = [...comments];
    arr.sort((a, b) => {
      const ad = new Date(a.createdAt).getTime();
      const bd = new Date(b.createdAt).getTime();
      return sortAsc ? ad - bd : bd - ad;
    });
    return arr;
  }, [comments, sortAsc]);

  return (
    <div>
      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400">No comments yet</p>
        )}
        {sorted.map((comment) => {
          const author = comment.author;
          const initial = author?.name?.[0]?.toUpperCase() || "?";
          return (
            <div key={comment.id} className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">
                    {author?.name || "Unknown"}
                  </span>
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

      {/* Composer */}
      <div className="mt-4 flex gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
          U
        </div>
        <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-gray-200">
          <ComposerTextarea
            value={newComment}
            onChange={onChangeComment}
            onSubmit={onSubmitComment}
          />
          <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1">
            <button
              type="button"
              onClick={onShowMentionPicker}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Mention"
            >
              <AtSign className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-30"
            >
              <Send className="h-3 w-3" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposerTextarea({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder="Write a comment..."
      rows={2}
      className="min-h-[48px] resize-none rounded-t-lg bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
    />
  );
}
