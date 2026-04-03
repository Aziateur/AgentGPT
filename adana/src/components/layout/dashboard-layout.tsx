"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, theme } = useAppStore();

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
        <Sidebar />

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
