"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  label: string;
}

interface Group {
  title: string;
  items: Shortcut[];
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
const MOD = isMac ? "Cmd" : "Ctrl";

const GROUPS: Group[] = [
  {
    title: "Global",
    items: [
      { keys: `${MOD} + K`, label: "Open search palette" },
      { keys: `${MOD} + /`, label: "Open keyboard shortcuts" },
    ],
  },
  {
    title: "Create",
    items: [
      { keys: "Tab + Q", label: "Create task" },
      { keys: "Tab + P", label: "Add to project" },
      { keys: "Tab + S", label: "Add subtask" },
      { keys: "Tab + T", label: "Add tags" },
    ],
  },
  {
    title: "Tasks",
    items: [
      { keys: "Shift + Tab + F", label: "Create follow-up" },
      { keys: "Shift + Tab + D", label: "Merge duplicates" },
      { keys: "Tab + Del", label: "Delete task" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: `${MOD} + 1`, label: "Home" },
      { keys: `${MOD} + 2`, label: "My tasks" },
      { keys: `${MOD} + 3`, label: "Inbox" },
    ],
  },
];

export function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-adana-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Keyboard shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto p-5 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {g.title}
              </h4>
              <ul className="space-y-1.5">
                {g.items.map((s) => (
                  <li
                    key={s.keys}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-200">{s.label}</span>
                    <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 shadow-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-300">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="border-t border-gray-100 px-5 py-2 text-[11px] text-gray-400 dark:border-gray-700">
          Press {MOD}+/ anywhere to reopen this dialog.
        </div>
      </div>
    </div>
  );
}
