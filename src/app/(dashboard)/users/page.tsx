"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Shield,
  MoreVertical,
  UserCheck,
  UserX,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermissions } from "@/hooks/usePermissions";

const ROLES: { value: string; label: string; adminOnly?: boolean }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", adminOnly: true },
  { value: "ADMIN", label: "Admin", adminOnly: true },
  { value: "REGIONAL_LEAD", label: "Regional Lead" },
  { value: "DEAL_LEAD", label: "Deal Lead" },
  { value: "DEPARTMENT_LEAD", label: "Department Lead" },
  { value: "TEAM_MEMBER", label: "Team Member" },
  { value: "VIEWER", label: "Viewer" },
];

const roleBadgeClasses: Record<string, string> = {
  SUPER_ADMIN: "bg-red-50 text-red-600",
  ADMIN: "bg-primary-50 text-primary-600",
  REGIONAL_LEAD: "bg-purple-50 text-purple-600",
  DEAL_LEAD: "bg-blue-50 text-blue-600",
  DEPARTMENT_LEAD: "bg-amber-50 text-amber-600",
  TEAM_MEMBER: "bg-surface-200 text-surface-600",
  VIEWER: "bg-surface-100 text-surface-500",
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

function PendingRequests() {
  const { role } = usePermissions();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const utils = trpc.useUtils();

  const { data: pending, isLoading } = trpc.users.getPendingRequests.useQuery();
  const approveMut = trpc.users.approveRequest.useMutation({
    onSuccess: () => {
      utils.users.getPendingRequests.invalidate();
      utils.users.list.invalidate();
    },
  });
  const rejectMut = trpc.users.rejectRequest.useMutation({
    onSuccess: () => {
      utils.users.getPendingRequests.invalidate();
    },
  });

  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  if (isLoading || !pending || pending.length === 0) return null;

  return (
    <div className="neu-card border-2 border-amber-200 bg-amber-50/30">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-gray-900">
          Pending Access Requests
        </h2>
        <span className="ml-auto text-sm font-medium text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
          {pending.length}
        </span>
      </div>

      <div className="space-y-3">
        {pending.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl border border-surface-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  getAvatarColor(user.name)
                )}
              >
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={selectedRoles[user.id] || "TEAM_MEMBER"}
                  onChange={(e) =>
                    setSelectedRoles((prev) => ({
                      ...prev,
                      [user.id]: e.target.value,
                    }))
                  }
                  className="appearance-none text-xs font-medium bg-surface-100 border border-surface-200 rounded-lg pl-2.5 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {ROLES.filter((r) => !r.adminOnly || isSuperAdmin).map(
                    (r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    )
                  )}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() =>
                  approveMut.mutate({
                    userId: user.id,
                    role: (selectedRoles[user.id] || "TEAM_MEMBER") as any,
                  })
                }
                disabled={approveMut.isPending}
                className="flex items-center gap-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Approve
              </button>

              <button
                onClick={() => rejectMut.mutate({ userId: user.id })}
                disabled={rejectMut.isPending}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-white hover:bg-red-500 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { isAdmin, role } = usePermissions();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.users.list.useQuery({
    search,
    role: roleFilter || undefined,
  });

  const updateMut = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setEditingUser(null);
    },
  });

  const users = data?.users ?? [];
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-500" />
            Team Members
          </h1>
          <p className="text-surface-500 mt-1">
            {users.length} users &middot; {activeCount} active
          </p>
        </div>
      </div>

      {/* Pending Access Requests (admin only) */}
      {isAdmin && <PendingRequests />}

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
          className="neu-input w-44"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
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
                <tr className="border-b border-surface-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Region
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Tasks
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {users.map((user) => {
                  const initials = getInitials(user.name);
                  const avatarColor = getAvatarColor(user.name);
                  const badgeClass =
                    roleBadgeClasses[user.role] ?? roleBadgeClasses.TEAM_MEMBER;
                  const isEditing = editingUser === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-50 transition-colors"
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
                            <p className="text-sm font-medium text-surface-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-surface-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="text-xs border border-surface-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {ROLES.filter(
                              (r) => !r.adminOnly || isSuperAdmin
                            ).map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit",
                              badgeClass
                            )}
                          >
                            <Shield className="w-3 h-3" />
                            {user.role.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {user.region?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {user._count.assignedTasks} assigned
                      </td>
                      <td className="px-4 py-3">
                        {user.isActive ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                            Pending
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  updateMut.mutate({
                                    id: user.id,
                                    role: editRole as any,
                                  });
                                }}
                                disabled={updateMut.isPending}
                                className="text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 px-3 py-1 rounded-lg transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditRole(user.role);
                              }}
                              className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-surface-400" />
                            </button>
                          )}
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
