"use client";

import { useSession } from "next-auth/react";

type Permission =
  | "deals:create"
  | "deals:read"
  | "deals:update"
  | "deals:delete"
  | "deals:archive"
  | "tasks:assign"
  | "tasks:bulk_update"
  | "templates:manage"
  | "users:manage"
  | "state_reqs:manage"
  | "org:settings"
  | "reports:view"
  | "buildings:assign"
  | "buildings:command_dashboard";

const ROLE_PERMISSIONS: Record<string, Permission[] | ["*"]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "deals:create",
    "deals:read",
    "deals:update",
    "deals:archive",
    "tasks:assign",
    "tasks:bulk_update",
    "templates:manage",
    "reports:view",
    "buildings:assign",
    "buildings:command_dashboard",
  ],
  REGIONAL_LEAD: [
    "deals:read",
    "tasks:assign",
    "reports:view",
    "buildings:command_dashboard",
  ],
  DEAL_LEAD: ["deals:read", "tasks:assign"],
  DEPARTMENT_LEAD: ["deals:read", "tasks:assign"],
  TEAM_MEMBER: ["deals:read"],
  VIEWER: ["deals:read"],
};

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "VIEWER";

  const hasPermission = (permission: Permission): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return false;
    if (perms[0] === "*") return true;
    return (perms as Permission[]).includes(permission);
  };

  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isLeadership =
    isAdmin || role === "REGIONAL_LEAD" || role === "DEAL_LEAD";

  return { role, hasPermission, isAdmin, isLeadership };
}
