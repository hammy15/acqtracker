/**
 * Shared permission types and role-permission mappings.
 * Safe to import from both client and server code (no DB dependency).
 */

export type Permission =
  | "deals:create"
  | "deals:read"
  | "deals:update"
  | "deals:delete"
  | "deals:archive"
  | "tasks:create"
  | "tasks:read"
  | "tasks:update"
  | "tasks:delete"
  | "tasks:assign"
  | "files:upload"
  | "files:read"
  | "files:delete"
  | "chat:read"
  | "chat:write"
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "users:manage-roles"
  | "buildings:create"
  | "buildings:read"
  | "buildings:update"
  | "buildings:delete"
  | "templates:create"
  | "templates:read"
  | "templates:update"
  | "templates:delete"
  | "reports:read"
  | "reports:export"
  | "activity:read"
  | "archive:read"
  | "archive:restore"
  | "ai:chat"
  | "ota:upload"
  | "ota:analyze"
  | "ota:read"
  | "org:settings";

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "REGIONAL_LEAD"
  | "DEAL_LEAD"
  | "DEPARTMENT_LEAD"
  | "TEAM_MEMBER"
  | "VIEWER";

const ALL_PERMISSIONS: Permission[] = [
  "deals:create",
  "deals:read",
  "deals:update",
  "deals:delete",
  "deals:archive",
  "tasks:create",
  "tasks:read",
  "tasks:update",
  "tasks:delete",
  "tasks:assign",
  "files:upload",
  "files:read",
  "files:delete",
  "chat:read",
  "chat:write",
  "users:read",
  "users:create",
  "users:update",
  "users:delete",
  "users:manage-roles",
  "buildings:create",
  "buildings:read",
  "buildings:update",
  "buildings:delete",
  "templates:create",
  "templates:read",
  "templates:update",
  "templates:delete",
  "reports:read",
  "reports:export",
  "activity:read",
  "archive:read",
  "archive:restore",
  "ai:chat",
  "ota:upload",
  "ota:analyze",
  "ota:read",
  "org:settings",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,

  ADMIN: ALL_PERMISSIONS,

  REGIONAL_LEAD: [
    "deals:create",
    "deals:read",
    "deals:update",
    "deals:archive",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
    "tasks:assign",
    "files:upload",
    "files:read",
    "files:delete",
    "chat:read",
    "chat:write",
    "users:read",
    "buildings:create",
    "buildings:read",
    "buildings:update",
    "templates:create",
    "templates:read",
    "templates:update",
    "reports:read",
    "reports:export",
    "activity:read",
    "archive:read",
    "archive:restore",
    "ai:chat",
    "ota:upload",
    "ota:analyze",
    "ota:read",
  ],

  DEAL_LEAD: [
    "deals:read",
    "deals:update",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
    "tasks:assign",
    "files:upload",
    "files:read",
    "files:delete",
    "chat:read",
    "chat:write",
    "users:read",
    "buildings:read",
    "buildings:update",
    "templates:read",
    "reports:read",
    "activity:read",
    "archive:read",
    "ai:chat",
    "ota:upload",
    "ota:analyze",
    "ota:read",
  ],

  DEPARTMENT_LEAD: [
    "deals:read",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:assign",
    "files:upload",
    "files:read",
    "chat:read",
    "chat:write",
    "users:read",
    "buildings:read",
    "templates:read",
    "reports:read",
    "activity:read",
    "ai:chat",
    "ota:read",
  ],

  TEAM_MEMBER: [
    "deals:read",
    "tasks:read",
    "tasks:update",
    "files:upload",
    "files:read",
    "chat:read",
    "chat:write",
    "users:read",
    "buildings:read",
    "templates:read",
    "activity:read",
    "ai:chat",
    "ota:read",
  ],

  VIEWER: [
    "deals:read",
    "tasks:read",
    "files:read",
    "chat:read",
    "users:read",
    "buildings:read",
    "templates:read",
    "reports:read",
    "activity:read",
    "archive:read",
    "ota:read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const roleKey = role as Role;
  const permissions = ROLE_PERMISSIONS[roleKey];
  if (!permissions) return false;
  return permissions.includes(permission);
}
