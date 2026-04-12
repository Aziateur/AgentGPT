"use client";

import Link from "next/link";
import {
  User as UserIcon,
  Lock,
  Bell,
  Monitor,
  Sparkles,
  Building2,
  ChevronRight,
} from "lucide-react";

const SECTIONS: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}[] = [
  {
    href: "/settings/profile",
    icon: <UserIcon className="h-5 w-5" />,
    title: "Profile",
    description: "Name, email, avatar — how others see you.",
  },
  {
    href: "/settings/account",
    icon: <Lock className="h-5 w-5" />,
    title: "Account",
    description: "Change password or delete your account.",
  },
  {
    href: "/settings/notifications",
    icon: <Bell className="h-5 w-5" />,
    title: "Notifications",
    description: "Choose what you want to be notified about.",
  },
  {
    href: "/settings/display",
    icon: <Monitor className="h-5 w-5" />,
    title: "Display",
    description: "Theme and weekly capacity.",
  },
  {
    href: "/settings/ai",
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI",
    description: "Configure AI providers and smart features.",
  },
  {
    href: "/settings",
    icon: <Building2 className="h-5 w-5" />,
    title: "Workspace",
    description: "Workspace preferences (coming soon).",
  },
];

export default function SettingsHubPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          Manage your profile, preferences, and workspace configuration.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-gray-700 dark:bg-surface-dark dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              {s.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {s.title}
                </h2>
                <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {s.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
