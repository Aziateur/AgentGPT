"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SidebarSection — Asana-style collapsible section header with an optional "+"
 * add button. The "+" rendering is fully owned by the consumer via a render
 * prop so we can mount popover menus relative to it.
 */
interface SidebarSectionProps {
  label: string;
  collapsed: boolean;
  defaultOpen?: boolean;
  /** Optional render-prop for the "+" button (gets a ref-target wrapper). */
  renderAddButton?: () => React.ReactNode;
  children?: React.ReactNode;
}

export function SidebarSection({
  label,
  collapsed,
  defaultOpen = true,
  renderAddButton,
  children,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <>
        <div className="my-1 h-px bg-sidebar-hover" />
        {children}
      </>
    );
  }

  return (
    <div className="relative">
      <div className="group/section flex items-center justify-between gap-1 px-2.5 pb-1 pt-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-left"
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 text-sidebar-text transition-transform",
              !open && "-rotate-90"
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-text">
            {label}
          </span>
        </button>
        {renderAddButton && (
          <span className="opacity-0 transition-opacity group-hover/section:opacity-100">
            {renderAddButton()}
          </span>
        )}
      </div>
      {open && children}
    </div>
  );
}

/**
 * Small "+" icon button used as the trigger for "add" popovers in sidebar
 * section headers. Consumers wire the click to a popover state setter.
 */
export function SidebarAddButton({
  onClick,
  ariaLabel,
}: {
  onClick: (e: React.MouseEvent) => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
      aria-label={ariaLabel}
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );
}
