"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
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
  }, 1800);
}

export function InviteModal({ open, onClose }: InviteModalProps) {
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSend = () => {
    const list = emails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    if (list.length === 0) {
      showToast("Enter at least one email");
      return;
    }
    setSending(true);
    try {
      const raw = localStorage.getItem("adana:pending-invites");
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const merged = Array.from(new Set([...existing, ...list]));
      localStorage.setItem("adana:pending-invites", JSON.stringify(merged));
    } catch {}
    showToast(`Invitations sent to ${list.length} teammate${list.length === 1 ? "" : "s"}`);
    setEmails("");
    setSending(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-adana-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Invite teammates
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Email addresses
          </label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
            rows={4}
            className="w-full resize-none rounded-md border border-gray-200 bg-white p-2.5 text-sm text-gray-800 outline-none focus:border-adana-400 focus:ring-2 focus:ring-adana-100 dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200 dark:focus:ring-adana-900/30"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Separate multiple emails with commas or new lines.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="rounded-md bg-adana-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-adana-700 disabled:opacity-50"
          >
            Send invitations
          </button>
        </div>
      </div>
    </div>
  );
}
