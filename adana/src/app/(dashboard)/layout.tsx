"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/app-store";
import { installRuleEngine } from "@/lib/rules/hook";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { TaskDetailHost } from "@/components/tasks/task-detail-host";
import { useShortcuts } from "@/hooks/use-shortcuts";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useAppStore((s) => s.initialized);
  const loading = useAppStore((s) => s.loading);
  const currentUser = useAppStore((s) => s.currentUser);
  const projects = useAppStore((s) => s.projects);
  const notifications = useAppStore((s) => s.notifications);
  const init = useAppStore((s) => s.init);

  useShortcuts();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const cleanup = installRuleEngine();
    return cleanup;
  }, []);

  if (!initialized || loading) {
    return (
      <ThemeProvider>
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const notificationCount = notifications.filter(
    (n) => !n.read && !n.archived
  ).length;

  return (
    <ThemeProvider>
      <DashboardLayout
        user={currentUser}
        projects={projects}
        teams={[]}
        notificationCount={notificationCount}
      >
        {children}
      </DashboardLayout>
      <CommandPalette />
      <TaskDetailHost />
    </ThemeProvider>
  );
}
