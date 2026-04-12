"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileSettingsPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [name, setName] = useState(currentUser.name ?? "");
  const [email, setEmail] = useState(currentUser.email ?? "");
  const [avatar, setAvatar] = useState(currentUser.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Out-of-office
  const [oooEnabled, setOooEnabled] = useState<boolean>(!!currentUser.oooEnabled);
  const [oooFrom, setOooFrom] = useState<string>(
    currentUser.oooFrom ? String(currentUser.oooFrom).slice(0, 10) : ""
  );
  const [oooUntil, setOooUntil] = useState<string>(
    currentUser.oooUntil ? String(currentUser.oooUntil).slice(0, 10) : ""
  );
  const [oooMessage, setOooMessage] = useState<string>(
    (currentUser.oooMessage as string) ?? ""
  );
  const [savingOoo, setSavingOoo] = useState(false);

  // Keep form in sync when currentUser hydrates from persist store.
  useEffect(() => {
    setName(currentUser.name ?? "");
    setEmail(currentUser.email ?? "");
    setAvatar(currentUser.avatar ?? "");
    setOooEnabled(!!currentUser.oooEnabled);
    setOooFrom(currentUser.oooFrom ? String(currentUser.oooFrom).slice(0, 10) : "");
    setOooUntil(currentUser.oooUntil ? String(currentUser.oooUntil).slice(0, 10) : "");
    setOooMessage((currentUser.oooMessage as string) ?? "");
  }, [currentUser.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser.id) {
      setError("You must be signed in to edit your profile.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: dbErr } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          email: email.trim(),
          avatar: avatar.trim() || null,
        })
        .eq("id", currentUser.id);

      if (dbErr) throw dbErr;

      setCurrentUser({
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim() || null,
      });
      setMessage("Profile saved.");
    } catch (err: any) {
      setError(err?.message ?? "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOoo() {
    if (!currentUser.id) return;
    setSavingOoo(true);
    setError(null);
    setMessage(null);
    const payload = {
      ooo_enabled: oooEnabled,
      ooo_from: oooFrom ? new Date(oooFrom).toISOString() : null,
      ooo_until: oooUntil ? new Date(oooUntil).toISOString() : null,
      ooo_message: oooMessage.trim() || null,
    };
    try {
      const { error: dbErr } = await supabase
        .from("users")
        .update(payload)
        .eq("id", currentUser.id);
      if (dbErr) throw dbErr;
      setCurrentUser({
        ...currentUser,
        oooEnabled: payload.ooo_enabled,
        oooFrom: payload.ooo_from,
        oooUntil: payload.ooo_until,
        oooMessage: payload.ooo_message,
      });
      setMessage("Out-of-office saved.");
    } catch (err: any) {
      setError(err?.message ?? "Could not save out-of-office.");
    } finally {
      setSavingOoo(false);
    }
  }

  const avatarFallback = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          How you appear to teammates across Adana.
        </p>
      </header>

      {!currentUser.id && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You are not signed in. Log in to edit your profile.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-lg font-semibold text-white">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              avatarFallback
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Avatars are loaded from a URL. Paste a link to any image.
          </div>
        </div>

        <Input
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Avatar URL"
          name="avatar"
          type="url"
          placeholder="https://..."
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />

        {message && (
          <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={!currentUser.id}
          >
            Save changes
          </Button>
        </div>
      </form>

      {/* Out of office ------------------------------------------------ */}
      <section className="mt-10 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Out of office
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Show teammates that you&apos;re away. An orange dot appears on your avatar.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={oooEnabled}
              onChange={(e) => setOooEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full dark:bg-gray-600"></div>
          </label>
        </div>

        {oooEnabled && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                type="date"
                value={oooFrom}
                onChange={(e) => setOooFrom(e.target.value)}
              />
              <Input
                label="Until"
                type="date"
                value={oooUntil}
                onChange={(e) => setOooUntil(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Message (optional)
              </label>
              <textarea
                value={oooMessage}
                onChange={(e) => setOooMessage(e.target.value)}
                rows={3}
                placeholder="I'm out of office and will reply when I return."
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm outline-none focus:border-indigo-400 dark:border-gray-600 dark:bg-surface-dark-secondary dark:text-gray-100"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="primary"
            loading={savingOoo}
            onClick={handleSaveOoo}
            disabled={!currentUser.id}
          >
            Save out-of-office
          </Button>
        </div>
      </section>
    </div>
  );
}
