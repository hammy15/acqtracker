"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  Building2,
  FileStack,
  MapPin,
  Users,
  BarChart3,
  Archive,
  Settings,
  ChevronLeft,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/deals", label: "Deals", icon: Building2, permission: null },
  {
    href: "/transition-day",
    label: "Transition Day",
    icon: Zap,
    permission: null,
  },
  {
    href: "/templates",
    label: "Templates",
    icon: FileStack,
    permission: "templates:manage" as const,
  },
  {
    href: "/state-requirements",
    label: "State Reqs",
    icon: MapPin,
    permission: "state_reqs:manage" as const,
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    permission: "users:manage" as const,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    permission: "reports:view" as const,
  },
  { href: "/archive", label: "Archive", icon: Archive, permission: null },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "org:settings" as const,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { hasPermission } = usePermissions();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 ease-smooth",
        "bg-surface-100 dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-surface-200 dark:border-surface-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            AT
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
              AcqTracker
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems
          .filter(
            (item) =>
              !item.permission || hasPermission(item.permission)
          )
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-primary-500"
                      : "text-surface-400 dark:text-surface-500"
                  )}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-800">
        <button
          onClick={toggleSidebarCollapsed}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              sidebarCollapsed && "rotate-180"
            )}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
