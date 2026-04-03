import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUser } from "@/app/actions/auth-actions";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Fallback user for demo/development
    user = {
      id: "demo-user",
      name: "Demo User",
      email: "demo@adana.dev",
      avatarUrl: null,
      bio: null,
      role: "member",
      teamIds: ["team-1"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
