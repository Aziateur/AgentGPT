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

  // Keep form in sync when currentUser hydrates from persist store.
  useEffect(() => {
    setName(currentUser.name ?? "");
    setEmail(currentUser.email ?? "");
    setAvatar(currentUser.avatar ?? "");
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
    </div>
  );
}
