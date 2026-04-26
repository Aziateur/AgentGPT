"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Repeat } from "lucide-react";
import { DetailRecurrencePopover, type RecurrenceValue } from "./detail-recurrence-popover";

export interface DetailDatePopoverProps {
  startDate: string | null;
  dueDate: string | null;
  dueTime: string | null;
  recurrence: RecurrenceValue | null;
  onClose: () => void;
  onChange: (patch: {
    startDate?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    recurrence?: RecurrenceValue | null;
  }) => void;
}

const DDMMYY = "dd/MM/yy";

function parseUserDate(input: string): Date | null {
  if (!input) return null;
  const tries = [DDMMYY, "dd/MM/yyyy", "yyyy-MM-dd"];
  for (const fmt of tries) {
    try {
      const d = parse(input, fmt, new Date());
      if (!isNaN(d.getTime())) return d;
    } catch {
      // continue
    }
  }
  return null;
}

function isoOrNull(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export function DetailDatePopover({
  startDate,
  dueDate,
  dueTime,
  recurrence,
  onClose,
  onChange,
}: DetailDatePopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const initialDue = dueDate ? new Date(dueDate) : null;
  const initialStart = startDate ? new Date(startDate) : null;

  const [view, setView] = useState<Date>(() => initialDue ?? initialStart ?? new Date());
  const [startInput, setStartInput] = useState<string>(
    initialStart ? format(initialStart, DDMMYY) : ""
  );
  const [dueInput, setDueInput] = useState<string>(
    initialDue ? format(initialDue, DDMMYY) : ""
  );
  const [showTime, setShowTime] = useState(false);
  const [timeValue, setTimeValue] = useState<string>(dueTime || "");
  const [showRecurrence, setShowRecurrence] = useState(false);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  const monthStart = useMemo(() => startOfMonth(view), [view]);
  const monthEnd = useMemo(() => endOfMonth(view), [view]);
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);

  const days = useMemo(() => {
    const out: Date[] = [];
    let cur = gridStart;
    while (cur <= gridEnd) {
      out.push(cur);
      cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
    }
    return out;
  }, [gridStart, gridEnd]);

  const selectedDue = parseUserDate(dueInput);
  const selectedStart = parseUserDate(startInput);

  function commit(next: {
    startDate?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
  }) {
    onChange(next);
  }

  function selectDay(d: Date) {
    setDueInput(format(d, DDMMYY));
    commit({ dueDate: isoOrNull(d) });
  }

  function applyStartFromInput() {
    const d = parseUserDate(startInput);
    commit({ startDate: d ? isoOrNull(d) : startInput.trim() === "" ? null : undefined });
  }

  function applyDueFromInput() {
    const d = parseUserDate(dueInput);
    commit({ dueDate: d ? isoOrNull(d) : dueInput.trim() === "" ? null : undefined });
  }

  function clearAll() {
    setStartInput("");
    setDueInput("");
    setTimeValue("");
    commit({ startDate: null, dueDate: null, dueTime: null });
  }

  function applyTime() {
    commit({ dueTime: timeValue || null });
    setShowTime(false);
  }

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-30 mt-1 w-[300px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
    >
      {/* Inputs */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          onBlur={applyStartFromInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyStartFromInput();
          }}
          placeholder="+ Start date"
          className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
        <input
          type="text"
          value={dueInput}
          onChange={(e) => setDueInput(e.target.value)}
          onBlur={applyDueFromInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyDueFromInput();
          }}
          placeholder="Due date (DD/MM/YY)"
          className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
      </div>

      {/* Month nav */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setView((v) => addMonths(v, -1))}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-gray-700">{format(view, "MMMM yyyy")}</span>
        <button
          onClick={() => setView((v) => addMonths(v, 1))}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, view);
          const isDue = selectedDue && isSameDay(d, selectedDue);
          const isStart = selectedStart && isSameDay(d, selectedStart);
          const isToday = isSameDay(d, new Date());
          return (
            <button
              key={d.toISOString()}
              onClick={() => selectDay(d)}
              className={`h-7 rounded text-xs transition ${
                isDue
                  ? "bg-indigo-600 text-white"
                  : isStart
                  ? "bg-indigo-100 text-indigo-700"
                  : isToday
                  ? "bg-gray-100 font-semibold text-gray-900"
                  : inMonth
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-300 hover:bg-gray-50"
              }`}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTime((v) => !v)}
            className={`rounded p-1.5 text-xs ${
              dueTime ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-100"
            }`}
            title="Set time"
          >
            <Clock className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowRecurrence((v) => !v)}
            className={`rounded p-1.5 text-xs ${
              recurrence ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-100"
            }`}
            title="Set recurrence"
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={clearAll}
          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        >
          Clear
        </button>
      </div>

      {showTime && (
        <div className="mt-2 flex items-center gap-2 rounded border border-gray-100 bg-gray-50 p-2">
          <input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none"
          />
          <button
            onClick={applyTime}
            className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setTimeValue("");
              commit({ dueTime: null });
              setShowTime(false);
            }}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      )}

      {showRecurrence && (
        <DetailRecurrencePopover
          value={recurrence}
          onChange={(rec) => onChange({ recurrence: rec })}
          onClose={() => setShowRecurrence(false)}
        />
      )}
    </div>
  );
}
