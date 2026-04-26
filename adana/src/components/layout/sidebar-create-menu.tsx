"use client";

import { useEffect, useRef } from "react";
import {
  CheckCircle,
  FolderPlus,
  MessageSquare,
  Briefcase,
  Target,
  UserPlus,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CreateMenuAction =
  | "task"
  | "project"
  | "message"
  | "portfolio"
  | "goal"
  | "invite";

interface SidebarCreateMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (action: CreateMenuAction) => void;
  collapsed: boolean;
}

const ITEMS: Array<{
  key: CreateMenuAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "task", label: "Task", icon: CheckCircle },
  { key: "project", label: "Project", icon: FolderPlus },
  { key: "message", label: "Message", icon: MessageSquare },
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "goal", label: "Goal", icon: Target },
  { key: "invite", label: "Invite", icon: UserPlus },
];

export function SidebarCreateMenu({
  open,
  onClose,
  onSelect,
  collapsed,
}: SidebarCreateMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Defer attaching the click handler so the trigger button click doesn't
    // immediately close the menu.
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    document.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-40 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-surface-dark",
        collapsed ? "left-12 top-0" : "left-2 right-2"
      )}
      role="menu"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            role="menuitem"
            onClick={() => {
              onSelect(item.key);
              onClose();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface SidebarCreateButtonProps {
  collapsed: boolean;
  onClick: () => void;
}

export function SidebarCreateButton({
  collapsed,
  onClick,
}: SidebarCreateButtonProps) {
  if (collapsed) {
    return (
      <button
        onClick={onClick}
        aria-label="Create"
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-colors hover:bg-orange-600"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
    >
      <Plus className="h-4 w-4" />
      <span>Create</span>
    </button>
  );
}

interface ComingSoonModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
}

export function ComingSoonModal({ open, title, onClose }: ComingSoonModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-700 dark:text-gray-300">Coming soon.</p>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md bg-adana-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-adana-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface InsightsAddMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (action: "report" | "portfolio" | "goal") => void;
}

export function InsightsAddMenu({ open, onClose, onSelect }: InsightsAddMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute right-2 z-40 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-surface-dark"
      role="menu"
    >
      <button
        onClick={() => {
          onSelect("report");
          onClose();
        }}
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        New report
      </button>
      <button
        onClick={() => {
          onSelect("portfolio");
          onClose();
        }}
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        New portfolio
      </button>
      <button
        onClick={() => {
          onSelect("goal");
          onClose();
        }}
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        New goal
      </button>
    </div>
  );
}

interface ProjectAddMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (action: "project" | "portfolio") => void;
}

export function ProjectAddMenu({ open, onClose, onSelect }: ProjectAddMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute right-2 z-40 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-surface-dark"
      role="menu"
    >
      <button
        onClick={() => {
          onSelect("project");
          onClose();
        }}
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        New project
      </button>
      <button
        onClick={() => {
          onSelect("portfolio");
          onClose();
        }}
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        New portfolio
      </button>
    </div>
  );
}
