"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  CheckCircle,
  Bell,
  Briefcase,
  Target,
  BarChart3,
  Plus,
  Menu,
  UserPlus,
  Users,
  Sparkles,
  Star,
  ChevronDown,
  Settings as SettingsIcon,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useAppStore as useDataStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { InviteModal } from "@/components/invite-modal";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const sidebarVariants = {
  expanded: { width: 240 },
  collapsed: { width: 56 },
};

const fadeVariants = {
  visible: { opacity: 1, display: "block" },
  hidden: { opacity: 0, transitionEnd: { display: "none" } },
};

// ---------------------------------------------------------------------------
// Props for real data from server
// ---------------------------------------------------------------------------

interface SidebarProps {
  projects?: Array<Record<string, unknown>>;
  teams?: Array<Record<string, unknown>>;
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  collapsed: boolean;
  active?: boolean;
}

function NavItem({ href, icon, label, badge, collapsed, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
        active && "bg-sidebar-active text-sidebar-text-active",
        collapsed && "justify-center px-0"
      )}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {icon}
      </span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.15 }}
            className="flex-1 truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {badge !== undefined && badge > 0 && !collapsed && (
        <motion.span
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-adana-600 px-1.5 text-[11px] font-semibold text-white"
        >
          {badge}
        </motion.span>
      )}
    </Link>
  );
}

