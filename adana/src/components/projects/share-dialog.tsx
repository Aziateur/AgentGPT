"use client";

import * as React from "react";
import { Lock, Link as LinkIcon, Copy } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function ShareDialog({ open, onClose, projectId }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/project/list?id=${projectId}`
      : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* swallow */
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Share project" size="md">
      <fieldset disabled className="flex flex-col gap-4 opacity-60">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Invite people by email
          </label>
          <input
            type="email"
            placeholder="email@company.com"
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Default role for new members
          </label>
          <select className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm">
            <option>Editor</option>
            <option>Commenter</option>
            <option>Viewer</option>
          </select>
        </div>
      </fieldset>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Permission management requires explicit user action — not available
          in this demo.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Project link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center gap-2 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600">
            <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{link || "—"}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            icon={<Copy className="h-3.5 w-3.5" />}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

export default ShareDialog;
