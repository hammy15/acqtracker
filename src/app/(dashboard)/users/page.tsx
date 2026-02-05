"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Shield,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  activeDeals: number;
  tasksCompleted: number;
  status: "active" | "invited" | "inactive";
  avatar: string;
}

const mockUsers: User[] = [
  { id: "1", name: "Owen Richardson", email: "owen@company.com", phone: "(208) 555-0101", role: "Admin", department: "Executive", activeDeals: 4, tasksCompleted: 342, status: "active", avatar: "OR" },
  { id: "2", name: "Steve Anderson", email: "steve@company.com", phone: "(208) 555-0102", role: "Admin", department: "Licensing & Compliance", activeDeals: 3, tasksCompleted: 287, status: "active", avatar: "SA" },
  { id: "3", name: "Doug Martinez", email: "doug@company.com", phone: "(208) 555-0104", role: "Member", department: "Operations", activeDeals: 2, tasksCompleted: 156, status: "active", avatar: "DM" },
  { id: "4", name: "Sarah Chen", email: "sarah@company.com", phone: "(208) 555-0105", role: "Member", department: "Accounting", activeDeals: 3, tasksCompleted: 198, status: "active", avatar: "SC" },
  { id: "5", name: "Tim Brooks", email: "tim@company.com", phone: "(208) 555-0103", role: "Member", department: "HR / Operations", activeDeals: 2, tasksCompleted: 124, status: "active", avatar: "TB" },
  { id: "6", name: "James Peterson", email: "james@company.com", phone: "(208) 555-0106", role: "Member", department: "Facilities", activeDeals: 2, tasksCompleted: 89, status: "active", avatar: "JP" },
  { id: "7", name: "Lisa Huang", email: "lisa@company.com", phone: "(208) 555-0107", role: "Viewer", department: "Legal", activeDeals: 1, tasksCompleted: 0, status: "invited", avatar: "LH" },
  { id: "8", name: "Mike Thompson", email: "mike@company.com", phone: "(208) 555-0108", role: "Member", department: "IT", activeDeals: 0, tasksCompleted: 45, status: "inactive", avatar: "MT" },
];

const avatarColors: Record<string, string> = {
  OR: "bg-primary-500",
  SA: "bg-emerald-500",
  DM: "bg-blue-500",
  SC: "bg-purple-500",
  TB: "bg-amber-500",
  JP: "bg-red-500",
  LH: "bg-pink-500",
  MT: "bg-surface-400",
};

const statusBadge: Record<string, { label: string; classes: string }> = {
  active: { label: "Active", classes: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" },
  invited: { label: "Invited", classes: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
  inactive: { label: "Inactive", classes: "bg-surface-100 dark:bg-surface-800 text-surface-500" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockUsers.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-500" />
            Team Members
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {mockUsers.length} users &middot; {mockUsers.filter((u) => u.status === "active").length} active
          </p>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="neu-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-800">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Deals</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
              {filtered.map((user) => {
                const badge = statusBadge[user.status];
                return (
                  <tr key={user.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", avatarColors[user.avatar] || "bg-surface-500")}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{user.name}</p>
                          <p className="text-xs text-surface-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-300">
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">{user.department}</td>
                    <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">{user.activeDeals} active</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", badge.classes)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                        <MoreVertical className="w-4 h-4 text-surface-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
