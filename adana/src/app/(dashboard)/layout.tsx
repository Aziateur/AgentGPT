import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUser } from "@/app/actions/auth-actions";
import { getProjects } from "@/app/actions/project-actions";
import { getTeams } from "@/app/actions/team-actions";
import { getUnreadCount } from "@/app/actions/notification-actions";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let projects: Array<Record<string, unknown>> = [];
  let teams: Array<Record<string, unknown>> = [];
  let notificationCount = 0;

  try {
    const [fetchedUser, fetchedProjects, fetchedTeams, fetchedCount] =
      await Promise.all([
        getCurrentUser(),
        getProjects(),
        getTeams(),
        getUnreadCount(),
      ]);

    user = fetchedUser;
    if (Array.isArray(fetchedProjects)) projects = fetchedProjects;
    if (Array.isArray(fetchedTeams)) teams = fetchedTeams;
    if (typeof fetchedCount === "number") notificationCount = fetchedCount;
  } catch {
    // Fallback user for demo/development
    user = {
      id: "demo-user",
      name: "Demo User",
      email: "demo@adana.dev",
      avatar: null,
    };
  }

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
