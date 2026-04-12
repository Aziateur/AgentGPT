"use client";
import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const editable = isEditableTarget(e.target);
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K -> open command palette
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("adana:command-palette"));
        return;
      }

      if (editable) return;

      // / -> focus global search
      if (e.key === "/") {
        const el = document.getElementById(
          "global-search"
        ) as HTMLInputElement | null;
        if (el) {
          e.preventDefault();
          el.focus();
        }
        return;
      }

      // c -> create task
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("adana:create-task"));
        return;
      }

      // ? -> toggle cheat sheet
      if (e.key === "?") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("adana:toggle-cheatsheet"));
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