function SectionHeader({
  label,
  collapsed,
  onAdd,
}: {
  label: string;
  collapsed: boolean;
  onAdd?: () => void;
}) {
  if (collapsed) return <div className="my-1 h-px bg-sidebar-hover" />;

  return (
    <div className="flex items-center justify-between px-2.5 pb-1 pt-3">
      <motion.span
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-text"
      >
        {label}
      </motion.span>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex h-5 w-5 items-center justify-center rounded text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function CollapsibleSectionHeader({
  label,
  collapsed,
  open,
  onToggle,
}: {
  label: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  if (collapsed) return <div className="my-1 h-px bg-sidebar-hover" />;
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-1 px-2.5 pb-1 pt-3 text-left"
    >
      <ChevronDown
        className={cn(
          "h-3 w-3 text-sidebar-text transition-transform",
          !open && "-rotate-90"
        )}
      />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-text">
        {label}
      </span>
    </button>
  );
}

function Separator() {
  return <div className="mx-2.5 my-1.5 h-px bg-sidebar-hover" />;
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

const LS_KEY = "adana:sidebar-collapsed";

export function Sidebar({ projects = [], teams = [], notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAppStore();

  const [insightsOpen, setInsightsOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Compute trial days left from currentUser.createdAt (client-only to avoid hydration mismatch)
  const [trialDaysLeft, setTrialDaysLeft] = useState(30);
  const createdAt = (currentUser as any)?.createdAt as string | undefined;
  useEffect(() => {
    if (!createdAt) return;
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return;
    const daysSince = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
    setTrialDaysLeft(30 - daysSince);
  }, [createdAt]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const showTrialBar = mounted && trialDaysLeft > 0 && trialDaysLeft <= 30;

  // Hydrate collapsed state from dedicated localStorage key (requirement)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw != null) {
        const parsed = raw === "true";
        if (parsed !== sidebarCollapsed) setSidebarCollapsed(parsed);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_KEY, String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  // Prefer visible projects from data store if available.
  // IMPORTANT: selector must return a stable ref when state hasn't changed; otherwise
  // zustand re-renders indefinitely (React #185). Subscribe to raw state slices, filter in useMemo.
  const rawStoreProjects = useDataStore((s: any) => s.projects);
  const projectMembers = useDataStore((s: any) => s.projectMembers);
  const currentUserId = useDataStore((s: any) => s.currentUser?.id);
  const visibleProjects = useMemo(() => {
    if (!currentUserId) return rawStoreProjects;
    const memberIds = new Set<string>(
      (projectMembers || []).filter((m: any) => m.userId === currentUserId).map((m: any) => m.projectId)
    );
    return (rawStoreProjects || []).filter(
      (p: any) => p.creatorId === currentUserId || memberIds.has(p.id)
    );
  }, [rawStoreProjects, projectMembers, currentUserId]);
  const sourceProjects: Array<Record<string, unknown>> =
    (visibleProjects as Array<Record<string, unknown>> | undefined) ?? projects;

  // Map to display shape
  const allProjects = sourceProjects.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    color: (p.color as string) || "#6366f1",
    isFavorite: Boolean(p.favorite),
  }));

  const starredProjects = allProjects.filter((p) => p.isFavorite);
  const otherProjects = allProjects.filter((p) => !p.isFavorite).slice(0, 8);

  const allTeams = teams.map((t) => ({
    id: t.id as string,
    name: t.name as string,
  }));

  const renderProjectLink = (project: { id: string; name: string; color: string }) => (
    <Link
      key={project.id}
      href={`/project/list?id=${project.id}`}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
        pathname.startsWith(`/project/`) &&
          searchParams?.get("id") === project.id &&
          "bg-sidebar-active text-sidebar-text-active",
        sidebarCollapsed && "justify-center px-0"
      )}
    >
      <span
        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.span
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.15 }}
            className="truncate"
          >
            {project.name}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarCollapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden bg-sidebar-bg"
    >
      {/* Top: Hamburger toggle + Logo ---------------------------------- */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-sidebar-hover px-2 py-3",
          sidebarCollapsed && "justify-center px-0"
        )}
      >
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.15 }}
              className="flex min-w-0 items-center gap-2"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-adana-500 to-adana-700">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-text-active">
                  Adana
                </p>
                <p className="truncate text-[11px] text-sidebar-text">
                  My Workspace
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User avatar + name ----------------------------------------------- */}
      {currentUser && (
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-2",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-adana-600 text-[11px] font-semibold text-white">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.15 }}
                className="truncate text-sm text-sidebar-text-active"
              >
                {currentUser.name}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main navigation -------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1">
        <NavItem
          href="/home"
          icon={<House className="h-4 w-4" />}
          label="Home"
          collapsed={sidebarCollapsed}
          active={pathname === "/" || pathname === "/home"}
        />
        <NavItem
          href="/my-tasks"
          icon={<CheckCircle className="h-4 w-4" />}
          label="My Tasks"
          collapsed={sidebarCollapsed}
          active={pathname === "/my-tasks"}
        />
        <NavItem
          href="/inbox"
          icon={<Bell className="h-4 w-4" />}
          label="Inbox"
          badge={notificationCount}
          collapsed={sidebarCollapsed}
          active={pathname === "/inbox"}
        />
        <NavItem
          href="/goals"
          icon={<Target className="h-4 w-4" />}
          label="Goals"
          collapsed={sidebarCollapsed}
          active={pathname === "/goals"}
        />

        <Separator />

        {/* Insights group: Reporting + Portfolios ------------------------ */}
        <CollapsibleSectionHeader
          label="Insights"
          collapsed={sidebarCollapsed}
          open={insightsOpen}
          onToggle={() => setInsightsOpen((v) => !v)}
        />
        {(insightsOpen || sidebarCollapsed) && (
          <>
            <NavItem
              href="/reporting"
              icon={<BarChart3 className="h-4 w-4" />}
              label="Reporting"
              collapsed={sidebarCollapsed}
              active={pathname === "/reporting"}
            />
            <NavItem
              href="/portfolios"
              icon={<Briefcase className="h-4 w-4" />}
              label="Portfolios"
              collapsed={sidebarCollapsed}
              active={pathname === "/portfolios"}
            />
          </>
        )}

        <NavItem
          href="/settings/ai"
          icon={<Sparkles className="h-4 w-4" />}
          label="AI Settings"
          collapsed={sidebarCollapsed}
          active={pathname === "/settings/ai" || pathname.startsWith("/settings/ai")}
        />

        <Separator />

        {/* Starred projects ---------------------------------------------- */}
        {starredProjects.length > 0 && (
          <>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-3">
                <Star className="h-3 w-3 text-sidebar-text" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-text">
                  Starred
                </span>
              </div>
            )}
            {sidebarCollapsed && <div className="my-1 h-px bg-sidebar-hover" />}
            {starredProjects.map(renderProjectLink)}
          </>
        )}

        {/* Projects ------------------------------------------------------ */}
        <SectionHeader
          label="Projects"
          collapsed={sidebarCollapsed}
          onAdd={() => router.push("/projects")}
        />
        {otherProjects.map(renderProjectLink)}

        <Separator />

        {/* Teams --------------------------------------------------------- */}
        {allTeams.length > 0 && (
          <>
            <SectionHeader label="Teams" collapsed={sidebarCollapsed} />
            {allTeams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
                  pathname === `/teams/${team.id}` &&
                    "bg-sidebar-active text-sidebar-text-active",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      variants={fadeVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {team.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Bottom actions --------------------------------------------------- */}
      <div className="border-t border-sidebar-hover px-1.5 py-2 space-y-0.5">
        <NavItem
          href="/settings"
          icon={<SettingsIcon className="h-4 w-4" />}
          label="Settings"
          collapsed={sidebarCollapsed}
          active={pathname === "/settings" || (pathname.startsWith("/settings/") && !pathname.startsWith("/settings/ai"))}
        />
        <NavItem
          href="/trash"
          icon={<Trash2 className="h-4 w-4" />}
          label="Trash"
          collapsed={sidebarCollapsed}
          active={pathname === "/trash"}
        />
        <button
          onClick={() => setInviteOpen(true)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <UserPlus className="h-4 w-4 flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.15 }}
              >
                Invite teammates
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Trial status bar */}
        {showTrialBar && !sidebarCollapsed && (
          <div className="mt-2 rounded-md border border-sidebar-hover bg-sidebar-hover/40 p-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-sidebar-text-active">
                {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-sidebar-text">
              Adana Pro trial
            </p>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="mt-2 w-full rounded-md bg-adana-600 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-adana-700"
            >
              Upgrade
            </button>
          </div>
        )}
        {showTrialBar && sidebarCollapsed && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="mt-1 flex w-full items-center justify-center rounded-md p-1.5 text-amber-400 hover:bg-sidebar-hover"
            aria-label={`${trialDaysLeft} days left — Upgrade`}
            title={`${trialDaysLeft} days left — Upgrade`}
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {upgradeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setUpgradeOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-surface-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Upgrade to Adana Pro
                </h3>
              </div>
              <button
                onClick={() => setUpgradeOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Upgrade to Adana Pro — <span className="font-semibold">$0/month</span> during demo. Contact support.
              </p>
            </div>
            <div className="flex justify-end border-t border-gray-100 px-5 py-3 dark:border-gray-700">
              <button
                onClick={() => setUpgradeOpen(false)}
                className="rounded-md bg-adana-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-adana-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
