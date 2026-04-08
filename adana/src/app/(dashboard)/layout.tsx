"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { mockUser, mockProjects, mockTeams, mockNotifications } from "@/lib/mock-data";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = mockUser;
  const projects = mockProjects;
  const teams = mockTeams;
  const notificationCount = mockNotifications.filter((n) => !n.read && !n.archived).length;

  return (
    <DashboardLayout
      user={user}
      projects={projects}
      teams={teams}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardLayout>
  );
}
