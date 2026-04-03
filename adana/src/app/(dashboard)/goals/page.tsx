"use client";

import { useState, useEffect } from "react";
import type { GoalStatus, GoalTimeframe } from "@/types";

// -- Mock data ----------------------------------------------------------------

interface MockGoal {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  status: GoalStatus;
  timeframe: GoalTimeframe;
  year: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  parentGoalId: string | null;
  subGoals: MockGoal[];
}

const mockGoals: MockGoal[] = [
  {
    id: "g1",
    name: "Increase Revenue by 30%",
    description: "Grow annual recurring revenue through product expansion",
    owner: "Demo User",
    status: "on_track",
    timeframe: "annual",
    year: 2026,
    currentValue: 2400000,
    targetValue: 3200000,
    unit: "USD",
    parentGoalId: null,
    subGoals: [
      {
        id: "g1a",
        name: "Launch Enterprise Tier",
        description: null,
        owner: "Sarah Chen",
        status: "on_track",
        timeframe: "q2",
        year: 2026,
        currentValue: 60,
        targetValue: 100,
        unit: "%",
        parentGoalId: "g1",
        subGoals: [],
      },
      {
        id: "g1b",
        name: "Expand to 3 New Markets",
        description: null,
        owner: "Jordan Lee",
        status: "at_risk",
        timeframe: "h2",
        year: 2026,
        currentValue: 1,
        targetValue: 3,
        unit: "markets",
        parentGoalId: "g1",
        subGoals: [],
      },
    ],
  },
  {
    id: "g2",
    name: "Improve Customer Satisfaction to 4.5+",
    description: "Raise NPS and CSAT scores across all product lines",
    owner: "Alex Kim",
    status: "on_track",
    timeframe: "annual",
    year: 2026,
    currentValue: 4.2,
    targetValue: 4.5,
    unit: "rating",
    parentGoalId: null,
    subGoals: [
      {
        id: "g2a",
        name: "Reduce Support Ticket Response Time",
        description: null,
        owner: "Taylor Swift",
        status: "achieved",
        timeframe: "q1",
        year: 2026,
        currentValue: 2,
        targetValue: 4,
        unit: "hours",
        parentGoalId: "g2",
        subGoals: [],
      },
    ],
  },
  {
    id: "g3",
    name: "Ship Mobile App v2",
    description: "Complete redesign and launch of mobile application",
    owner: "Demo User",
    status: "at_risk",
    timeframe: "q2",
    year: 2026,
    currentValue: 45,
    targetValue: 100,
    unit: "%",
    parentGoalId: null,
    subGoals: [],
  },
  {
    id: "g4",
    name: "Hire 10 Engineers",
    description: "Scale the engineering team for product growth",
    owner: "Jordan Lee",
    status: "off_track",
    timeframe: "h1",
    year: 2026,
    currentValue: 3,
    targetValue: 10,
    unit: "hires",
    parentGoalId: null,
    subGoals: [],
  },
];

// -- Helpers ------------------------------------------------------------------

const statusColor: Record<string, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-yellow-100 text-yellow-700",
  off_track: "bg-red-100 text-red-700",
  achieved: "bg-blue-100 text-blue-700",
  partial: "bg-purple-100 text-purple-700",
  missed: "bg-gray-100 text-gray-700",
  dropped: "bg-gray-100 text-gray-400",
};

const statusLabel: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  achieved: "Achieved",
  partial: "Partial",
  missed: "Missed",
  dropped: "Dropped",
};

const statusProgressColor: Record<string, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  off_track: "bg-red-500",
  achieved: "bg-blue-500",
  partial: "bg-purple-500",
  missed: "bg-gray-400",
  dropped: "bg-gray-300",
};

const timeframeLabel: Record<string, string> = {
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
  q4: "Q4",
  h1: "H1",
  h2: "H2",
  annual: "Annual",
  custom: "Custom",
};

type StatusFilterKey = "all" | GoalStatus;
type TimeframeFilterKey = "all" | GoalTimeframe;

// -- Component ----------------------------------------------------------------

function GoalCard({ goal, depth = 0 }: { goal: MockGoal; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const progress = Math.min(
    Math.round((goal.currentValue / goal.targetValue) * 100),
    100
  );

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {/* Expand toggle */}
          {goal.subGoals.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className={`h-4 w-4 transition ${expanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {goal.subGoals.length === 0 && <div className="w-5" />}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {goal.name}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[goal.status]}`}>
                {statusLabel[goal.status]}
              </span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                {timeframeLabel[goal.timeframe]} {goal.year}
              </span>
            </div>
            {goal.description && (
              <p className="mt-1 text-xs text-gray-500">{goal.description}</p>
            )}

            {/* Progress */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${statusProgressColor[goal.status]}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {goal.currentValue} / {goal.targetValue} {goal.unit}
              </span>
              <span className="text-xs text-gray-400">({progress}%)</span>
            </div>

            {/* Owner */}
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600">
                {goal.owner[0]}
              </div>
              <span className="text-xs text-gray-500">{goal.owner}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-goals */}
      {expanded && goal.subGoals.length > 0 && (
        <div className="mt-2 space-y-2">
          {goal.subGoals.map((sub) => (
            <GoalCard key={sub.id} goal={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilterKey>("all");

  const filtered = mockGoals.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (timeframeFilter !== "all" && g.timeframe !== timeframeFilter) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          {(["all", "on_track", "at_risk", "off_track", "achieved"] as StatusFilterKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : statusLabel[s as GoalStatus]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Period:</span>
          {(["all", "q1", "q2", "h1", "h2", "annual"] as TimeframeFilterKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframeFilter(t)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                timeframeFilter === t
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "all" ? "All" : timeframeLabel[t as GoalTimeframe]}
            </button>
          ))}
        </div>
      </div>

      {/* Goals tree */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-900">No goals found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different filter or create a new goal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
