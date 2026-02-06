"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

export function AdminOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isAdmin } = usePermissions();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
