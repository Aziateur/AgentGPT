"use client";

import * as React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface OptionsPanelProps {
  viewName: string;
  onViewNameChange: (v: string) => void;
  emoji: string;
  onEmojiChange: (v: string) => void;
  onOpenColumns: () => void;
  onOpenFilters: () => void;
  onOpenSorts: () => void;
  onOpenGroups: () => void;
  subtasksMode: "collapsed" | "expanded";
  onSubtasksMode: (v: "collapsed" | "expanded") => void;
  onCollapse: () => void;
}

const EMOJIS = ["📋", "📝", "📅", "📌", "🚀", "✅", "🎯", "🔥", "⭐", "🏆"];

export function OptionsPanel({
  viewName,
  onViewNameChange,
  emoji,
  onEmojiChange,
  onOpenColumns,
  onOpenFilters,
  onOpenSorts,
  onOpenGroups,
  subtasksMode,
  onSubtasksMode,
  onCollapse,
}: OptionsPanelProps) {
  const [emojiOpen, setEmojiOpen] = React.useState(false);

  function row(label: string, onClick: () => void) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        {label}
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">List</h3>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-lg hover:bg-gray-50"
              aria-label="Choose icon"
            >
              {emoji}
            </button>
            {emojiOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 grid w-48 grid-cols-5 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onEmojiChange(e);
                      setEmojiOpen(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={viewName}
            onChange={(e) => onViewNameChange(e.target.value)}
            placeholder="View name"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400"
          />
        </div>

        <div className="space-y-0.5">
          {row("Show/hide columns", onOpenColumns)}
          {row("Filters", onOpenFilters)}
          {row("Sorts", onOpenSorts)}
          {row("Groups", onOpenGroups)}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <label className="block px-2 py-2 text-sm text-gray-700">
            <div className="mb-1 font-medium">Subtasks</div>
            <select
              value={subtasksMode}
              onChange={(e) => onSubtasksMode(e.target.value as "collapsed" | "expanded")}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="collapsed">Collapsed</option>
              <option value="expanded">Expanded</option>
            </select>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          className="text-xs text-indigo-600 hover:underline"
        >
          Send feedback
        </button>
      </div>
    </div>
  );
}
