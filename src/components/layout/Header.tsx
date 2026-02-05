"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, Menu, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/uiStore";
import { useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const { setMobileNavOpen } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="h-16 border-b border-surface-200 dark:border-surface-800 bg-surface-100/80 dark:bg-surface-950/80 backdrop-blur-lg sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Mobile menu + Search */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative hidden sm:block max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search deals, tasks, files..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 border-none outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button className="relative p-2 rounded-xl text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary-500 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-surface-700 dark:text-surface-200">
                  {user?.name ?? "User"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
