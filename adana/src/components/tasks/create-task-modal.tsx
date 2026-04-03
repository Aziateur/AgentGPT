"use client";

import * as React from "react";
import { Calendar, Flag, User as UserIcon, FolderOpen, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { User, Section, Tag, TaskPriority } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateTaskData {
  name: string;
  description: string;
  assigneeId: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  sectionId: string | null;
  tagIds: string[];
}

export interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: CreateTaskData) => void;
  users?: User[];
  sections?: Section[];
  tags?: Tag[];
  defaultSectionId?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialData: CreateTaskData = {
  name: "",
  description: "",
  assigneeId: null,
  dueDate: null,
  priority: "none",
  sectionId: null,
  tagIds: [],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateTaskModal({
  open,
  onClose,
  onCreate,
  users = [],
  sections = [],
  tags = [],
  defaultSectionId = null,
  className,
}: CreateTaskModalProps) {
  const [data, setData] = React.useState<CreateTaskData>({
    ...initialData,
    sectionId: defaultSectionId,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setData({ ...initialData, sectionId: defaultSectionId });
      setIsSubmitting(false);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open, defaultSectionId]);

  const update = <K extends keyof CreateTaskData>(
    key: K,
    value: CreateTaskData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tagId: string) => {
    setData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    setIsSubmitting(true);
    onCreate?.({ ...data, name: data.name.trim() });
    onClose();
  };

  const canSubmit = data.name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create task"
      size="lg"
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Task name */}
        <Input
          ref={nameRef}
          placeholder="Task name"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          className="text-base font-medium"
          autoComplete="off"
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Grid of selectors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Assignee */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
              Assignee
            </label>
            <Select
              value={data.assigneeId || "_unassigned"}
              onValueChange={(val) =>
                update("assigneeId", val === "_unassigned" ? null : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <span className="flex items-center gap-2">
                      <Avatar size="xs" name={user.name} src={user.avatarUrl || undefined} />
                      {user.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Due date
            </label>
            <input
              type="date"
              value={data.dueDate || ""}
              onChange={(e) => update("dueDate", e.target.value || null)}
              className="flex h-9 w-full items-center rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-gray-400" />
              Priority
            </label>
            <Select
              value={data.priority}
              onValueChange={(val) => update("priority", val as TaskPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-gray-400" />
              Section
            </label>
            <Select
              value={data.sectionId || "_none"}
              onValueChange={(val) =>
                update("sectionId", val === "_none" ? null : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No section</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-gray-400" />
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = data.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all border",
                      isSelected
                        ? "border-transparent shadow-sm"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: `${tag.color}40`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full mr-1.5"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
