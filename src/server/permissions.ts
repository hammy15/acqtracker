import { db } from "./db";

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
  | "state-reqs:read"
  | "state-reqs:update"
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
  "state-reqs:read",
  "state-reqs:update",
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
    "state-reqs:read",
    "state-reqs:update",
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
    "state-reqs:read",
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
    "state-reqs:read",
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
    "state-reqs:read",
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
    "state-reqs:read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const roleKey = role as Role;
  const permissions = ROLE_PERMISSIONS[roleKey];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export async function canAccessDeal(
  userId: string,
  role: string,
  dealId: string,
): Promise<boolean> {
  // Super admins and admins can access all deals in their org
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return true;
  }

  // Regional leads can access deals in their region
  if (role === "REGIONAL_LEAD") {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { regionId: true },
    });
    if (user?.regionId) {
      const deal = await db.deal.findFirst({
        where: { id: dealId, regionId: user.regionId },
      });
      if (deal) return true;
    }
  }

  // Deal leads, department leads, and team members can access deals
  // they are the lead of or assigned to via building assignments
  const deal = await db.deal.findFirst({
    where: {
      id: dealId,
      OR: [
        { dealLeadId: userId },
        {
          buildingAssignments: {
            some: { userId, isActive: true },
          },
        },
      ],
    },
  });

  return deal !== null;
}

export async function getDealsScope(
  userId: string,
  role: string,
  orgId: string,
): Promise<{ where: Record<string, unknown> }> {
  // Super admins and admins see all deals in their org
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return {
      where: { orgId },
    };
  }

  // Regional leads see deals in their region
  if (role === "REGIONAL_LEAD") {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { regionId: true },
    });
    if (user?.regionId) {
      return {
        where: {
          orgId,
          OR: [
            { regionId: user.regionId },
            { dealLeadId: userId },
            {
              buildingAssignments: {
                some: { userId, isActive: true },
              },
            },
          ],
        },
      };
    }
  }

  // Deal leads, department leads, team members, and viewers
  // only see deals they lead or are assigned to
  return {
    where: {
      orgId,
      OR: [
        { dealLeadId: userId },
        {
          buildingAssignments: {
            some: { userId, isActive: true },
          },
        },
      ],
    },
  };
}
