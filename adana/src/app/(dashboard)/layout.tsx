"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/app-store";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useAppStore();
  const { initialized, loading, currentUser, projects, notifications, init } = store;

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const notificationCount = notifications.filter(
    (n) => !n.read && !n.archived
  ).length;

  return (
    <DashboardLayout
      user={currentUser}
      projects={projects}
      teams={[]}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardLayout>
  );
}
