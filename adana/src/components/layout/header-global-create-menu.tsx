"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  FolderOpen,
  MessageSquare,
  Briefcase,
  Target,
  UserPlus,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  onTaskClick: () => void;
  onProjectClick: () => void;
  onPortfolioClick: () => void;
  onGoalClick: () => void;
  onInviteClick: () => void;
}

export function GlobalCreateMenu({
  open,
  onClose,
  anchorRef,
  onTaskClick,
  onProjectClick,
  onPortfolioClick,
  onGoalClick,
  onInviteClick,
}: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  function handleMessageClick() {
    onClose();
    router.push("/inbox?compose=1");
    window.dispatchEvent(new CustomEvent("adana:compose-message"));
  }

  const items: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      label: "Task",
      icon: <CheckCircle className="h-4 w-4 text-red-500" />,
      onClick: () => {
        onClose();
        onTaskClick();
      },
    },
    {
      label: "Project",
      icon: <FolderOpen className="h-4 w-4 text-indigo-500" />,
      onClick: () => {
        onClose();
        onProjectClick();
      },
    },
    {
      label: "Message",
      icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
      onClick: handleMessageClick,
    },
    {
      label: "Portfolio",
      icon: <Briefcase className="h-4 w-4 text-purple-500" />,
      onClick: () => {
        onClose();
        onPortfolioClick();
      },
    },
    {
      label: "Goal",
      icon: <Target className="h-4 w-4 text-green-500" />,
      onClick: () => {
        onClose();
        onGoalClick();
      },
    },
    {
      label: "Invite",
      icon: <UserPlus className="h-4 w-4 text-orange-500" />,
      onClick: () => {
        onClose();
        onInviteClick();
      },
    },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="absolute left-0 top-11 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-surface-dark"
    >
      <div className="border-b border-gray-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-700">
        Create
      </div>
      {items.map((opt) => (
        <button
          key={opt.label}
          onClick={opt.onClick}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </motion.div>
  );
}
