"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Shield,
  User as UserIcon,
  UserPlus,
  Plane,
  Building2,
} from "lucide-react";
import { useAppStore as useDataStore } from "@/store/app-store";
import { isUserOOO } from "@/lib/utils";

const PREFS_KEY = "adana:user-prefs";
const USER_KEY = "adana:user";
const TRIAL_KEY = "adana:trial-start";

interface UserPrefs {
  oooEnabled?: boolean;
  oooFrom?: string | null;
  oooUntil?: string | null;
  oooMessage?: string;
}

interface WorkspaceItem {
  id: string;
  name: string;
  active: boolean;
  hasActivity?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  onInviteClick: () => void;
}

function readPrefs(): UserPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function writePrefs(p: UserPrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

function getTrialDaysLeft(): number {
  if (typeof window === "undefined") return 30;
  try {
    let start = localStorage.getItem(TRIAL_KEY);
    if (!start) {
      start = String(Date.now());
      localStorage.setItem(TRIAL_KEY, start);
    }
    const startMs = parseInt(start, 10);
    if (!Number.isFinite(startMs)) return 30;
    const days = Math.max(0, 30 - Math.floor((Date.now() - startMs) / 86400000));
    return days;
  } catch {
    return 30;
  }
}

const STUB_WORKSPACES: WorkspaceItem[] = [
  { id: "default", name: "My workspace", active: true, hasActivity: false },
];

export function ProfileMenu({ open, onClose, anchorRef, onInviteClick }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const currentUser = useDataStore((s) => (s as any).currentUser);
  const logout = useDataStore((s) => (s as any).logout);

  const [prefs, setPrefs] = useState<UserPrefs>({});
  const [oooDialogOpen, setOooDialogOpen] = useState(false);
  const [trialDays, setTrialDays] = useState(30);

  useEffect(() => {
    if (!open) return;
    setPrefs(readPrefs());
    setTrialDays(getTrialDaysLeft());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      // Don't close if interacting with OOO dialog
      const target = e.target as HTMLElement;
      if (target.closest("[data-ooo-dialog]")) return;
      onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  function handleLogout() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
    if (typeof logout === "function") logout();
    onClose();
    router.push("/login");
  }

  function handleSwitchWorkspace(_id: string) {
    showToast("Workspace switching is disabled in demo");
  }

  function handleNewWorkspace() {
    showToast("New workspace: Coming soon");
    onClose();
  }

  function handleAddAccount() {
    showToast("Add another account: Coming soon");
    onClose();
  }

  const oooActive = isUserOOO({ ...currentUser, ...prefs });
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
    : "?";

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        className="absolute right-0 top-10 z-50 w-[480px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-surface-dark"
      >
        <div className="grid grid-cols-[170px_1fr]">
          {/* Left column */}
          <div className="flex flex-col border-r border-gray-100 bg-gray-50/60 dark:border-gray-700 dark:bg-surface-dark-secondary">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Account
            </div>
            <ul className="flex-1">
              {STUB_WORKSPACES.map((w) => (
                <li key={w.id}>
                  <button
                    onClick={() => handleSwitchWorkspace(w.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-600 text-[10px] font-bold text-white">
                      {w.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{w.name}</span>
                    {w.hasActivity && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                    {w.active && <Check className="h-3.5 w-3.5 text-adana-600" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col">
            {/* Trial banner */}
            <div className="border-b border-gray-100 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-gray-700 dark:bg-amber-900/20 dark:text-amber-300">
              {trialDays} day{trialDays === 1 ? "" : "s"} left in trial.{" "}
              <button
                onClick={() => showToast("Learn more: Coming soon")}
                className="font-medium underline hover:no-underline"
              >
                Learn more
              </button>
            </div>

            {/* User identity */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 dark:border-gray-700">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-adana-600 text-sm font-semibold text-white">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitials
                )}
                {oooActive && (
                  <span
                    title="Out of office"
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500 dark:border-surface-dark"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {currentUser?.name || "Demo user"}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {currentUser?.email || "demo@adana.dev"}
                </p>
              </div>
            </div>

            <ul className="py-1">
              <ProfileItem
                icon={<Plane className="h-3.5 w-3.5" />}
                label={oooActive ? "Out of office (on)" : "Set out of office"}
                onClick={() => setOooDialogOpen(true)}
              />
              <ProfileItem
                icon={<Shield className="h-3.5 w-3.5" />}
                label="Admin console"
                onClick={() => {
                  router.push("/settings/admin");
                  onClose();
                }}
              />
              <ProfileItem
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="+ New workspace"
                onClick={handleNewWorkspace}
              />
              <ProfileItem
                icon={<UserPlus className="h-3.5 w-3.5" />}
                label="Invite to Adana"
                onClick={() => {
                  onInviteClick();
                  onClose();
                }}
              />
              <ProfileItem
                icon={<UserIcon className="h-3.5 w-3.5" />}
                label="Profile"
                onClick={() => {
                  router.push("/settings/profile");
                  onClose();
                }}
              />
              <ProfileItem
                icon={<SettingsIcon className="h-3.5 w-3.5" />}
                label="Settings"
                onClick={() => {
                  router.push("/settings");
                  onClose();
                }}
              />
              <ProfileItem
                icon={<Plus className="h-3.5 w-3.5" />}
                label="+ Add another account"
                onClick={handleAddAccount}
              />
            </ul>
          </div>
        </div>
      </motion.div>

      {oooDialogOpen && (
        <OOODialog
          prefs={prefs}
          onClose={() => setOooDialogOpen(false)}
          onSave={(next) => {
            writePrefs(next);
            setPrefs(next);
            setOooDialogOpen(false);
          }}
        />
      )}
    </>
  );
}

function ProfileItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <span className="text-gray-500">{icon}</span>
        {label}
      </button>
    </li>
  );
}

function OOODialog({
  prefs,
  onClose,
  onSave,
}: {
  prefs: UserPrefs;
  onClose: () => void;
  onSave: (p: UserPrefs) => void;
}) {
  const [enabled, setEnabled] = useState(!!prefs.oooEnabled);
  const [from, setFrom] = useState(prefs.oooFrom || "");
  const [until, setUntil] = useState(prefs.oooUntil || "");
  const [message, setMessage] = useState(prefs.oooMessage || "");

  return (
    <div
      data-ooo-dialog
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        data-ooo-dialog
        className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-3.5 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Set out of office
          </h3>
        </div>
        <div className="space-y-3 p-5">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
            />
            Enable out of office
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Until
              </label>
              <input
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I'm out of office until..."
              className="mt-1 w-full resize-none rounded-md border border-gray-200 p-2 text-sm dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-200"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                oooEnabled: enabled,
                oooFrom: from || null,
                oooUntil: until || null,
                oooMessage: message,
              })
            }
            className="rounded-md bg-adana-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-adana-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
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
