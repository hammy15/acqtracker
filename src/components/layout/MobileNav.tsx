"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Building2,
  Zap,
  Archive,
  Settings,
} from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: Building2 },
  { href: "/transition-day", label: "TD", icon: Zap },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-100/90 dark:bg-surface-950/90 backdrop-blur-lg border-t border-surface-200 dark:border-surface-800">
        <div className="h-full flex items-center justify-around px-2">
          {mobileNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors",
                  isActive
                    ? "text-primary-500"
                    : "text-surface-400 dark:text-surface-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Full mobile nav sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-surface-100 dark:bg-surface-950">
          <div className="h-16 flex items-center px-6 border-b border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                AT
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                AcqTracker
              </span>
            </div>
          </div>
          <nav className="py-4 px-3 space-y-1">
            {mobileNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                      : "text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
