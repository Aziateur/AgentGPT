import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adana - Project Management",
  description:
    "Manage your team's work, projects, and tasks in one place. Built for teams that move fast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
