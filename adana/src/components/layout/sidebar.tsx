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
  Menu,
  UserPlus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useAppStore as useDataStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { InviteModal } from "@/components/invite-modal";
import {
  SidebarCreateButton,
  SidebarCreateMenu,
  InsightsAddMenu,
  ProjectAddMenu,
  type CreateMenuAction,
} from "./sidebar-create-menu";
import { SidebarSection, SidebarAddButton } from "./sidebar-section";
import { SidebarStarredList, type StarredItem } from "./sidebar-starred";
import {
  SidebarProjectsList,
  type SidebarProjectRow,
} from "./sidebar-projects";

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
// Props
// ---------------------------------------------------------------------------

interface SidebarProps {
  projects?: Array<Record<string, unknown>>;
  teams?: Array<Record<string, unknown>>;
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Top-level NavItem (Home / My tasks / Inbox / Insights items)
// ---------------------------------------------------------------------------

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeDot?: boolean;
  collapsed: boolean;
  active?: boolean;
}

function NavItem({
  href,
  icon,
  label,
  badge,
  badgeDot,
  collapsed,
  active,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
        active && "bg-sidebar-active text-sidebar-text-active",
        collapsed && "justify-center px-0"
      )}
      title={collapsed ? label : undefined}
    >
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {icon}
        {badgeDot && collapsed && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-sidebar-bg" />
        )}
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
      {!collapsed && badgeDot && (
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-adana-600 px-1.5 text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const LS_KEY = "adana:sidebar-collapsed";
const LS_STARRED_PORTFOLIOS = "adana:starred-portfolios";

export function Sidebar({
  projects: propProjects = [],
  notificationCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } =
    useAppStore();

  // Collapsed-state hydration & persistence
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

  // ----- Data -------------------------------------------------------------
  const rawStoreProjects = useDataStore((s: any) => s.projects);
  const projectMembers = useDataStore((s: any) => s.projectMembers);
  const currentUserId = useDataStore((s: any) => s.currentUser?.id);
  const sectionsAll = useDataStore((s: any) => s.sections);
  const portfoliosExt = useDataStore((s: any) => s.portfoliosExt);
  const notificationsExt = useDataStore((s: any) => s.notificationsExt);
  const notificationsLegacy = useDataStore((s: any) => s.notifications);

  // Visible-to-current-user projects (creator OR member)
  const visibleProjects = useMemo(() => {
    const list = (rawStoreProjects as any[]) || [];
    if (!currentUserId) return list;
    const memberIds = new Set<string>(
      (projectMembers || [])
        .filter((m: any) => m.userId === currentUserId)
        .map((m: any) => m.projectId)
    );
    return list.filter(
      (p: any) => p.creatorId === currentUserId || memberIds.has(p.id)
    );
  }, [rawStoreProjects, projectMembers, currentUserId]);

  const sourceProjects: any[] =
    visibleProjects.length > 0
      ? visibleProjects
      : ((propProjects as any[]) ?? []);

  // Map to display rows
  const allProjects = useMemo(
    () =>
      sourceProjects.map((p) => ({
        id: p.id as string,
        name: p.name as string,
        color: (p.color as string) || "#4c6ef5",
        icon: (p.icon as string) || "folder",
        favorite: Boolean(p.favorite),
        archived: Boolean(p.archived),
      })),
    [sourceProjects]
  );

  // Active project id from query string or pathname segment
  const activeProjectId = useMemo(() => {
    const qid = searchParams?.get("id");
    if (qid) return qid;
    const m = pathname.match(/^\/projects\/([^/]+)/);
    return m ? m[1] : null;
  }, [searchParams, pathname]);

  const projectRows: SidebarProjectRow[] = useMemo(
    () =>
      allProjects
        .filter((p) => !p.archived)
        .slice(0, 12)
        .map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          icon: p.icon,
          href: `/project/list?id=${p.id}`,
          active: activeProjectId === p.id,
        })),
    [allProjects, activeProjectId]
  );

  // Starred items (favorite projects + starred portfolios from localStorage)
  const [starredPortfolioIds, setStarredPortfolioIds] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LS_STARRED_PORTFOLIOS);
      if (raw) setStarredPortfolioIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const starredItems: StarredItem[] = useMemo(() => {
    const out: StarredItem[] = [];
    for (const p of allProjects) {
      if (!p.favorite || p.archived) continue;
      const subs = ((sectionsAll as any[]) || [])
        .filter((s) => s.projectId === p.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((s) => ({ id: s.id, name: s.name }));
      out.push({
        id: p.id,
        name: p.name,
        color: p.color,
        icon: p.icon,
        kind: "project",
        subItems: subs,
        href: `/project/list?id=${p.id}`,
        detailsHref: `/project/overview?id=${p.id}`,
        active: activeProjectId === p.id,
      });
    }
    const starredSet = new Set(starredPortfolioIds);
    for (const pf of (portfoliosExt as any[]) || []) {
      if (!starredSet.has(pf.id)) continue;
      out.push({
        id: pf.id,
        name: pf.name,
        color: pf.color || "#7c3aed",
        icon: "briefcase",
        kind: "portfolio",
        href: `/portfolios?id=${pf.id}`,
        detailsHref: `/portfolios?id=${pf.id}`,
      });
    }
    return out;
  }, [
    allProjects,
    sectionsAll,
    portfoliosExt,
    starredPortfolioIds,
    activeProjectId,
  ]);

  // Inbox red-dot: any unread notification
  const hasUnread = useMemo(() => {
    const ext = (notificationsExt as any[]) || [];
    if (ext.some((n) => !n.read && !n.archived)) return true;
    const legacy = (notificationsLegacy as any[]) || [];
    if (legacy.some((n) => !n.read && !n.archived)) return true;
    return notificationCount > 0;
  }, [notificationsExt, notificationsLegacy, notificationCount]);

  // ----- Modals & menus ---------------------------------------------------
  const [inviteOpen, setInviteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [insightsAddOpen, setInsightsAddOpen] = useState(false);
  const [projectsAddOpen, setProjectsAddOpen] = useState(false);

  // Trial pill
  const [trialDaysLeft, setTrialDaysLeft] = useState(30);
  const createdAt = (currentUser as any)?.createdAt as string | undefined;
  useEffect(() => {
    if (!createdAt) return;
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return;
    const daysSince = Math.floor(
      (Date.now() - created) / (1000 * 60 * 60 * 24)
    );
    setTrialDaysLeft(Math.max(0, 30 - daysSince));
  }, [createdAt]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const showTrialBar = mounted && trialDaysLeft > 0 && trialDaysLeft <= 30;

  // ----- Action dispatchers ----------------------------------------------
  const dispatchCustom = (name: string, detail?: unknown) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const handleCreateAction = (action: CreateMenuAction) => {
    switch (action) {
      case "task":
        dispatchCustom("adana:create-task");
        break;
      case "project":
        router.push("/projects?new=1");
        dispatchCustom("adana:create-project");
        break;
      case "message":
        router.push("/inbox?compose=1");
        dispatchCustom("adana:compose-message");
        break;
      case "portfolio":
        router.push("/portfolios?new=1");
        dispatchCustom("adana:create-portfolio");
        break;
      case "goal":
        router.push("/goals?new=1");
        dispatchCustom("adana:create-goal");
        break;
      case "invite":
        setInviteOpen(true);
        break;
    }
  };

  const handleInsightsAdd = (action: "report" | "portfolio" | "goal") => {
    switch (action) {
      case "report":
        router.push("/reporting?new=1");
        dispatchCustom("adana:create-report");
        break;
      case "portfolio":
        router.push("/portfolios?new=1");
        dispatchCustom("adana:create-portfolio");
        break;
      case "goal":
        router.push("/goals?new=1");
        dispatchCustom("adana:create-goal");
        break;
    }
  };

  const handleProjectsAdd = (action: "project" | "portfolio") => {
    if (action === "project") {
      router.push("/projects?new=1");
      dispatchCustom("adana:create-project");
    } else {
      router.push("/portfolios?new=1");
      dispatchCustom("adana:create-portfolio");
    }
  };

  // ---------------------------------------------------------------------
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarCollapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden bg-sidebar-bg"
    >
      {/* Top: Hamburger + Logo --------------------------------------------- */}
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

      {/* Create button ------------------------------------------------------ */}
      <div className={cn("relative px-2 py-2", sidebarCollapsed && "px-0")}>
        <SidebarCreateButton
          collapsed={sidebarCollapsed}
          onClick={() => setCreateMenuOpen((v) => !v)}
        />
        <SidebarCreateMenu
          open={createMenuOpen}
          onClose={() => setCreateMenuOpen(false)}
          onSelect={handleCreateAction}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Main scrollable area ---------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1">
        {/* Top group ------------------------------------------------------- */}
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
          label="My tasks"
          collapsed={sidebarCollapsed}
          active={pathname === "/my-tasks"}
        />
        <NavItem
          href="/inbox"
          icon={<Bell className="h-4 w-4" />}
          label="Inbox"
          collapsed={sidebarCollapsed}
          active={pathname === "/inbox"}
          badgeDot={hasUnread}
        />

        {/* Insights -------------------------------------------------------- */}
        <SidebarSection
          label="Insights"
          collapsed={sidebarCollapsed}
          defaultOpen
          renderAddButton={() => (
            <span className="relative">
              <SidebarAddButton
                onClick={(e) => {
                  e.stopPropagation();
                  setInsightsAddOpen((v) => !v);
                }}
                ariaLabel="New insights"
              />
              <InsightsAddMenu
                open={insightsAddOpen}
                onClose={() => setInsightsAddOpen(false)}
                onSelect={handleInsightsAdd}
              />
            </span>
          )}
        >
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
            active={pathname.startsWith("/portfolios")}
          />
          <NavItem
            href="/goals"
            icon={<Target className="h-4 w-4" />}
            label="Goals"
            collapsed={sidebarCollapsed}
            active={pathname.startsWith("/goals")}
          />
        </SidebarSection>

        {/* Starred --------------------------------------------------------- */}
        {starredItems.length > 0 && !sidebarCollapsed && (
          <SidebarSection
            label="Starred"
            collapsed={sidebarCollapsed}
            defaultOpen
          >
            <SidebarStarredList items={starredItems} collapsed={false} />
          </SidebarSection>
        )}
        {starredItems.length > 0 && sidebarCollapsed && (
          <>
            <div className="my-1 flex items-center justify-center">
              <Star className="h-3 w-3 text-sidebar-text" />
            </div>
            <SidebarStarredList items={starredItems} collapsed />
          </>
        )}

        {/* Projects -------------------------------------------------------- */}
        <SidebarSection
          label="Projects"
          collapsed={sidebarCollapsed}
          defaultOpen
          renderAddButton={() => (
            <span className="relative">
              <SidebarAddButton
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectsAddOpen((v) => !v);
                }}
                ariaLabel="New project or portfolio"
              />
              <ProjectAddMenu
                open={projectsAddOpen}
                onClose={() => setProjectsAddOpen(false)}
                onSelect={handleProjectsAdd}
              />
            </span>
          )}
        >
          <SidebarProjectsList
            projects={projectRows}
            collapsed={sidebarCollapsed}
          />
          {!sidebarCollapsed && projectRows.length > 0 && (
            <div className="px-1.5 pt-1">
              <Link
                href="/projects"
                className="block rounded px-1.5 py-1 text-[11px] text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
              >
                Show all projects
              </Link>
            </div>
          )}
        </SidebarSection>
      </nav>

      {/* Footer ------------------------------------------------------------ */}
      <div className="border-t border-sidebar-hover px-1.5 py-2 space-y-0.5">
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
          title={sidebarCollapsed ? "Invite teammates" : undefined}
          aria-label="Invite teammates"
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

        {showTrialBar && !sidebarCollapsed && (
          <div className="mt-2 rounded-md border border-sidebar-hover bg-sidebar-hover/40 p-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-sidebar-text-active">
                Adana Pro trial
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-sidebar-text">
              {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
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
                Upgrade to Adana Pro —{" "}
                <span className="font-semibold">$0/month</span> during demo.
                Contact support.
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
