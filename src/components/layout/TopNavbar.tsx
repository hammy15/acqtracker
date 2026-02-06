"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";
import { useUIStore } from "@/stores/uiStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Building2,
  Zap,
  FileStack,
  MapPin,
  Users,
  BarChart3,
  Archive,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Nav item definitions — mirrors the old Sidebar
// ---------------------------------------------------------------------------

const navItems: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission | null;
  adminOnly?: boolean;
}[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/deals", label: "Deals", icon: Building2, permission: null },
  { href: "/transition-day", label: "Transition Day", icon: Zap, permission: null },
  {
    href: "/templates",
    label: "Templates",
    icon: FileStack,
    permission: "templates:read",
  },
  {
    href: "/state-requirements",
    label: "State Reqs",
    icon: MapPin,
    permission: "state-reqs:read",
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    permission: "users:read",
    adminOnly: true,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    permission: "reports:read",
  },
  { href: "/archive", label: "Archive", icon: Archive, permission: null },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "org:settings",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TopNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { can, isAdmin, role } = usePermissions();
  const isGodMode = role === "SUPER_ADMIN";
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  // Track scroll to add shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  // Close drawer on outside click
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileNavOpen, setMobileNavOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const filteredNav = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.permission && !can(item.permission)) return false;
    return true;
  });

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 min-h-16 w-full safe-top",
          "bg-white/80 backdrop-blur-xl",
          "border-b transition-shadow duration-300",
          scrolled
            ? "border-gray-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
            : "border-gray-100"
        )}
      >
        {/* Subtle top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400 opacity-90" />

        <div className="mx-auto flex h-full max-w-[1800px] items-center px-4 lg:px-6">
          {/* ---- LEFT: Logo ---- */}
          <Link href="/" className="mr-6 flex shrink-0 items-center gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                "bg-gradient-to-br from-teal-500 to-teal-600",
                "text-[11px] font-extrabold tracking-tight text-white",
                "shadow-[0_1px_4px_rgba(20,184,166,0.35)]",
                "transition-transform duration-200 hover:scale-105"
              )}
            >
              AC
            </div>
            <span className="hidden text-[15px] font-semibold tracking-[-0.01em] text-gray-900 sm:block">
              Acquisition<span className="text-teal-600">Checklist</span>
            </span>
          </Link>

          {/* ---- CENTER: Desktop nav ---- */}
          <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
            {filteredNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "text-teal-700"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-200",
                      active
                        ? "text-teal-500"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span>{item.label}</span>

                  {/* Active indicator — bottom bar */}
                  {active && (
                    <span className="absolute -bottom-[calc(0.5rem+5px)] left-3 right-3 h-[2px] rounded-full bg-teal-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ---- RIGHT: Search, notifications, user ---- */}
          <div className="ml-auto flex items-center gap-1">
            {/* Search */}
            <div
              className={cn(
                "relative hidden items-center sm:flex",
                "transition-all duration-300",
                searchFocused ? "w-60" : "w-44"
              )}
            >
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "h-8 w-full rounded-lg pl-8 pr-3 text-[13px]",
                  "bg-gray-100/80 text-gray-900 placeholder:text-gray-400",
                  "outline-none ring-1 ring-transparent",
                  "transition-all duration-200",
                  "focus:bg-white focus:ring-teal-500/40 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.1)]"
                )}
              />
            </div>

            {/* Mobile search button */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="mx-1.5 hidden h-5 w-px bg-gray-200 sm:block" />

            {/* Notifications */}
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
            </button>

            {/* Divider */}
            <div className="mx-1.5 hidden h-5 w-px bg-gray-200 sm:block" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-100">
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-semibold text-white",
                          isGodMode
                            ? "bg-gradient-to-br from-amber-500 to-orange-600"
                            : "bg-gradient-to-br from-teal-500 to-teal-600"
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isGodMode && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[6px] font-black text-amber-900 ring-2 ring-white">
                        &#x26A1;
                      </span>
                    )}
                  </div>
                  <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-gray-700 md:block">
                    {user?.name ?? "User"}
                  </span>
                  {isGodMode && (
                    <span className="hidden md:inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200/60">
                      God
                    </span>
                  )}
                  <ChevronDown className="hidden h-3 w-3 text-gray-400 md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {/* User info header */}
                <div className="px-2 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name ?? "User"}
                    </p>
                    {isGodMode && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200/60">
                        God Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {isGodMode ? "Super Admin" : user?.email ?? ""}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? (
                <X className="h-4.5 w-4.5" />
              ) : (
                <Menu className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ---- MOBILE DRAWER OVERLAY ---- */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          mobileNavOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* ---- MOBILE DRAWER (slide-down from top) ---- */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed inset-x-0 top-16 z-50 lg:hidden",
          "transform transition-all duration-300 ease-out",
          mobileNavOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-3 mt-1 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-xl backdrop-blur-xl">
          {/* Nav grid */}
          <nav className="grid grid-cols-3 gap-px bg-gray-100/50 p-2">
            {filteredNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all duration-200",
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-teal-500/10"
                        : "bg-gray-100"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-teal-500" : "text-gray-500"
                      )}
                    />
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile search bar */}
          <div className="border-t border-gray-100 px-3 py-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals, tasks, files..."
                className="h-9 w-full rounded-xl bg-gray-100 pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          {/* Mobile user row */}
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="bg-gradient-to-br from-teal-500 to-teal-600 text-[10px] font-semibold text-white"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-gray-900">
                  {user?.name ?? "User"}
                </p>
                <p className="truncate text-[11px] text-gray-500">
                  {user?.email ?? ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
