"use client";

import { useSession } from "next-auth/react";
import { ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user?.role as Role) ?? undefined;

  const can = (permission: Permission): boolean => {
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role];
    return perms ? perms.includes(permission) : false;
  };

  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isLeader =
    isAdmin || role === "REGIONAL_LEAD" || role === "DEAL_LEAD";

  return { can, isAdmin, isLeader, role };
}
