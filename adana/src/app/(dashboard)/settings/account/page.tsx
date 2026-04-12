"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/auth-hash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccountSettingsPage() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);

  // --- password form state ---
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  // --- delete-account state ---
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    setPwdErr(null);

    if (!currentUser.id) {
      setPwdErr("You must be signed in.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdErr("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdErr("New passwords don't match.");
      return;
    }

    setPwdSaving(true);
    try {
      // Fetch the stored hash to verify the current password.
      const { data, error: fetchErr } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", currentUser.id)
        .single();
      if (fetchErr) throw fetchErr;

      const storedHash = (data as { password_hash?: string | null })?.password_hash;
      if (storedHash) {
        const ok = await verifyPassword(currentPwd, storedHash);
        if (!ok) {
          setPwdErr("Current password is incorrect.");
          setPwdSaving(false);
          return;
        }
      }

      const newHash = await hashPassword(newPwd);
      const { error: updErr } = await supabase
        .from("users")
        .update({ password_hash: newHash })
        .eq("id", currentUser.id);
      if (updErr) throw updErr;

      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdMsg("Password updated.");
    } catch (err: any) {
      setPwdErr(err?.message ?? "Could not change password.");
    } finally {
      setPwdSaving(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDelErr(null);

    if (!currentUser.id) {
      setDelErr("Not signed in.");
      return;
    }
    if (confirmEmail.trim().toLowerCase() !== (currentUser.email ?? "").toLowerCase()) {
      setDelErr("Type your email exactly to confirm.");
      return;
    }

    setDeleting(true);
    try {
      const { error: dbErr } = await supabase
        .from("users")
        .delete()
        .eq("id", currentUser.id);
      if (dbErr) throw dbErr;

      logout();
      router.push("/login");
    } catch (err: any) {
      setDelErr(err?.message ?? "Could not delete account.");
      setDeleting(false);
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
          Account
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          Security and account management.
        </p>
      </header>

      {/* Change password ---------------------------------------------------- */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Change password
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Your password is stored as a salted PBKDF2 hash.
        </p>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <Input
            label="Current password"
            name="current"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
          />
          <Input
            label="New password"
            name="new"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
          <Input
            label="Confirm new password"
            name="confirm"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />
          {pwdMsg && (
            <p className="text-sm text-green-600 dark:text-green-400">{pwdMsg}</p>
          )}
          {pwdErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{pwdErr}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={pwdSaving}>
              Update password
            </Button>
          </div>
        </form>
      </section>

      {/* Danger zone -------------------------------------------------------- */}
      <section className="mt-8 rounded-lg border border-red-200 bg-red-50/40 p-6 dark:border-red-900/50 dark:bg-red-900/10">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" /> Delete account
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300/80">
          Permanently remove your account. This cannot be undone. Type your email (
          <span className="font-mono">{currentUser.email || "—"}</span>) to confirm.
        </p>
        <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
          <Input
            name="confirm-email"
            placeholder="your@email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
          />
          {delErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{delErr}</p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="destructive"
              loading={deleting}
              disabled={!currentUser.id}
            >
              Delete my account
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
