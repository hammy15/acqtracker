import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { getDealsScope, hasPermission, canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const dealsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        regionId: z.string().optional(),
        facilityType: z.string().optional(),
        state: z.string().optional(),
        dealLeadId: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const scope = await getDealsScope(user.id, user.role, user.orgId);
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? DEFAULT_PAGE_SIZE;

      const where: Record<string, unknown> = {
        ...scope.where,
        status: { not: "ARCHIVED" },
      };

      if (input?.status) {
        where.status = input.status;
      }
      if (input?.regionId) {
        where.regionId = input.regionId;
      }
      if (input?.facilityType) {
        where.facilityType = input.facilityType;
      }
      if (input?.state) {
        where.state = input.state;
      }
      if (input?.dealLeadId) {
        where.dealLeadId = input.dealLeadId;
      }
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
            _count: { select: { tasks: true, taskFiles: true, buildingAssignments: true } },
            tasks: {
              select: { status: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.deal.count({ where: where as any }),
      ]);

      return {
        deals: deals.map((deal) => {
          const totalTasks = deal.tasks.length;
          const completedTasks = deal.tasks.filter((t) => t.status === "COMPLETE").length;
          const blockedTasks = deal.tasks.filter((t) => t.status === "BLOCKED").length;
          return {
            ...deal,
            tasks: undefined,
            _taskStats: {
              total: totalTasks,
              completed: completedTasks,
              blocked: blockedTasks,
              progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            },
          };
        }),
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
      const canAccess = await canAccessDeal(user.id, user.role, input.id);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this deal." });
      }

      const deal = await db.deal.findUnique({
        where: { id: input.id },
        include: {
          dealLead: { select: userSelect },
          region: { select: { id: true, name: true, states: true } },
          template: { select: { id: true, name: true, templateType: true } },
          buildingAssignments: {
            where: { isActive: true },
            include: { user: { select: userSelect } },
          },
          _count: {
            select: {
              tasks: true,
              taskFiles: true,
              chatChannels: true,
              feedPosts: true,
              dueDiligenceDocs: true,
            },
          },
          tasks: {
            select: { status: true, phase: true, workstream: true },
          },
        },
      });

      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found." });
      }

      const totalTasks = deal.tasks.length;
      const completedTasks = deal.tasks.filter((t) => t.status === "COMPLETE").length;
      const blockedTasks = deal.tasks.filter((t) => t.status === "BLOCKED").length;

      const phaseStats = deal.tasks.reduce(
        (acc, t) => {
          if (!acc[t.phase]) acc[t.phase] = { total: 0, completed: 0 };
          acc[t.phase].total++;
          if (t.status === "COMPLETE") acc[t.phase].completed++;
          return acc;
        },
        {} as Record<string, { total: number; completed: number }>
      );

      const workstreamStats = deal.tasks.reduce(
        (acc, t) => {
          if (!acc[t.workstream]) acc[t.workstream] = { total: 0, completed: 0 };
          acc[t.workstream].total++;
          if (t.status === "COMPLETE") acc[t.workstream].completed++;
          return acc;
        },
        {} as Record<string, { total: number; completed: number }>
      );

      return {
        ...deal,
        tasks: undefined,
        _taskStats: {
          total: totalTasks,
          completed: completedTasks,
          blocked: blockedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          byPhase: phaseStats,
          byWorkstream: workstreamStats,
        },
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        facilityName: z.string().min(1),
        facilityType: z.enum(["SNF", "ALF", "ILF", "HOSPICE", "IN_HOME"]),
        state: z.string().min(2).max(2),
        address: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        bedCount: z.number().int().positive().optional(),
        currentOwner: z.string().optional(),
        purchasePrice: z.number().positive().optional(),
        targetCloseDate: z.string().datetime().optional(),
        dealLeadId: z.string().optional(),
        regionId: z.string().optional(),
        templateId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "deals:create")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to create deals." });
      }

      const deal = await db.deal.create({
        data: {
          orgId: user.orgId,
          name: input.name,
          facilityName: input.facilityName,
          facilityType: input.facilityType as any,
          state: input.state,
          address: input.address,
          city: input.city,
          zipCode: input.zipCode,
          bedCount: input.bedCount,
          currentOwner: input.currentOwner,
          purchasePrice: input.purchasePrice,
          targetCloseDate: input.targetCloseDate ? new Date(input.targetCloseDate) : undefined,
          dealLeadId: input.dealLeadId,
          regionId: input.regionId,
          templateId: input.templateId,
        },
      });

      // If a template is assigned, instantiate template tasks
      if (input.templateId) {
        const templateTasks = await db.templateTask.findMany({
          where: { templateId: input.templateId },
          orderBy: { sortOrder: "asc" },
        });

        if (templateTasks.length > 0) {
          const templateTaskIdMap = new Map<string, string>();

          for (const tt of templateTasks) {
            const task = await db.task.create({
              data: {
                dealId: deal.id,
                templateTaskId: tt.id,
                title: tt.title,
                description: tt.description,
                workstream: tt.workstream,
                section: tt.section,
                phase: tt.phase as any,
                sortOrder: tt.sortOrder,
                indentLevel: tt.indentLevel,
                parentTaskId: tt.parentTaskId ? templateTaskIdMap.get(tt.parentTaskId) : undefined,
                dueDate: input.targetCloseDate
                  ? new Date(new Date(input.targetCloseDate).getTime() + tt.daysOffset * 86400000)
                  : undefined,
              },
            });
            templateTaskIdMap.set(tt.id, task.id);
          }
        }
      }

      // Create default chat channels
      const channels = ["general", "clinical", "regulatory", "facilities"];
      await db.chatChannel.createMany({
        data: channels.map((name) => ({
          dealId: deal.id,
          name,
          channelType: "AUTO" as any,
        })),
      });

      // Log activity
      await db.activityLog.create({
        data: {
          dealId: deal.id,
          userId: user.id,
          action: "DEAL_CREATED" as any,
          entityType: "Deal",
          entityId: deal.id,
          newValue: { name: deal.name, status: deal.status },
        },
      });

      return deal;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        facilityName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        bedCount: z.number().int().positive().optional(),
        currentOwner: z.string().optional(),
        purchasePrice: z.number().positive().optional(),
        targetCloseDate: z.string().datetime().nullable().optional(),
        dealLeadId: z.string().nullable().optional(),
        regionId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "deals:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const canAccess = await canAccessDeal(user.id, user.role, input.id);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, targetCloseDate, ...rest } = input;

      return db.deal.update({
        where: { id },
        data: {
          ...rest,
          targetCloseDate: targetCloseDate === null ? null : targetCloseDate ? new Date(targetCloseDate) : undefined,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "PIPELINE", "LOI", "DUE_DILIGENCE", "CHOW_FILED", "CLOSING",
          "TRANSITION_DAY", "WEEK_1", "WEEK_2", "POST_CLOSE",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "deals:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const canAccess = await canAccessDeal(user.id, user.role, input.id);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.deal.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const data: Record<string, unknown> = { status: input.status };

      if (input.status === "TRANSITION_DAY" && !existing.transitionDayStartedAt) {
        data.transitionDayStartedAt = new Date();
      }

      const updated = await db.deal.update({ where: { id: input.id }, data: data as any });

      await db.activityLog.create({
        data: {
          dealId: input.id,
          userId: user.id,
          action: "DEAL_STATUS_CHANGED" as any,
          entityType: "Deal",
          entityId: input.id,
          oldValue: { status: existing.status },
          newValue: { status: input.status },
        },
      });

      return updated;
    }),

  archive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "deals:archive")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const deal = await db.deal.update({
        where: { id: input.id },
        data: {
          status: "ARCHIVED" as any,
          archivedAt: new Date(),
          archivedBy: user.id,
          archiveNotes: input.notes,
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.id,
          userId: user.id,
          action: "DEAL_ARCHIVED" as any,
          entityType: "Deal",
          entityId: input.id,
        },
      });

      return deal;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "deals:delete")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.deal.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;
    const scope = await getDealsScope(user.id, user.role, user.orgId);

    const deals = await db.deal.findMany({
      where: scope.where as any,
      select: { status: true },
    });

    const statusCounts = deals.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: deals.length,
      active: deals.filter((d) => d.status !== "ARCHIVED").length,
      byStatus: statusCounts,
    };
  }),
});
