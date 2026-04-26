"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Keyboard,
  Mail,
  HelpCircle,
  Apple,
  Plug,
  PlayCircle,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  onOpenShortcuts: () => void;
}

interface ResourceTile {
  title: string;
}

const RESOURCE_TILES: ResourceTile[] = [
  { title: "Get started with Adana" },
  { title: "Build your first project" },
  { title: "Invite teammates" },
  { title: "Manage workflows" },
  { title: "Reporting basics" },
  { title: "Shortcuts cheat sheet" },
];

export function HelpMenu({ open, onClose, anchorRef, onOpenShortcuts }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  function noopWithToast(label: string) {
    showToast(`${label}: Coming soon`);
    onClose();
  }

  const helpLinks: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
    {
      label: "Contact sales",
      icon: <PhoneCall className="h-3.5 w-3.5" />,
      onClick: () => noopWithToast("Contact sales"),
    },
    {
      label: "Help with features",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      onClick: () => noopWithToast("Help with features"),
    },
    {
      label: "Contact support",
      icon: <Mail className="h-3.5 w-3.5" />,
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "mailto:support@adana.dev";
        }
        onClose();
      },
    },
    {
      label: "Privacy Statement",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      onClick: () => {
        router.push("/privacy");
        onClose();
      },
    },
    {
      label: "Apps and integrations",
      icon: <Plug className="h-3.5 w-3.5" />,
      onClick: () => noopWithToast("Apps and integrations"),
    },
    {
      label: "Keyboard shortcuts",
      icon: <Keyboard className="h-3.5 w-3.5" />,
      onClick: () => {
        onOpenShortcuts();
        onClose();
      },
    },
    {
      label: "Download the desktop app",
      icon: <Apple className="h-3.5 w-3.5" />,
      onClick: () => noopWithToast("Download the desktop app"),
    },
  ];

  const filtered = (label: string) =>
    !query.trim() || label.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-10 z-50 w-[480px] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-surface-dark"
    >
      <div className="border-b border-gray-100 p-3 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help"
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-adana-400 dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3">
        {/* Help column */}
        <div>
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Help
          </div>
          <ul>
            {helpLinks
              .filter((h) => filtered(h.label))
              .map((h) => (
                <li key={h.label}>
                  <button
                    onClick={h.onClick}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="text-gray-500">{h.icon}</span>
                    {h.label}
                  </button>
                </li>
              ))}
          </ul>
        </div>

        {/* Resources column */}
        <div>
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Resources
          </div>
          <button
            onClick={() => noopWithToast("Video tutorials")}
            className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PlayCircle className="h-3.5 w-3.5 text-gray-500" />
            Video tutorials
          </button>
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Popular topics
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-1">
            {RESOURCE_TILES.filter((t) => filtered(t.title)).map((t) => (
              <button
                key={t.title}
                onClick={() => noopWithToast(t.title)}
                className="rounded-md border border-gray-200 px-2 py-2 text-left text-xs text-gray-700 hover:border-adana-300 hover:bg-adana-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-adana-900/20"
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function showToast(message: string) {
  if (typeof document === "undefined") return;
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className =
    "fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-gray-700";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.3s";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 1600);
}
