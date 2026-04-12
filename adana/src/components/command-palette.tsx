"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
      setQuery("");
    }
    function onToggleCheat() {
      setCheatsheetOpen((v) => !v);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setCheatsheetOpen(false);
      }
    }
    window.addEventListener("adana:command-palette", onOpen as EventListener);
    window.addEventListener(
      "adana:toggle-cheatsheet",
      onToggleCheat as EventListener
    );
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(
        "adana:command-palette",
        onOpen as EventListener
      );
      window.removeEventListener(
        "adana:toggle-cheatsheet",
        onToggleCheat as EventListener
      );
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { projects: [], tasks: [] };
    return {
      projects: projects
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 5),
      tasks: tasks
        .filter((t) => (t.title ?? "").toLowerCase().includes(q))
        .slice(0, 8),
    };
  }, [query, projects, tasks]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[560px] max-w-[90vw] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects and tasks..."
              className="w-full border-b border-gray-100 bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:text-gray-100"
            />
            <div className="max-h-80 overflow-y-auto py-1">
              {results.projects.length === 0 && results.tasks.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  {query ? "No results" : "Type to search..."}
                </div>
              )}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Projects
                  </div>
                  {results.projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        window.location.href = `/project/list?id=${p.id}`;
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {results.tasks.length > 0 && (
                <div>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Tasks
                  </div>
                  {results.tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (t.projectId) {
                          window.location.href = `/project/list?id=${t.projectId}`;
                        }
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {cheatsheetOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          onClick={() => setCheatsheetOpen(false)}
        >
          <div
            className="w-[400px] rounded-lg border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Keyboard shortcuts
            </h2>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex justify-between">
                <span>Open command palette</span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                  Cmd/Ctrl + K
                </kbd>
              </li>
              <li className="flex justify-between">
                <span>Focus global search</span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                  /
                </kbd>
              </li>
              <li className="flex justify-between">
                <span>Create task</span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                  C
                </kbd>
              </li>
              <li className="flex justify-between">
                <span>Toggle this cheat sheet</span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                  ?
                </kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
