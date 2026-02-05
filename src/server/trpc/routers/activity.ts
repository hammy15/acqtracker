import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal, getDealsScope } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const activityRouter = router({
  listByDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "activity:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view activity." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const where: Record<string, unknown> = { dealId: input.dealId };

      if (input.action) where.action = input.action;
      if (input.entityType) where.entityType = input.entityType;

      const logs = await db.activityLog.findMany({
        where: where as any,
        include: {
          user: { select: userSelect },
          deal: { select: { id: true, name: true, facilityName: true } },
        },
        orderBy: { timestamp: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? {
              cursor: { id: input.cursor },
              skip: 1,
            }
          : {}),
      });

      let nextCursor: string | undefined;
      if (logs.length > input.limit) {
        const next = logs.pop();
        nextCursor = next?.id;
      }

      return {
        logs,
        nextCursor,
      };
    }),

  listRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().optional(),
        action: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "activity:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const limit = input?.limit ?? 25;
      const scope = await getDealsScope(user.id, user.role, user.orgId);

      // Get IDs of accessible deals
      const accessibleDeals = await db.deal.findMany({
        where: scope.where as any,
        select: { id: true },
      });

      const dealIds = accessibleDeals.map((d) => d.id);

      if (dealIds.length === 0) {
        return { logs: [], nextCursor: undefined };
      }

      const where: Record<string, unknown> = {
        dealId: { in: dealIds },
      };

      if (input?.action) where.action = input.action;

      const logs = await db.activityLog.findMany({
        where: where as any,
        include: {
          user: { select: userSelect },
          deal: { select: { id: true, name: true, facilityName: true, status: true } },
        },
        orderBy: { timestamp: "desc" },
        take: limit + 1,
        ...(input?.cursor
          ? {
              cursor: { id: input.cursor },
              skip: 1,
            }
          : {}),
      });

      let nextCursor: string | undefined;
      if (logs.length > limit) {
        const next = logs.pop();
        nextCursor = next?.id;
      }

      return {
        logs,
        nextCursor,
      };
    }),
});
