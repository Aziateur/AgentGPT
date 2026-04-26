"use client";

import { useState } from "react";

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly" | "periodically";

export interface RecurrenceValue {
  freq: RecurrenceFreq | string;
  interval?: number;
  daysOfWeek?: number[]; // 0..6 (Mon..Sun for our UI)
  dayOfMonth?: number; // 1..31
  weekOfMonth?: number; // 1..5
  dayOfWeek?: number; // 0..6 used with weekOfMonth
  monthlyMode?: "day_of_month" | "week_of_month";
}

export interface DetailRecurrencePopoverProps {
  value: RecurrenceValue | null;
  onChange: (value: RecurrenceValue | null) => void;
  onClose: () => void;
}

const FREQS: RecurrenceFreq[] = ["daily", "weekly", "monthly", "yearly", "periodically"];
const FREQ_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  periodically: "Periodically",
};
const DAY_LABEL = ["M", "T", "W", "T", "F", "S", "S"];

export function DetailRecurrencePopover({
  value,
  onChange,
  onClose,
}: DetailRecurrencePopoverProps) {
  const [freq, setFreq] = useState<string>(value?.freq || "weekly");
  const [interval, setInterval] = useState<number>(value?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value?.daysOfWeek ?? []);
  const [monthlyMode, setMonthlyMode] = useState<"day_of_month" | "week_of_month">(
    value?.monthlyMode ?? "day_of_month"
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(value?.dayOfMonth ?? 1);
  const [weekOfMonth, setWeekOfMonth] = useState<number>(value?.weekOfMonth ?? 1);
  const [dayOfWeek, setDayOfWeek] = useState<number>(value?.dayOfWeek ?? 0);

  function toggleDay(d: number) {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  function unitLabel() {
    switch (freq) {
      case "daily":
        return "days";
      case "weekly":
        return "weeks";
      case "monthly":
        return "months";
      case "yearly":
        return "years";
      default:
        return "intervals";
    }
  }

  function buildValue(): RecurrenceValue {
    const v: RecurrenceValue = { freq, interval: Math.max(1, interval) };
    if (freq === "weekly") v.daysOfWeek = daysOfWeek;
    if (freq === "monthly") {
      v.monthlyMode = monthlyMode;
      if (monthlyMode === "day_of_month") v.dayOfMonth = dayOfMonth;
      else {
        v.weekOfMonth = weekOfMonth;
        v.dayOfWeek = dayOfWeek;
      }
    }
    return v;
  }

  function apply() {
    onChange(buildValue());
    onClose();
  }

  function clear() {
    onChange(null);
    onClose();
  }

  return (
    <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-2">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600">Repeats</span>
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value)}
          className="rounded border border-gray-200 bg-white px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none"
        >
          {FREQS.map((f) => (
            <option key={f} value={f}>
              {FREQ_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      {freq === "weekly" && (
        <div className="mb-2 flex items-center gap-1">
          {DAY_LABEL.map((label, i) => {
            const active = daysOfWeek.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`h-6 w-6 rounded text-[10px] font-medium transition ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {freq === "monthly" && (
        <div className="mb-2 space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="radio"
              checked={monthlyMode === "day_of_month"}
              onChange={() => setMonthlyMode("day_of_month")}
            />
            Day of month
            {monthlyMode === "day_of_month" && (
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                className="ml-1 w-12 rounded border border-gray-200 px-1 py-0.5 text-xs"
              />
            )}
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="radio"
              checked={monthlyMode === "week_of_month"}
              onChange={() => setMonthlyMode("week_of_month")}
            />
            Week of month
            {monthlyMode === "week_of_month" && (
              <>
                <select
                  value={weekOfMonth}
                  onChange={(e) => setWeekOfMonth(Number(e.target.value))}
                  className="ml-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
                >
                  <option value={1}>1st</option>
                  <option value={2}>2nd</option>
                  <option value={3}>3rd</option>
                  <option value={4}>4th</option>
                  <option value={5}>5th</option>
                </select>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
                >
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </>
            )}
          </label>
        </div>
      )}

      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-xs text-gray-600">Every</span>
        <input
          type="number"
          min={1}
          value={interval}
          onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
          className="w-12 rounded border border-gray-200 px-1 py-0.5 text-xs"
        />
        <span className="text-xs text-gray-600">{unitLabel()}</span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={clear}
          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        >
          Clear
        </button>
        <button
          onClick={apply}
          className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
