import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const usersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        regionId: z.string().optional(),
        isActive: z.boolean().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "users:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view users." });
      }

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? DEFAULT_PAGE_SIZE;

      const where: Record<string, unknown> = { orgId: user.orgId };

      if (input?.role) where.role = input.role;
      if (input?.regionId) where.regionId = input.regionId;
      if (input?.isActive !== undefined) where.isActive = input.isActive;
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where: where as any,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            avatar: true,
            regionId: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            region: { select: { id: true, name: true } },
            _count: {
              select: {
                assignedTasks: true,
                completedTasks: true,
                ledDeals: true,
                buildingAssignments: true,
              },
            },
          },
          orderBy: { name: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.user.count({ where: where as any }),
      ]);

      return {
        users,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "users:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const targetUser = await db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatar: true,
          regionId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          region: { select: { id: true, name: true } },
          ledDeals: {
            select: { id: true, name: true, facilityName: true, status: true },
            where: { status: { not: "ARCHIVED" as any } },
            orderBy: { updatedAt: "desc" },
          },
          buildingAssignments: {
            where: { isActive: true },
            include: {
              deal: { select: { id: true, name: true, facilityName: true, status: true } },
            },
          },
          _count: {
            select: {
              assignedTasks: true,
              completedTasks: true,
              ledDeals: true,
              uploadedFiles: true,
            },
          },
        },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (targetUser.id !== user.id) {
        // Only same-org users can view each other
        const fullUser = await db.user.findUnique({
          where: { id: input.id },
          select: { orgId: true },
        });
        if (fullUser?.orgId !== user.orgId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      return targetUser;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        phone: z.string().nullable().optional(),
        role: z.enum(["SUPER_ADMIN", "ADMIN", "REGIONAL_LEAD", "DEAL_LEAD", "DEPARTMENT_LEAD", "TEAM_MEMBER", "VIEWER"]).optional(),
        regionId: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // Users can update their own name and phone
      const isSelf = input.id === user.id;
      const isRoleChange = input.role !== undefined;
      const isActiveChange = input.isActive !== undefined;

      if (isRoleChange && !hasPermission(user.role, "users:manage-roles")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to change user roles." });
      }

      if (!isSelf && !hasPermission(user.role, "users:update")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to update other users." });
      }

      const existing = await db.user.findUnique({
        where: { id: input.id },
        select: { orgId: true },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, ...rest } = input;

      const updated = await db.user.update({
        where: { id },
        data: {
          ...rest,
          role: rest.role ? (rest.role as any) : undefined,
        } as any,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatar: true,
          regionId: true,
          isActive: true,
          region: { select: { id: true, name: true } },
        },
      });

      return updated;
    }),

  registerPushToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // NOTE: The Prisma User model does not have pushToken / pushPlatform
      // columns yet. For now we log the token so it can be verified during
      // development. When the schema is updated, replace the console.log
      // below with a db.user.update call:
      //
      //   await db.user.update({
      //     where: { id: user.id },
      //     data: { pushToken: input.token, pushPlatform: input.platform },
      //   });

      console.log(
        `[PushNotifications] Token registered for user ${user.id} (${user.email}):`,
        { token: input.token, platform: input.platform },
      );

      return { success: true };
    }),

  getTeamForDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const deal = await db.deal.findUnique({
        where: { id: input.dealId },
        select: {
          dealLeadId: true,
          dealLead: { select: userSelect },
          buildingAssignments: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  ...userSelect,
                  phone: true,
                  regionId: true,
                },
              },
            },
          },
        },
      });

      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      // Get users with tasks assigned to this deal
      const assignedUsers = await db.task.findMany({
        where: { dealId: input.dealId, assignedToId: { not: null } },
        select: { assignedToId: true },
        distinct: ["assignedToId"],
      });

      const assignedUserIds = assignedUsers
        .map((t) => t.assignedToId)
        .filter((id): id is string => id !== null);

      // Collect all unique user IDs
      const teamUserIds = new Set<string>();
      if (deal.dealLeadId) teamUserIds.add(deal.dealLeadId);
      deal.buildingAssignments.forEach((ba) => teamUserIds.add(ba.userId));
      assignedUserIds.forEach((id) => teamUserIds.add(id));

      const teamUsers = await db.user.findMany({
        where: { id: { in: Array.from(teamUserIds) } },
        select: {
          ...userSelect,
          phone: true,
          _count: {
            select: {
              assignedTasks: { where: { dealId: input.dealId } },
              completedTasks: { where: { dealId: input.dealId } },
            },
          },
        },
      });

      return {
        dealLead: deal.dealLead,
        buildingAssignments: deal.buildingAssignments,
        teamMembers: teamUsers,
      };
    }),
});
