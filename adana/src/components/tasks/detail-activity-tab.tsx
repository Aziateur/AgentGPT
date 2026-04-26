"use client";

import { useMemo } from "react";

export interface ActivityEntry {
  id: string;
  text: string;
  actorName?: string;
  createdAt: string;
}

export interface DetailActivityTabProps {
  activity: ActivityEntry[];
  sortAsc: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DetailActivityTab({ activity, sortAsc }: DetailActivityTabProps) {
  const sorted = useMemo(() => {
    const arr = [...activity];
    arr.sort((a, b) => {
      const ad = new Date(a.createdAt).getTime();
      const bd = new Date(b.createdAt).getTime();
      return sortAsc ? ad - bd : bd - ad;
    });
    return arr;
  }, [activity, sortAsc]);

  if (sorted.length === 0) {
    return <p className="text-xs text-gray-400">No activity yet</p>;
  }

  return (
    <ul className="space-y-2">
      {sorted.map((a) => (
        <li key={a.id} className="flex gap-2 text-xs text-gray-600">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
          <div className="min-w-0 flex-1">
            <span className="text-gray-700">
              {a.actorName ? <span className="font-medium">{a.actorName} </span> : null}
              {a.text}
            </span>
            <span className="ml-2 text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
