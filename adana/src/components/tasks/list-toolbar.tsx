"use client";

import * as React from "react";
import { ChevronDown, Filter, ArrowUpDown, LayoutGrid, SlidersHorizontal, Search, Plus, X } from "lucide-react";

type Mode = "filter" | "sort" | "group" | "options" | null;

export interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onAddTask: () => void;
  onAddFromTemplate: () => void;
  onConvertFromExisting: () => void;
  onToggle: (mode: Mode) => void;
  active: Mode;
  filterCount: number;
  sortLabel: string | null;
  groupLabel: string | null;
}

export function ListToolbar({
  searchValue,
  onSearchChange,
  onAddTask,
  onAddFromTemplate,
  onConvertFromExisting,
  onToggle,
  active,
  filterCount,
  sortLabel,
  groupLabel,
}: ListToolbarProps) {
  const [splitOpen, setSplitOpen] = React.useState(false);
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const splitRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (splitRef.current && !splitRef.current.contains(e.target as Node)) {
        setSplitOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  React.useEffect(() => {
    if (searchExpanded && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchExpanded]);

  const btn = (
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    mode: Mode,
    badge?: string | number | null,
  ) => {
    const isActive = active === mode;
    return (
      <button
        type="button"
        onClick={() => onToggle(mode)}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
          isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
        {badge !== undefined && badge !== null && badge !== 0 && badge !== "" && (
          <span className="ml-0.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Split add-task button */}
      <div ref={splitRef} className="relative inline-flex">
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 rounded-l-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
        <button
          type="button"
          onClick={() => setSplitOpen((v) => !v)}
          className="rounded-r-md border-l border-indigo-500 bg-indigo-600 px-1.5 py-1.5 text-white hover:bg-indigo-700"
          aria-label="More add-task options"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {splitOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setSplitOpen(false);
                onAddFromTemplate();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
            >
              From template
            </button>
            <button
              type="button"
              onClick={() => {
                setSplitOpen(false);
                onConvertFromExisting();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
            >
              Convert from existing
            </button>
          </div>
        )}
      </div>

      <div className="mx-1 h-5 w-px bg-gray-200" aria-hidden />

      {btn("Filter", Filter, "filter", filterCount || null)}
      {btn("Sort", ArrowUpDown, "sort", sortLabel ? "·" : null)}
      {btn("Group", LayoutGrid, "group", groupLabel && groupLabel !== "Sections" ? "·" : null)}
      {btn("Options", SlidersHorizontal, "options", null)}

      {/* Search magnifier */}
      <div className="ml-1 inline-flex items-center">
        {searchExpanded ? (
          <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search this view..."
              className="w-44 bg-transparent py-1 text-xs text-gray-700 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                setSearchExpanded(false);
              }}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
              aria-label="Close search"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchExpanded(true)}
            className={`rounded-md p-1.5 transition ${
              searchValue ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
