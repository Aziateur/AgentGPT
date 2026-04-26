"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Trash2,
  ArrowRightLeft,
  Plus,
  Tag as TagIcon,
  Paperclip,
  CornerUpRight,
  GitMerge,
  Repeat,
  Printer,
  Lock,
  ChevronRight,
  Check,
  FolderPlus,
  ListTree,
} from "lucide-react";

export interface DetailMoreMenuProps {
  open: boolean;
  onClose: () => void;
  taskType: string;
  isPrivate: boolean;
  onAddToAnotherProject: () => void;
  onAddSubtask: () => void;
  onAddTags: () => void;
  onUploadAttachment: () => void;
  onCreateFollowUp: () => void;
  onMergeDuplicates: () => void;
  onConvertTo: (type: "task" | "milestone" | "approval") => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onTogglePrivate: () => void;
  onDelete: () => void;
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  trailing?: React.ReactNode;
  onMouseEnter?: () => void;
}

function Row({ icon, label, shortcut, onClick, disabled, danger, trailing, onMouseEnter }: RowProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : disabled
          ? "cursor-not-allowed text-gray-300"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-gray-400">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="ml-auto pl-2 text-[10px] text-gray-400">{shortcut}</span>
      )}
      {trailing}
    </button>
  );
}

export function DetailMoreMenu({
  open,
  onClose,
  taskType,
  isPrivate,
  onAddToAnotherProject,
  onAddSubtask,
  onAddTags,
  onUploadAttachment,
  onCreateFollowUp,
  onMergeDuplicates,
  onConvertTo,
  onDuplicate,
  onPrint,
  onTogglePrivate,
  onDelete,
}: DetailMoreMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [submenu, setSubmenu] = useState<"attach" | "convert" | null>(null);

  useEffect(() => {
    if (!open) {
      setSubmenu(null);
      return;
    }
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-30 mt-1 w-72 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <Row
        icon={<FolderPlus className="h-3.5 w-3.5" />}
        label="Add to another project"
        shortcut="Tab P"
        onClick={() => {
          onAddToAnotherProject();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />
      <Row
        icon={<ListTree className="h-3.5 w-3.5" />}
        label="Add subtask"
        shortcut="Tab S"
        onClick={() => {
          onAddSubtask();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />
      <Row
        icon={<TagIcon className="h-3.5 w-3.5" />}
        label="Add tags"
        shortcut="Tab T"
        onClick={() => {
          onAddTags();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />

      {/* Attach files submenu */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenu("attach")}
      >
        <Row
          icon={<Paperclip className="h-3.5 w-3.5" />}
          label="Attach files"
          trailing={<ChevronRight className="h-3 w-3 text-gray-400" />}
        />
        {submenu === "attach" && (
          <div className="absolute left-full top-0 ml-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <Row
              icon={<Plus className="h-3.5 w-3.5" />}
              label="Upload"
              onClick={() => {
                onUploadAttachment();
                onClose();
              }}
            />
            <Row icon={<span />} label="Google Drive" disabled />
            <Row icon={<span />} label="OneDrive/SharePoint" disabled />
            <Row icon={<span />} label="Box" disabled />
            <Row icon={<span />} label="Dropbox" disabled />
          </div>
        )}
      </div>

      <Row
        icon={<CornerUpRight className="h-3.5 w-3.5" />}
        label="Create follow-up task"
        shortcut="Shift+Tab F"
        onClick={() => {
          onCreateFollowUp();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />
      <Row
        icon={<GitMerge className="h-3.5 w-3.5" />}
        label="Merge duplicate tasks"
        shortcut="Shift+Tab D"
        onClick={() => {
          onMergeDuplicates();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />

      {/* Convert to submenu */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenu("convert")}
      >
        <Row
          icon={<Repeat className="h-3.5 w-3.5" />}
          label="Convert to"
          trailing={<ChevronRight className="h-3 w-3 text-gray-400" />}
        />
        {submenu === "convert" && (
          <div className="absolute left-full top-0 ml-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <Row
              icon={taskType === "task" ? <Check className="h-3.5 w-3.5 text-indigo-600" /> : <span />}
              label="Task"
              onClick={() => {
                onConvertTo("task");
                onClose();
              }}
            />
            <Row
              icon={taskType === "milestone" ? <Check className="h-3.5 w-3.5 text-indigo-600" /> : <span />}
              label="Milestone"
              onClick={() => {
                onConvertTo("milestone");
                onClose();
              }}
            />
            <Row
              icon={taskType === "approval" ? <Check className="h-3.5 w-3.5 text-indigo-600" /> : <span />}
              label="Approval"
              onClick={() => {
                onConvertTo("approval");
                onClose();
              }}
            />
          </div>
        )}
      </div>

      <Row
        icon={<Copy className="h-3.5 w-3.5" />}
        label="Duplicate task"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />
      <Row
        icon={<Printer className="h-3.5 w-3.5" />}
        label="Print"
        onClick={() => {
          onPrint();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />
      <Row
        icon={<Lock className="h-3.5 w-3.5" />}
        label="Make private to project members"
        onClick={() => {
          onTogglePrivate();
          onClose();
        }}
        trailing={
          isPrivate ? (
            <Check className="h-3.5 w-3.5 text-indigo-600" />
          ) : (
            <ArrowRightLeft className="h-3 w-3 text-transparent" />
          )
        }
        onMouseEnter={() => setSubmenu(null)}
      />

      <div className="my-1 border-t border-gray-100" />

      <Row
        icon={<Trash2 className="h-3.5 w-3.5" />}
        label="Delete task"
        shortcut="Tab Del"
        danger
        onClick={() => {
          onDelete();
          onClose();
        }}
        onMouseEnter={() => setSubmenu(null)}
      />
    </div>
  );
}
