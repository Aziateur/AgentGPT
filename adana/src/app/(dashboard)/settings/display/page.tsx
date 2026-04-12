"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DisplaySettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const initialHours = (() => {
    const v = (currentUser as { weeklyCapacityHours?: number }).weeklyCapacityHours;
    return typeof v === "number" ? v : 40;
  })();
  const [hours, setHours] = useState<number>(initialHours);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const v = (currentUser as { weeklyCapacityHours?: number }).weeklyCapacityHours;
    if (typeof v === "number") setHours(v);
  }, [currentUser.id]);

  async function handleSaveHours(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser.id) {
      setErr("Not signed in.");
      return;
    }
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const { error: dbErr } = await supabase
        .from("users")
        .update({ weekly_capacity_hours: hours })
        .eq("id", currentUser.id);
      if (dbErr) throw dbErr;
      setCurrentUser({
        ...currentUser,
        weeklyCapacityHours: hours,
      });
      setMsg("Weekly capacity saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not save capacity.");
    } finally {
      setSaving(false);
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
          Display
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          Theme and workload preferences.
        </p>
      </header>

      {/* Theme -------------------------------------------------------------- */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Theme
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Switch between light and dark mode.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (theme !== "light") toggleTheme();
            }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
              theme === "light"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-200"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
          <button
            type="button"
            onClick={() => {
              if (theme !== "dark") toggleTheme();
            }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
              theme === "dark"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-200"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
        </div>
      </section>

      {/* Capacity ----------------------------------------------------------- */}
      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Weekly capacity
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Hours you can dedicate to work each week. Used in workload charts.
        </p>
        <form onSubmit={handleSaveHours} className="mt-4 space-y-4">
          <Input
            label="Hours per week"
            name="hours"
            type="number"
            min={0}
            max={168}
            value={hours}
            onChange={(e) => setHours(Math.max(0, Math.min(168, Number(e.target.value) || 0)))}
          />
          {msg && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}
          {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving} disabled={!currentUser.id}>
              Save
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
