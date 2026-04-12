"use client";

import { useAppStore } from "@/store/app-store";
import type { SavedView, FilterSpec, SortSpec } from "@/types";
import { Bookmark, Plus, Trash2 } from "lucide-react";

interface SavedViewsBarProps {
  projectId: string;
  currentViewType: "list" | "board" | "timeline" | "calendar";
  currentFilters: FilterSpec[];
  currentSort: SortSpec[];
}

export function SavedViewsBar({
  projectId,
  currentViewType,
  currentFilters,
  currentSort,
}: SavedViewsBarProps) {
  const savedViews = useAppStore((s) => s.savedViews);
  const createSavedView = useAppStore((s) => s.createSavedView);
  const deleteSavedView = useAppStore((s) => s.deleteSavedView);

  const projectViews = savedViews.filter((v) => v.projectId === projectId);

  async function handleSave() {
    const name = typeof window !== "undefined" ? window.prompt("Name this view:") : null;
    if (!name || !name.trim()) return;
    await createSavedView({
      name: name.trim(),
      projectId,
      viewType: currentViewType,
      filters: currentFilters,
      sort: currentSort,
    });
  }

  function handleApply(view: SavedView) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("adana:apply-view", { detail: view }));
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteSavedView(id);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <Bookmark className="h-4 w-4 text-gray-400" />
      <span className="text-xs font-medium text-gray-500">Saved views</span>
      {projectViews.length === 0 && (
        <span className="text-xs text-gray-400">None yet</span>
      )}
      {projectViews.map((v) => (
        <div
          key={v.id}
          className="group flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          <button onClick={() => handleApply(v)} className="flex items-center gap-1">
            <span>{v.name}</span>
            <span className="rounded bg-white/70 px-1 text-[10px] uppercase text-indigo-500">
              {v.viewType}
            </span>
          </button>
          <button
            onClick={(e) => handleDelete(e, v.id)}
            className="opacity-0 transition group-hover:opacity-100"
            aria-label="Delete saved view"
          >
            <Trash2 className="h-3 w-3 text-indigo-500 hover:text-red-500" />
          </button>
        </div>
      ))}
      <button
        onClick={handleSave}
        className="ml-auto inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
      >
        <Plus className="h-3 w-3" />
        Save current view
      </button>
    </div>
  );
}
