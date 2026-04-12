"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users as UsersIcon,
  Activity,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECURITY_KEY = "adana:require-password";
const ROLES = ["owner", "admin", "editor", "commenter", "viewer", "member"];

export default function AdminConsolePage() {
  const users = useAppStore((s) => s.users);
  const projects = useAppStore((s) => s.projects);
  const ruleExecutions = useAppStore((s) => s.ruleExecutions);
  const rules = useAppStore((s) => s.rules);
  const deleteProjectHard = useAppStore((s) => s.deleteProjectHard);

  const [requirePassword, setRequirePassword] = useState(false);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [purging, setPurging] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRequirePassword(localStorage.getItem(SECURITY_KEY) === "1");
      const raw = localStorage.getItem("adana:user-roles");
      if (raw) setUserRoles(JSON.parse(raw));
    } catch {}
  }, []);

  function toggleRequirePassword(v: boolean) {
    setRequirePassword(v);
    try {
      localStorage.setItem(SECURITY_KEY, v ? "1" : "0");
    } catch {}
  }

  function updateRole(userId: string, role: string) {
    const next = { ...userRoles, [userId]: role };
    setUserRoles(next);
    try {
      localStorage.setItem("adana:user-roles", JSON.stringify(next));
    } catch {}
  }

  function removeUser(userId: string) {
    if (!window.confirm("Remove this member from the workspace?")) return;
    const next = { ...userRoles };
    delete next[userId];
    setUserRoles(next);
    try {
      localStorage.setItem("adana:user-roles", JSON.stringify(next));
      const raw = localStorage.getItem("adana:removed-users");
      const removed: string[] = raw ? JSON.parse(raw) : [];
      if (!removed.includes(userId)) removed.push(userId);
      localStorage.setItem("adana:removed-users", JSON.stringify(removed));
    } catch {}
    setMsg("Member removed (locally).");
  }

  const auditRows = useMemo(
    () =>
      ruleExecutions
        .slice(0, 50)
        .map((ex) => ({
          ...ex,
          ruleName: rules.find((r) => r.id === ex.ruleId)?.name ?? "Unknown rule",
        })),
    [ruleExecutions, rules]
  );

  async function handlePurge() {
    if (
      !window.confirm(
        "This will permanently delete ALL projects, sections and tasks. Continue?"
      )
    ) {
      return;
    }
    setPurging(true);
    try {
      for (const p of projects) {
        await deleteProjectHard(p.id);
      }
      setMsg("Demo data purged.");
    } catch (err: any) {
      setMsg(err?.message ?? "Purge failed.");
    } finally {
      setPurging(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <header className="mt-4 mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          <Shield className="h-5 w-5 text-indigo-600" /> Admin console
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage workspace members, security, and data.
        </p>
      </header>

      {msg && (
        <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
          {msg}
        </div>
      )}

      {/* Members ------------------------------------------------------- */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <UsersIcon className="h-4 w-4" /> Workspace members
        </h2>
        <div className="overflow-hidden rounded border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                    {u.name}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                    {u.email}
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={userRoles[u.id] ?? "member"}
                      onValueChange={(v) => updateRole(u.id, v)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => removeUser(u.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-sm text-gray-400"
                    colSpan={4}
                  >
                    No members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit log placeholder ---------------------------------------- */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <Activity className="h-4 w-4" /> Activity log
        </h2>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Last 50 rule executions (used as a proxy activity log).
        </p>
        <div className="max-h-72 overflow-auto rounded border border-gray-100 dark:border-gray-700">
          {auditRows.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">
              No activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {auditRows.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {ex.ruleName}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {ex.status}
                      {ex.log ? ` — ${ex.log}` : ""}
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {new Date(ex.executedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Security ----------------------------------------------------- */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <Shield className="h-4 w-4" /> Security
        </h2>
        <label className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Require password for login
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Placeholder setting (local). Stored in browser only.
            </p>
          </div>
          <input
            type="checkbox"
            checked={requirePassword}
            onChange={(e) => toggleRequirePassword(e.target.checked)}
            className="mt-1 h-4 w-4 accent-indigo-600"
          />
        </label>
      </section>

      {/* Danger zone -------------------------------------------------- */}
      <section className="rounded-lg border border-red-200 bg-red-50/40 p-5 dark:border-red-900 dark:bg-red-900/10">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-red-700 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" /> Danger zone
        </h2>
        <p className="mb-3 text-sm text-red-800 dark:text-red-200">
          Permanently delete all projects, sections, and tasks. Users are kept.
        </p>
        <Button
          variant="destructive"
          onClick={handlePurge}
          loading={purging}
        >
          Purge demo data
        </Button>
      </section>
    </div>
  );
}
