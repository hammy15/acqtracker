import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, getDealsScope } from "@/server/permissions";
import { TRPCError } from "@trpc/server";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const archiveRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        facilityType: z.string().optional(),
        state: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "archive:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view the archive." });
      }

      const scope = await getDealsScope(user.id, user.role, user.orgId);
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? DEFAULT_PAGE_SIZE;

      const where: Record<string, unknown> = {
        ...scope.where,
        status: "ARCHIVED",
      };

      if (input?.facilityType) where.facilityType = input.facilityType;
      if (input?.state) where.state = input.state;
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { facilityName: { contains: input.search, mode: "insensitive" } },
          { city: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [deals, total] = await Promise.all([
        db.deal.findMany({
          where: where as any,
          include: {
            dealLead: { select: userSelect },
            region: { select: { id: true, name: true } },
            _count: { select: { tasks: true, taskFiles: true } },
          },
          orderBy: { archivedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.deal.count({ where: where as any }),
      ]);

      return {
        deals,
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
      if (!hasPermission(user.role, "archive:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const deal = await db.deal.findUnique({
        where: { id: input.id },
        include: {
          dealLead: { select: userSelect },
          region: { select: { id: true, name: true, states: true } },
          template: { select: { id: true, name: true, templateType: true } },
          buildingAssignments: {
            include: { user: { select: userSelect } },
          },
          _count: {
            select: {
              tasks: true,
              taskFiles: true,
              chatChannels: true,
              feedPosts: true,
              activityLogs: true,
            },
          },
          tasks: {
            select: { status: true, phase: true, workstream: true },
          },
        },
      });

      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Archived deal not found." });
      }

      if (deal.status !== "ARCHIVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This deal is not archived." });
      }

      if (deal.orgId !== user.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const totalTasks = deal.tasks.length;
      const completedTasks = deal.tasks.filter((t) => t.status === "COMPLETE").length;

      return {
        ...deal,
        tasks: undefined,
        _taskStats: {
          total: totalTasks,
          completed: completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      };
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "archive:restore")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to restore archived deals." });
      }

      const deal = await db.deal.findUnique({
        where: { id: input.id },
        select: { orgId: true, status: true },
      });

      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
      if (deal.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });
      if (deal.status !== "ARCHIVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This deal is not archived." });
      }

      const restored = await db.deal.update({
        where: { id: input.id },
        data: {
          status: "POST_CLOSE" as any,
          archivedAt: null,
          archivedBy: null,
          archiveNotes: null,
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.id,
          userId: user.id,
          action: "DEAL_STATUS_CHANGED" as any,
          entityType: "Deal",
          entityId: input.id,
          oldValue: { status: "ARCHIVED" },
          newValue: { status: "POST_CLOSE" },
        },
      });

      return restored;
    }),
});
