"use client";

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
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

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

function Separator() {
  return <div className="mx-2.5 my-1.5 h-px bg-sidebar-hover" />;
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar({ projects = [], teams = [], notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, sidebarCollapsed, toggleSidebar } = useAppStore();

  // Map server data to display shape
  const allProjects = projects.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    color: (p.color as string) || "#6366f1",
    isFavorite: Boolean(p.favorite),
  }));

  const favoriteProjects = allProjects.filter((p) => p.isFavorite);
  const recentProjects = allProjects.filter((p) => !p.isFavorite).slice(0, 5);

  const allTeams = teams.map((t) => ({
    id: t.id as string,
    name: t.name as string,
  }));

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarCollapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden bg-sidebar-bg"
    >
      {/* Logo + Workspace ------------------------------------------------- */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-sidebar-hover px-3 py-3",
          sidebarCollapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-adana-500 to-adana-700">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-semibold text-sidebar-text-active">
                Adana
              </p>
              <p className="truncate text-[11px] text-sidebar-text">
                My Workspace
              </p>
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

        <Separator />

        {/* Favorites ------------------------------------------------------ */}
        <SectionHeader
          label="Favorites"
          collapsed={sidebarCollapsed}
        />
        {favoriteProjects.map((project) => (
          <Link
            key={project.id}
            href={`/project/list?id=${project.id}`}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
              "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
              pathname.startsWith(`/project/`) && searchParams?.get("id") === project.id &&
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
        ))}

        {/* Recent projects ------------------------------------------------ */}
        {recentProjects.length > 0 && (
          <>
            <SectionHeader
              label="Projects"
              collapsed={sidebarCollapsed}
              onAdd={() => router.push("/projects")}
            />
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/project/list?id=${project.id}`}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
                  pathname.startsWith(`/project/`) && searchParams?.get("id") === project.id &&
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
            ))}
          </>
        )}

        <Separator />

        {/* Insights / Tools ----------------------------------------------- */}
        <NavItem
          href="/portfolios"
          icon={<Briefcase className="h-4 w-4" />}
          label="Portfolios"
          collapsed={sidebarCollapsed}
          active={pathname === "/portfolios"}
        />
        <NavItem
          href="/goals"
          icon={<Target className="h-4 w-4" />}
          label="Goals"
          collapsed={sidebarCollapsed}
          active={pathname === "/goals"}
        />
        <NavItem
          href="/reporting"
          icon={<BarChart3 className="h-4 w-4" />}
          label="Reporting"
          collapsed={sidebarCollapsed}
          active={pathname === "/reporting"}
        />
        <NavItem
          href="/settings/ai"
          icon={<Sparkles className="h-4 w-4" />}
          label="AI Settings"
          collapsed={sidebarCollapsed}
          active={pathname === "/settings/ai" || pathname.startsWith("/settings/ai")}
        />

        <Separator />

        {/* Teams ---------------------------------------------------------- */}
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
      </nav>

      {/* Bottom actions --------------------------------------------------- */}
      <div className="border-t border-sidebar-hover px-1.5 py-2">
        <button
          onClick={() => {}}
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

        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active",
            sidebarCollapsed && "justify-center px-0"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <motion.span
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.15 }}
              >
                Collapse
              </motion.span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
