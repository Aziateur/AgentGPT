"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WORKSPACES_KEY = "adana:workspaces";
const ACTIVE_KEY = "adana:active-workspace";

export interface Workspace {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "default", name: "My workspace", color: "#4f46e5" },
];

function readWorkspaces(): Workspace[] {
  if (typeof window === "undefined") return DEFAULT_WORKSPACES;
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    if (!raw) {
      localStorage.setItem(WORKSPACES_KEY, JSON.stringify(DEFAULT_WORKSPACES));
      return DEFAULT_WORKSPACES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Workspace[];
  } catch {}
  return DEFAULT_WORKSPACES;
}

function readActive(): string {
  if (typeof window === "undefined") return "default";
  try {
    return localStorage.getItem(ACTIVE_KEY) || "default";
  } catch {
    return "default";
  }
}

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeId, setActiveId] = useState<string>("default");

  useEffect(() => {
    setWorkspaces(readWorkspaces());
    setActiveId(readActive());
  }, []);

  function handleSwitch(id: string) {
    try {
      localStorage.setItem(ACTIVE_KEY, id);
    } catch {}
    setActiveId(id);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  function handleCreate() {
    if (typeof window === "undefined") return;
    const name = window.prompt("Workspace name");
    if (!name || !name.trim()) return;
    const colors = ["#4f46e5", "#059669", "#d97706", "#db2777", "#0891b2"];
    const next: Workspace = {
      id: `ws_${Date.now().toString(36)}`,
      name: name.trim(),
      color: colors[workspaces.length % colors.length],
    };
    const updated = [...workspaces, next];
    try {
      localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
      localStorage.setItem(ACTIVE_KEY, next.id);
    } catch {}
    setWorkspaces(updated);
    window.location.reload();
  }

  return (
    <div className="border-b border-gray-100 py-1 dark:border-gray-700">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Workspaces
      </div>
      {workspaces.map((ws) => {
        const active = ws.id === activeId;
        return (
          <button
            key={ws.id}
            onClick={() => handleSwitch(ws.id)}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: ws.color }}
            >
              {ws.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate text-left">{ws.name}</span>
            {active && <Check className="h-3.5 w-3.5 text-adana-600" />}
          </button>
        );
      })}
      <button
        onClick={handleCreate}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Plus className="h-4 w-4" />
        New workspace
      </button>
    </div>
  );
}

export function getActiveWorkspace(): Workspace {
  const all = readWorkspaces();
  const id = readActive();
  return all.find((w) => w.id === id) || all[0] || DEFAULT_WORKSPACES[0];
}
