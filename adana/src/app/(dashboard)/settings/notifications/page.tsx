"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "adana:notification-prefs";

type Prefs = {
  assigned: boolean;
  mentioned: boolean;
  dueSoon: boolean;
  statusUpdate: boolean;
  ruleNotify: boolean;
};

const DEFAULTS: Prefs = {
  assigned: true,
  mentioned: true,
  dueSoon: true,
  statusUpdate: false,
  ruleNotify: false,
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

const OPTIONS: { key: keyof Prefs; label: string; description: string }[] = [
  {
    key: "assigned",
    label: "Email me when a task is assigned to me",
    description: "Gets your attention when someone hands you work.",
  },
  {
    key: "mentioned",
    label: "Email me when I'm mentioned in a comment",
    description: "@-mentions trigger an email.",
  },
  {
    key: "dueSoon",
    label: "Email me when a due date is approaching",
    description: "Remind me the day before tasks are due.",
  },
  {
    key: "statusUpdate",
    label: "Email me when a project status update is posted",
    description: "Receive weekly status roll-ups.",
  },
  {
    key: "ruleNotify",
    label: "Email me when an automation rule notifies me",
    description: "Fires when a rule action targets you.",
  },
];

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  function update(key: keyof Prefs, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <header className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Notifications
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          Choose what Adana should email you about. These preferences are stored
          locally in your browser — Adana is a demo and does not send real email yet.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-surface-dark">
        {OPTIONS.map((opt) => (
          <label
            key={opt.key}
            className="flex cursor-pointer items-start gap-3 rounded-md px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={prefs[opt.key]}
              onChange={(e) => update(opt.key, e.target.checked)}
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {opt.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {opt.description}
              </div>
            </div>
          </label>
        ))}
      </section>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>
        )}
        <Button type="button" variant="primary" onClick={handleSave}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
