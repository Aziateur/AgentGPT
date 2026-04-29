"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: Record<string, unknown> | null;
  projects?: Array<Record<string, unknown>>;
  teams?: Array<Record<string, unknown>>;
  notificationCount?: number;
}

export function DashboardLayout({
  children,
  user: _user,
  projects = [],
  teams = [],
  notificationCount = 0,
}: DashboardLayoutProps) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const theme = useAppStore((s) => s.theme);

  // Sync the dark class on <html> so Tailwind dark: variants work globally
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className={cn("h-screen", theme === "dark" && "dark")}>
      <div className="flex h-full bg-white dark:bg-surface-dark">
        {/* Sidebar */}
        <Sidebar
          projects={projects}
          teams={teams}
          notificationCount={notificationCount}
        />

        {/* Main area: header + scrollable content */}
        <motion.div
          animate={{ marginLeft: sidebarCollapsed ? 56 : 240 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <Header />

          <main className="flex-1 overflow-y-auto bg-surface-secondary p-6 dark:bg-surface-dark-secondary">
            {children}
          </main>
        </motion.div>
      </div>
    </div>
  );
}
