"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  ArrowUpDown,
  Filter,
  FolderKanban,
  ChevronDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import type { ProjectStatusType, TaskPriority } from "@/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface PortfolioProject {
  id: string;
  name: string;
  status: ProjectStatusType;
  ownerName: string;
  ownerAvatar: string | null;
  progress: number;
  dueDate: string | null;
  priority: TaskPriority;
  taskCount: number;
  completedTaskCount: number;
}

const STATUS_CONFIG: Record<
  ProjectStatusType,
  { label: string; variant: "success" | "warning" | "high" | "default" | "info"; color: string }
> = {
  on_track: { label: "On Track", variant: "success", color: "#22c55e" },
  at_risk: { label: "At Risk", variant: "warning", color: "#eab308" },
  off_track: { label: "Off Track", variant: "high", color: "#ef4444" },
  on_hold: { label: "On Hold", variant: "default", color: "#9ca3af" },
  complete: { label: "Complete", variant: "info", color: "#3b82f6" },
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
};

const mockProjects: PortfolioProject[] = [
  {
    id: "p1",
    name: "Website Redesign",
    status: "on_track",
    ownerName: "Sarah Chen",
    ownerAvatar: null,
    progress: 72,
    dueDate: "2026-05-15",
    priority: "high",
    taskCount: 48,
    completedTaskCount: 35,
  },
  {
    id: "p2",
    name: "Mobile App v2",
    status: "at_risk",
    ownerName: "James Wilson",
    ownerAvatar: null,
    progress: 45,
    dueDate: "2026-04-30",
    priority: "high",
    taskCount: 62,
    completedTaskCount: 28,
  },
  {
    id: "p3",
    name: "API Migration",
    status: "on_track",
    ownerName: "Emily Park",
    ownerAvatar: null,
    progress: 88,
    dueDate: "2026-04-20",
    priority: "medium",
    taskCount: 30,
    completedTaskCount: 26,
  },
  {
    id: "p4",
    name: "Design System",
    status: "off_track",
    ownerName: "Alex Rivera",
    ownerAvatar: null,
    progress: 30,
    dueDate: "2026-04-10",
    priority: "medium",
    taskCount: 40,
    completedTaskCount: 12,
  },
  {
    id: "p5",
    name: "Analytics Dashboard",
    status: "complete",
    ownerName: "Sarah Chen",
    ownerAvatar: null,
    progress: 100,
    dueDate: "2026-03-28",
    priority: "low",
    taskCount: 22,
    completedTaskCount: 22,
  },
  {
    id: "p6",
    name: "Infrastructure Upgrade",
    status: "on_hold",
    ownerName: "James Wilson",
    ownerAvatar: null,
    progress: 15,
    dueDate: null,
    priority: "low",
    taskCount: 18,
    completedTaskCount: 3,
  },
];

type SortKey = "name" | "status" | "progress" | "dueDate" | "priority";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PortfolioView() {
  const [projects, setProjects] = React.useState(mockProjects);
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortAsc, setSortAsc] = React.useState(true);
  const [filterStatus, setFilterStatus] = React.useState<ProjectStatusType | "all">("all");
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);

  // Derived: status summary for pie chart
  const statusSummary = React.useMemo(() => {
    const counts: Record<ProjectStatusType, number> = {
      on_track: 0,
      at_risk: 0,
      off_track: 0,
      on_hold: 0,
      complete: 0,
    };
    projects.forEach((p) => counts[p.status]++);
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, count]) => ({
        name: STATUS_CONFIG[status as ProjectStatusType].label,
        value: count,
        color: STATUS_CONFIG[status as ProjectStatusType].color,
      }));
  }, [projects]);

  // Sort & filter
  const displayProjects = React.useMemo(() => {
    let filtered = projects;
    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
        case "dueDate":
          cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
          break;
        case "priority": {
          const order: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1, none: 0 };
          cmp = order[a.priority] - order[b.priority];
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [projects, sortKey, sortAsc, filterStatus]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleRemove = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = () => {
    if (!newProjectName.trim()) return;
    const proj: PortfolioProject = {
      id: `p-${Date.now()}`,
      name: newProjectName,
      status: "on_track",
      ownerName: "You",
      ownerAvatar: null,
      progress: 0,
      dueDate: null,
      priority: "none",
      taskCount: 0,
      completedTaskCount: 0,
    };
    setProjects((prev) => [...prev, proj]);
    setNewProjectName("");
    setShowAddModal(false);
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
    >
      {label}
      <ArrowUpDown
        className={cn(
          "h-3 w-3",
          sortKey === field ? "text-indigo-600" : "text-gray-300"
        )}
      />
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Portfolio</h2>
          <Badge variant="default">{projects.length} projects</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Status Summary */}
        <div className="mb-6 flex items-center gap-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={48}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {statusSummary.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4">
            {statusSummary.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm text-gray-700">
                  {s.name}: <span className="font-semibold">{s.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterStatus("all")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  filterStatus === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                )}
              >
                All
              </button>
              {(Object.keys(STATUS_CONFIG) as ProjectStatusType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    filterStatus === s
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Project" field="name" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Status" field="status" />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Owner
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Progress" field="progress" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Due Date" field="dueDate" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Priority" field="priority" />
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayProjects.map((project) => (
                <tr
                  key={project.id}
                  className="group transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {project.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_CONFIG[project.status].variant}>
                      {STATUS_CONFIG[project.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar size="xs" name={project.ownerName} />
                      <span className="text-sm text-gray-700">
                        {project.ownerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <ProgressBar
                          value={project.progress}
                          size="sm"
                          color={
                            project.progress >= 80
                              ? "green"
                              : project.progress >= 40
                                ? "blue"
                                : "orange"
                          }
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {project.dueDate ? formatDate(project.dueDate) : "--"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        project.priority === "high"
                          ? "high"
                          : project.priority === "medium"
                            ? "medium"
                            : "default"
                      }
                    >
                      {PRIORITY_LABELS[project.priority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(project.id)}
                      className="rounded-md p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      aria-label="Remove project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FolderKanban className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No projects match the current filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Project to Portfolio"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter project name"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Add Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
