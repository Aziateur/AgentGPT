"use client";

import * as React from "react";
import {
  Folder,
  Briefcase,
  Star,
  Rocket,
  Flag,
  Target,
  Zap,
  Heart,
  Bookmark,
  Box,
  Layers,
  Compass,
  CheckCircle2,
  Calendar,
  Cpu,
  Settings,
  Hammer,
  Globe,
  Lightbulb,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const COLOR_SWATCHES = [
  "#4f46e5",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
  "#0ea5e9",
  "#a855f7",
  "#84cc16",
  "#d946ef",
];

export const ICONS: { name: string; Icon: React.ElementType }[] = [
  { name: "folder", Icon: Folder },
  { name: "briefcase", Icon: Briefcase },
  { name: "star", Icon: Star },
  { name: "rocket", Icon: Rocket },
  { name: "flag", Icon: Flag },
  { name: "target", Icon: Target },
  { name: "zap", Icon: Zap },
  { name: "heart", Icon: Heart },
  { name: "bookmark", Icon: Bookmark },
  { name: "box", Icon: Box },
  { name: "layers", Icon: Layers },
  { name: "compass", Icon: Compass },
  { name: "check", Icon: CheckCircle2 },
  { name: "calendar", Icon: Calendar },
  { name: "cpu", Icon: Cpu },
  { name: "settings", Icon: Settings },
  { name: "hammer", Icon: Hammer },
  { name: "globe", Icon: Globe },
  { name: "lightbulb", Icon: Lightbulb },
  { name: "smile", Icon: Smile },
];

export function getIconByName(name: string | null | undefined): React.ElementType {
  return ICONS.find((i) => i.name === name)?.Icon ?? Folder;
}

interface ColorIconPickerProps {
  color: string;
  icon: string;
  onChange: (next: { color: string; icon: string }) => void;
}

export function ColorIconPicker({ color, icon, onChange }: ColorIconPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Color
        </label>
        <div className="grid grid-cols-8 gap-2">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ color: c, icon })}
              className={cn(
                "h-8 w-8 rounded-md border-2 transition",
                color === c
                  ? "border-gray-900"
                  : "border-transparent hover:border-gray-300"
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Icon
        </label>
        <div className="grid grid-cols-8 gap-2">
          {ICONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange({ color, icon: name })}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border transition",
                icon === name
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
              aria-label={name}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ColorIconPicker;
