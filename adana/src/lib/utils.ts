import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isPast,
} from "date-fns";

/**
 * Merge class names with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date into a human-readable string.
 * Supports relative labels (Today, Yesterday, Tomorrow, weekday names)
 * and optional time display.
 */
export function formatDate(
  date: Date | string | null | undefined,
  opts?: { includeTime?: boolean }
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;

  if (isToday(d)) {
    return opts?.includeTime ? `Today at ${format(d, "h:mm a")}` : "Today";
  }
  if (isYesterday(d)) {
    return opts?.includeTime
      ? `Yesterday at ${format(d, "h:mm a")}`
      : "Yesterday";
  }
  if (isTomorrow(d)) {
    return opts?.includeTime
      ? `Tomorrow at ${format(d, "h:mm a")}`
      : "Tomorrow";
  }
  if (isThisWeek(d)) {
    return opts?.includeTime
      ? format(d, "EEEE 'at' h:mm a")
      : format(d, "EEEE");
  }

  const currentYear = new Date().getFullYear();
  const dateYear = d.getFullYear();
  const pattern =
    dateYear === currentYear
      ? opts?.includeTime
        ? "MMM d 'at' h:mm a"
        : "MMM d"
      : opts?.includeTime
        ? "MMM d, yyyy 'at' h:mm a"
        : "MMM d, yyyy";

  return format(d, pattern);
}

/**
 * Format a date as a relative time string.
 * Examples: "2 hours ago", "in 3 days", "just now"
 */
export function formatRelativeDate(
  date: Date | string | null | undefined
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;

  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Check whether a due date is overdue (in the past and not today).
 */
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return isPast(d) && !isToday(d);
}

/**
 * Generate a short unique identifier.
 * Uses crypto.randomUUID when available, falls back to timestamp-based ID.
 * Accepts an optional prefix (e.g., "task", "proj").
 */
export function generateId(prefix?: string): string {
  let id: string;
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    id = crypto.randomUUID();
  } else {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Get initials from a name for avatar display.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate a string to a max length, appending an ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1).trimEnd() + "\u2026";
}

/**
 * Returns true if the given user is currently out-of-office.
 * Honors `ooo_enabled` (falsy = never OOO), and a from/until window if set.
 */
export function isUserOOO(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  const enabled = (u.oooEnabled ?? u.ooo_enabled) as boolean | undefined;
  if (!enabled) return false;
  const now = Date.now();
  const fromRaw = (u.oooFrom ?? u.ooo_from) as string | null | undefined;
  const untilRaw = (u.oooUntil ?? u.ooo_until) as string | null | undefined;
  if (fromRaw) {
    const f = new Date(fromRaw).getTime();
    if (Number.isFinite(f) && now < f) return false;
  }
  if (untilRaw) {
    const t = new Date(untilRaw).getTime();
    if (Number.isFinite(t) && now > t) return false;
  }
  return true;
}
