"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import type { SavedView } from "@/types";

const VIEW_TYPES: { value: SavedView["viewType"]; label: string }[] = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "timeline", label: "Timeline" },
  { value: "calendar", label: "Calendar" },
];

interface AddTabDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated?: (id: string) => void;
}

export function AddTabDialog({
  open,
  onClose,
  projectId,
  onCreated,
}: AddTabDialogProps) {
  const createSavedView = useAppStore((s) => s.createSavedView);

  const [name, setName] = React.useState("");
  const [viewType, setViewType] = React.useState<SavedView["viewType"]>("list");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setViewType("list");
    }
  }, [open]);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const v = await createSavedView({
        projectId,
        name: trimmed,
        viewType,
      });
      onCreated?.(v.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add tab" size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Tab name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My custom view"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">View type</label>
          <select
            value={viewType}
            onChange={(e) =>
              setViewType(e.target.value as SavedView["viewType"])
            }
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {VIEW_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
            <option value="list" disabled>
              ─────────
            </option>
            <option value="list" disabled>
              Dashboard (coming soon)
            </option>
          </select>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            loading={submitting}
          >
            Add tab
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AddTabDialog;
