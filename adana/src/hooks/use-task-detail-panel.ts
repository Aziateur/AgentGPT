"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Tiny dedicated zustand store for the global task detail panel.
// Lets any component call `openTask(id)` / `closeTask()` without prop
// drilling, and lets a single global host render the drawer.
// ---------------------------------------------------------------------------

interface TaskDetailStore {
  selectedTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;
  setSelectedTaskId: (id: string | null) => void;
}

const useTaskDetailStore = create<TaskDetailStore>((set) => ({
  selectedTaskId: null,
  openTask: (id) => set({ selectedTaskId: id }),
  closeTask: () => set({ selectedTaskId: null }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}));

/**
 * Hook returning the global selected task id and helpers to open/close the
 * detail panel. Subscribes to the `?task=<id>` URL param so deep links
 * (e.g. "Copy task link") restore the panel.
 *
 * The first instance to mount per render syncs URL <-> state. Subsequent
 * call sites just read/write the underlying zustand store, so they don't
 * trigger duplicate effects.
 */
export function useTaskDetailPanel() {
  const selectedTaskId = useTaskDetailStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useTaskDetailStore((s) => s.setSelectedTaskId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync URL param -> state. Whenever the `?task=` value changes, mirror it
  // into the store.
  const taskParam = searchParams?.get("task") ?? null;
  useEffect(() => {
    if (taskParam && taskParam !== selectedTaskId) {
      setSelectedTaskId(taskParam);
    } else if (!taskParam && selectedTaskId) {
      // URL no longer contains task param -> reset state to match URL.
      // (Closing via the panel itself is handled in `closeTask` below by
      // explicitly removing the param.)
      setSelectedTaskId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskParam]);

  function openTask(id: string) {
    if (useTaskDetailStore.getState().selectedTaskId === id) return;
    setSelectedTaskId(id);
    // Reflect into the URL so deep links work. Use replace to avoid
    // polluting browser history with every task click.
    if (pathname) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (params.get("task") === id) return;
      params.set("task", id);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }

  function closeTask() {
    if (useTaskDetailStore.getState().selectedTaskId === null) return;
    setSelectedTaskId(null);
    if (pathname) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (!params.has("task")) return;
      params.delete("task");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }

  return { selectedTaskId, openTask, closeTask };
}

// Imperative helpers for non-React contexts (kept simple — no URL sync).
export function openTaskById(id: string) {
  useTaskDetailStore.getState().setSelectedTaskId(id);
}

export function closeTaskPanel() {
  useTaskDetailStore.getState().setSelectedTaskId(null);
}
