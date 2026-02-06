"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Shield,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdminOnly } from "@/components/shared/PermissionGate";
import { usePermissions } from "@/hooks/usePermissions";

const roleBadge: Record<string, { classes: string }> = {
  ADMIN: {
    classes:
      "bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400",
  },
  MEMBER: {
    classes:
      "bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300",
  },
  VIEWER: {
    classes:
      "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
  },
};

const avatarColors = [
  "bg-primary-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UsersPage() {
  const { isAdmin } = usePermissions();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading } = trpc.users.list.useQuery({
    search,
    role: roleFilter || undefined,
  });

  const users = data?.users ?? [];
  const activeCount = users.filter((u) => u.isActive).length;

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
            {users.length} users &middot; {activeCount} active
          </p>
        </div>
        <AdminOnly>
          <button className="neu-button-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        </AdminOnly>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neu-input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="neu-input w-36"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && <PageLoader />}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <EmptyState
          icon={Users}
          title="No users found"
          description={
            search || roleFilter
              ? "No users match your filters. Try a different search or role."
              : "Invite your first team member to get started."
          }
        />
      )}

      {/* Users Table */}
      {!isLoading && users.length > 0 && (
        <div className="neu-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    Region
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    Tasks
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                {users.map((user) => {
                  const initials = getInitials(user.name);
                  const avatarColor = getAvatarColor(user.name);
                  const badge = roleBadge[user.role] ?? roleBadge.MEMBER;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                                avatarColor
                              )}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                              {user.name}
                            </p>
                            <p className="text-xs text-surface-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit",
                            badge.classes
                          )}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
                        {user.region?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
                        {user._count.assignedTasks} assigned
                      </td>
                      <td className="px-4 py-3">
                        {user.isActive ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-3 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                            <MoreVertical className="w-4 h-4 text-surface-400" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
