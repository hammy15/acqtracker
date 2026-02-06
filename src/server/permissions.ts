import { db } from "./db";

// Re-export shared types and constants so existing server imports continue to work
export {
  type Permission,
  type Role,
  ROLE_PERMISSIONS,
  hasPermission,
} from "@/lib/permissions";

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
