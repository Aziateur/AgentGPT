"use client";

import * as React from "react";
import { Check, ChevronDown, CircleDashed } from "lucide-react";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

export type StatusKey =
  | "on_track"
  | "at_risk"
  | "off_track"
  | "on_hold"
  | "complete"
  | "dropped";

export interface StatusOption {
  key: StatusKey;
  label: string;
  dotClass: string;
  pillClass: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    key: "on_track",
    label: "On track",
    dotClass: "bg-green-500",
    pillClass: "bg-green-100 text-green-700 border-green-200",
  },
  {
    key: "at_risk",
    label: "At risk",
    dotClass: "bg-yellow-500",
    pillClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    key: "off_track",
    label: "Off track",
    dotClass: "bg-red-500",
    pillClass: "bg-red-100 text-red-700 border-red-200",
  },
  {
    key: "on_hold",
    label: "On hold",
    dotClass: "bg-blue-500",
    pillClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    key: "complete",
    label: "Complete",
    dotClass: "bg-green-600",
    pillClass: "bg-green-200 text-green-800 border-green-300",
  },
  {
    key: "dropped",
    label: "Dropped",
    dotClass: "bg-gray-400",
    pillClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
];

export function getStatusOption(key: string | null | undefined): StatusOption | null {
  if (!key) return null;
  return STATUS_OPTIONS.find((s) => s.key === key) ?? null;
}

interface StatusPillProps {
  status?: string | null;
  onSelect: (status: StatusKey) => void;
}

export function StatusPill({ status, onSelect }: StatusPillProps) {
  const opt = getStatusOption(status);

  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-90",
            opt
              ? opt.pillClass
              : "border-dashed border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
          )}
        >
          {opt ? (
            <span className={cn("h-2 w-2 rounded-full", opt.dotClass)} />
          ) : (
            <CircleDashed className="h-3 w-3" />
          )}
          <span>{opt ? opt.label : "Set status"}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="min-w-[200px]">
        {STATUS_OPTIONS.map((s) => (
          <DropdownItem
            key={s.key}
            onSelect={() => onSelect(s.key)}
            className={cn(
              s.key === "complete" && "bg-green-50 focus:bg-green-100"
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", s.dotClass)} />
            <span className="flex-1">{s.label}</span>
            {opt?.key === s.key && (
              <Check className="h-3.5 w-3.5 text-gray-400" />
            )}
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

export default StatusPill;
