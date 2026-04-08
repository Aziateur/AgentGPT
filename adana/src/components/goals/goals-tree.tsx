"use client";

import * as React from "react";
import {
  Target,
  ChevronRight,
  ChevronDown,
  Plus,
  Link2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { GoalStatus, GoalTimeframe } from "@/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<GoalStatus, { label: string; variant: "success" | "warning" | "high" | "default" | "info" | "purple" }> = {
  on_track: { label: "On Track", variant: "success" },
  at_risk: { label: "At Risk", variant: "warning" },
  off_track: { label: "Off Track", variant: "high" },
  achieved: { label: "Achieved", variant: "info" },
  missed: { label: "Missed", variant: "default" },
  dropped: { label: "Dropped", variant: "default" },
};

const TIMEFRAME_LABELS: Record<GoalTimeframe, string> = {
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
  q4: "Q4",
  h1: "H1",
  h2: "H2",
  annual: "Annual",
  custom: "Custom",
};

interface GoalNode {
  id: string;
  name: string;
  status: GoalStatus;
  progress: number;
  ownerName: string;
  timeframe: GoalTimeframe;
  year: number;
  linkedProjects: string[];
  children: GoalNode[];
}

const mockGoals: GoalNode[] = [
  {
    id: "g1",
    name: "Increase revenue by 40%",
    status: "on_track",
    progress: 65,
    ownerName: "Sarah Chen",
    timeframe: "annual",
    year: 2026,
    linkedProjects: ["Website Redesign", "Mobile App v2"],
    children: [
      {
        id: "g1-1",
        name: "Launch enterprise plan",
        status: "on_track",
        progress: 80,
        ownerName: "James Wilson",
        timeframe: "q1",
        year: 2026,
        linkedProjects: ["Enterprise Features"],
        children: [
          {
            id: "g1-1-1",
            name: "Build SSO integration",
            status: "achieved",
            progress: 100,
            ownerName: "Emily Park",
            timeframe: "q1",
            year: 2026,
            linkedProjects: [],
            children: [],
          },
          {
            id: "g1-1-2",
            name: "Add role-based access control",
            status: "on_track",
            progress: 60,
            ownerName: "Alex Rivera",
            timeframe: "q1",
            year: 2026,
            linkedProjects: [],
            children: [],
          },
        ],
      },
      {
        id: "g1-2",
        name: "Expand to 3 new markets",
        status: "at_risk",
        progress: 33,
        ownerName: "Sarah Chen",
        timeframe: "h1",
        year: 2026,
        linkedProjects: ["Market Research"],
        children: [
          {
            id: "g1-2-1",
            name: "Launch in Germany",
            status: "on_track",
            progress: 70,
            ownerName: "James Wilson",
            timeframe: "q1",
            year: 2026,
            linkedProjects: [],
            children: [],
          },
          {
            id: "g1-2-2",
            name: "Launch in Japan",
            status: "off_track",
            progress: 15,
            ownerName: "Emily Park",
            timeframe: "q2",
            year: 2026,
            linkedProjects: [],
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "g2",
    name: "Improve customer satisfaction to 95%",
    status: "on_track",
    progress: 78,
    ownerName: "Alex Rivera",
    timeframe: "annual",
    year: 2026,
    linkedProjects: ["Support Portal Revamp"],
    children: [
      {
        id: "g2-1",
        name: "Reduce average response time to < 2h",
        status: "achieved",
        progress: 100,
        ownerName: "Emily Park",
        timeframe: "q1",
        year: 2026,
        linkedProjects: [],
        children: [],
      },
      {
        id: "g2-2",
        name: "Launch self-service knowledge base",
        status: "on_track",
        progress: 55,
        ownerName: "Alex Rivera",
        timeframe: "q2",
        year: 2026,
        linkedProjects: ["Knowledge Base"],
        children: [],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// GoalTreeItem
// ---------------------------------------------------------------------------

function GoalTreeItem({
  goal,
  depth,
  onUpdate,
  onAddChild,
}: {
  goal: GoalNode;
  depth: number;
  onUpdate: (id: string, name: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(goal.name);
  const hasChildren = goal.children.length > 0;

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(goal.id, editValue.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(goal.name);
    setEditing(false);
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-gray-200 hover:bg-gray-50",
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand/collapse */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={cn(
            "shrink-0 rounded p-0.5 transition-colors",
            hasChildren
              ? "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              : "invisible"
          )}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Goal icon */}
        <Target
          className={cn(
            "h-4 w-4 shrink-0",
            goal.status === "achieved"
              ? "text-green-500"
              : goal.status === "off_track"
                ? "text-red-500"
                : "text-indigo-500"
          )}
        />

        {/* Name (inline edit) */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className="h-7 w-full rounded border border-indigo-300 px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSave}
                className="rounded p-1 text-green-600 hover:bg-green-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="truncate text-sm font-medium text-gray-900">
              {goal.name}
            </span>
          )}
        </div>

        {/* Status badge */}
        <Badge variant={STATUS_CONFIG[goal.status].variant} className="shrink-0">
          {STATUS_CONFIG[goal.status].label}
        </Badge>

        {/* Progress */}
        <div className="hidden w-28 shrink-0 items-center gap-2 sm:flex">
          <ProgressBar
            value={goal.progress}
            size="sm"
            color={
              goal.progress >= 80
                ? "green"
                : goal.progress >= 40
                  ? "blue"
                  : "orange"
            }
          />
          <span className="text-xs tabular-nums text-gray-500">
            {goal.progress}%
          </span>
        </div>

        {/* Owner */}
        <Avatar size="xs" name={goal.ownerName} />

        {/* Timeframe */}
        <span className="hidden shrink-0 text-xs text-gray-500 md:inline">
          {TIMEFRAME_LABELS[goal.timeframe]} {goal.year}
        </span>

        {/* Linked projects */}
        {goal.linkedProjects.length > 0 && (
          <span className="hidden items-center gap-1 text-xs text-gray-400 lg:flex">
            <Link2 className="h-3 w-3" />
            {goal.linkedProjects.length}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Edit goal"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onAddChild(goal.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Add sub-goal"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded &&
        goal.children.map((child) => (
          <GoalTreeItem
            key={child.id}
            goal={child}
            depth={depth + 1}
            onUpdate={onUpdate}
            onAddChild={onAddChild}
          />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GoalsTree() {
  const [goals, setGoals] = React.useState(mockGoals);

  const updateGoalName = React.useCallback(
    (id: string, newName: string) => {
      const updateRecursive = (nodes: GoalNode[]): GoalNode[] =>
        nodes.map((n) =>
          n.id === id
            ? { ...n, name: newName }
            : { ...n, children: updateRecursive(n.children) }
        );
      setGoals(updateRecursive(goals));
    },
    [goals]
  );

  const addSubGoal = React.useCallback(
    (parentId: string) => {
      const newGoal: GoalNode = {
        id: `g-${Date.now()}`,
        name: "New sub-goal",
        status: "on_track",
        progress: 0,
        ownerName: "You",
        timeframe: "q2",
        year: 2026,
        linkedProjects: [],
        children: [],
      };
      const addRecursive = (nodes: GoalNode[]): GoalNode[] =>
        nodes.map((n) =>
          n.id === parentId
            ? { ...n, children: [...n.children, newGoal] }
            : { ...n, children: addRecursive(n.children) }
        );
      setGoals(addRecursive(goals));
    },
    [goals]
  );

  const addTopLevel = () => {
    const newGoal: GoalNode = {
      id: `g-${Date.now()}`,
      name: "New goal",
      status: "on_track",
      progress: 0,
      ownerName: "You",
      timeframe: "annual",
      year: 2026,
      linkedProjects: [],
      children: [],
    };
    setGoals([...goals, newGoal]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
        </div>
        <Button variant="primary" size="sm" onClick={addTopLevel}>
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {goals.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
            <Target className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No goals yet.</p>
            <p className="text-xs text-gray-400">
              Create a goal to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {goals.map((goal) => (
              <GoalTreeItem
                key={goal.id}
                goal={goal}
                depth={0}
                onUpdate={updateGoalName}
                onAddChild={addSubGoal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
