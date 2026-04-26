"use client";

import {
  Folder,
  FolderOpen,
  Briefcase,
  Target,
  Rocket,
  Code,
  Users,
  Map,
  Calendar,
  Bug,
  Globe,
  Smartphone,
  Megaphone,
  Star,
  Box,
  FileText,
  CheckCircle,
  Heart,
  Layers,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  folder: Folder,
  "folder-open": FolderOpen,
  briefcase: Briefcase,
  target: Target,
  rocket: Rocket,
  code: Code,
  users: Users,
  map: Map,
  calendar: Calendar,
  bug: Bug,
  globe: Globe,
  smartphone: Smartphone,
  megaphone: Megaphone,
  star: Star,
  box: Box,
  file: FileText,
  check: CheckCircle,
  heart: Heart,
  layers: Layers,
};

export function resolveProjectIcon(name?: string | null): LucideIcon {
  if (!name) return Folder;
  return ICON_MAP[name.toLowerCase()] || Folder;
}

export function ProjectIconGlyph({
  icon,
  color,
  size = 16,
}: {
  icon?: string | null;
  color: string;
  size?: number;
}) {
  const Icon = resolveProjectIcon(icon);
  // Render a small rounded square with the project's color background and icon centered.
  const px = size;
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-[5px]"
      style={{ width: px, height: px, backgroundColor: color }}
    >
      <Icon className="text-white" style={{ width: px - 6, height: px - 6 }} strokeWidth={2.25} />
    </span>
  );
}
