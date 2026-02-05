import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const buildingsRouter = router({
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "buildings:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view building assignments." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const assignments = await db.buildingAssignment.findMany({
        where: { dealId: input.dealId },
        include: {
          user: {
            select: {
              ...userSelect,
              phone: true,
              regionId: true,
            },
          },
        },
        orderBy: [{ onSiteRole: "asc" }, { assignedAt: "asc" }],
      });

      return assignments;
    }),

  assign: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        userId: z.string(),
        onSiteRole: z.enum(["BUILDING_LEAD", "TEAM_MEMBER"]).default("TEAM_MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "buildings:create") && !hasPermission(user.role, "buildings:update")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to assign users to buildings." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify the target user is in the same org
      const targetUser = await db.user.findUnique({
        where: { id: input.userId },
        select: { orgId: true },
      });

      if (!targetUser || targetUser.orgId !== user.orgId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not found in your organization." });
      }

      const assignment = await db.buildingAssignment.upsert({
        where: {
          dealId_userId: {
            dealId: input.dealId,
            userId: input.userId,
          },
        },
        update: {
          onSiteRole: input.onSiteRole as any,
          isActive: true,
          assignedById: user.id,
        },
        create: {
          dealId: input.dealId,
          userId: input.userId,
          onSiteRole: input.onSiteRole as any,
          assignedById: user.id,
        },
        include: {
          user: { select: userSelect },
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          action: "USER_ASSIGNED_TO_BUILDING" as any,
          entityType: "BuildingAssignment",
          entityId: assignment.id,
          newValue: { userId: input.userId, onSiteRole: input.onSiteRole },
        },
      });

      return assignment;
    }),

  unassign: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "buildings:delete") && !hasPermission(user.role, "buildings:update")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to remove building assignments." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.buildingAssignment.findUnique({
        where: {
          dealId_userId: {
            dealId: input.dealId,
            userId: input.userId,
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Building assignment not found." });
      }

      // Soft-deactivate
      await db.buildingAssignment.update({
        where: { id: existing.id },
        data: { isActive: false },
      });

      await db.activityLog.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          action: "BUILDING_ASSIGNMENT_CHANGED" as any,
          entityType: "BuildingAssignment",
          entityId: existing.id,
          oldValue: { userId: input.userId, isActive: true },
          newValue: { userId: input.userId, isActive: false },
        },
      });

      return { success: true };
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        userId: z.string(),
        onSiteRole: z.enum(["BUILDING_LEAD", "TEAM_MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "buildings:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.buildingAssignment.findUnique({
        where: {
          dealId_userId: {
            dealId: input.dealId,
            userId: input.userId,
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Building assignment not found." });
      }

      const updated = await db.buildingAssignment.update({
        where: { id: existing.id },
        data: { onSiteRole: input.onSiteRole as any },
        include: {
          user: { select: userSelect },
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          action: "BUILDING_ASSIGNMENT_CHANGED" as any,
          entityType: "BuildingAssignment",
          entityId: existing.id,
          oldValue: { onSiteRole: existing.onSiteRole },
          newValue: { onSiteRole: input.onSiteRole },
        },
      });

      return updated;
    }),
});
