"use client";

import { useState } from "react";
import { Trash2, RotateCcw, FolderOpen, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

type Tab = "tasks" | "projects";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

export default function TrashPage() {
  const [tab, setTab] = useState<Tab>("tasks");

  // We read the raw arrays and filter here so the component re-renders when
  // either tasks or projects change.
  const allTasks = useAppStore((s) => s.tasks);
  const allProjects = useAppStore((s) => s.projects);

  const restoreTask = useAppStore((s) => s.restoreTask);
  const deleteTaskHard = useAppStore((s) => s.deleteTaskHard);
  const emptyTrash = useAppStore((s) => s.emptyTrash);
  const restoreProject = useAppStore((s) => s.restoreProject);
  const deleteProjectHard = useAppStore((s) => s.deleteProjectHard);
  const emptyTrashProjects = useAppStore((s) => s.emptyTrashProjects);

  const trashedTasks = allTasks.filter((t) => !!(t as any).deletedAt);
  const trashedProjects = allProjects.filter((p) => !!(p as any).deletedAt);

  async function handleEmpty() {
    if (tab === "tasks") {
      if (!trashedTasks.length) return;
      if (!confirm(`Permanently delete ${trashedTasks.length} task(s)?`)) return;
      await emptyTrash();
    } else {
      if (!trashedProjects.length) return;
      if (!confirm(`Permanently delete ${trashedProjects.length} project(s)?`)) return;
      await emptyTrashProjects();
    }
  }

  async function handleDeleteForever(
    id: string,
    kind: "task" | "project",
    label: string
  ) {
    if (!confirm(`Permanently delete ${kind} "${label}"? This cannot be undone.`))
      return;
    if (kind === "task") await deleteTaskHard(id);
    else await deleteProjectHard(id);
  }

  const list = tab === "tasks" ? trashedTasks : trashedProjects;

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <Trash2 className="h-5 w-5" /> Trash
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
            Deleted items are kept here until you restore or permanently delete them.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={handleEmpty}
          disabled={list.length === 0}
        >
          Empty trash
        </Button>
      </header>

      {/* Tabs -------------------------------------------------------------- */}
      <div className="mb-4 flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab("tasks")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "tasks"
              ? "border-b-2 border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Tasks ({trashedTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("projects")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "projects"
              ? "border-b-2 border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Projects ({trashedProjects.length})
        </button>
      </div>

      {/* Empty state ------------------------------------------------------- */}
      {list.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-surface-dark">
          <Trash2 className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No {tab} in trash.
          </p>
        </div>
      )}

      {/* List -------------------------------------------------------------- */}
      {list.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-surface-dark">
          {list.map((item: any) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {tab === "tasks" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
                ) : (
                  <FolderOpen className="h-4 w-4 flex-shrink-0 text-gray-400" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tab === "tasks" ? item.title : item.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Trashed {formatWhen(item.deletedAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() =>
                    tab === "tasks" ? restoreTask(item.id) : restoreProject(item.id)
                  }
                >
                  Restore
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    handleDeleteForever(
                      item.id,
                      tab === "tasks" ? "task" : "project",
                      tab === "tasks" ? item.title : item.name
                    )
                  }
                >
                  Delete forever
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
