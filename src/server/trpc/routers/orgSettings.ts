import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

export const orgSettingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;

    // Get or create settings for this org
    let settings = await db.orgSettings.findUnique({
      where: { orgId: user.orgId },
    });

    if (!settings) {
      settings = await db.orgSettings.create({
        data: {
          orgId: user.orgId,
          customWorkstreams: [
            { id: "ws-1", label: "Clinical Operations", color: "#14b8a6", isDefault: true, isActive: true },
            { id: "ws-2", label: "Regulatory & Compliance", color: "#f59e0b", isDefault: true, isActive: true },
            { id: "ws-3", label: "Financial", color: "#3b82f6", isDefault: true, isActive: true },
            { id: "ws-4", label: "Physical Plant", color: "#8b5cf6", isDefault: true, isActive: true },
            { id: "ws-5", label: "HR & Staffing", color: "#ef4444", isDefault: true, isActive: true },
            { id: "ws-6", label: "IT & Systems", color: "#06b6d4", isDefault: true, isActive: true },
            { id: "ws-7", label: "Legal", color: "#6366f1", isDefault: true, isActive: true },
            { id: "ws-8", label: "Site Security", color: "#64748b", isDefault: true, isActive: true },
            { id: "ws-9", label: "Photography", color: "#ec4899", isDefault: true, isActive: true },
          ],
          customFacilityTypes: [
            { id: "ft-1", label: "SNF", color: "#14b8a6", isDefault: true, isActive: true },
            { id: "ft-2", label: "ALF", color: "#3b82f6", isDefault: true, isActive: true },
            { id: "ft-3", label: "ILF", color: "#8b5cf6", isDefault: true, isActive: true },
            { id: "ft-4", label: "Hospice", color: "#f59e0b", isDefault: true, isActive: true },
            { id: "ft-5", label: "In-Home", color: "#ef4444", isDefault: true, isActive: true },
            { id: "ft-6", label: "Memory Care", color: "#ec4899", isDefault: true, isActive: true },
            { id: "ft-7", label: "CCRC", color: "#06b6d4", isDefault: true, isActive: true },
          ],
          customTaskPhases: [
            { id: "tp-1", label: "Pre-Close", color: "#f59e0b", isDefault: true, isActive: true },
            { id: "tp-2", label: "Day Of", color: "#ef4444", isDefault: true, isActive: true },
            { id: "tp-3", label: "Week 1", color: "#14b8a6", isDefault: true, isActive: true },
            { id: "tp-4", label: "Week 2", color: "#3b82f6", isDefault: true, isActive: true },
            { id: "tp-5", label: "Post-Close", color: "#8b5cf6", isDefault: true, isActive: true },
          ],
          customDealStatuses: [
            { id: "ds-1", label: "Pipeline", color: "#94a3b8", isDefault: true, isActive: true },
            { id: "ds-2", label: "LOI", color: "#3b82f6", isDefault: true, isActive: true },
            { id: "ds-3", label: "Due Diligence", color: "#f59e0b", isDefault: true, isActive: true },
            { id: "ds-4", label: "CHOW Filed", color: "#14b8a6", isDefault: true, isActive: true },
            { id: "ds-5", label: "Closing", color: "#22c55e", isDefault: true, isActive: true },
            { id: "ds-6", label: "Transition Day", color: "#06b6d4", isDefault: true, isActive: true },
            { id: "ds-7", label: "Week 1", color: "#14b8a6", isDefault: true, isActive: true },
            { id: "ds-8", label: "Week 2", color: "#0d9488", isDefault: true, isActive: true },
            { id: "ds-9", label: "Post-Close", color: "#6366f1", isDefault: true, isActive: true },
          ],
          customRoles: [
            { id: "r-1", label: "Building Lead", color: "#14b8a6", isDefault: true, isActive: true },
            { id: "r-2", label: "Clinical Lead", color: "#ef4444", isDefault: true, isActive: true },
            { id: "r-3", label: "Regulatory Lead", color: "#f59e0b", isDefault: true, isActive: true },
            { id: "r-4", label: "Financial Lead", color: "#3b82f6", isDefault: true, isActive: true },
            { id: "r-5", label: "IT Lead", color: "#06b6d4", isDefault: true, isActive: true },
            { id: "r-6", label: "HR Lead", color: "#8b5cf6", isDefault: true, isActive: true },
            { id: "r-7", label: "Team Member", color: "#64748b", isDefault: true, isActive: true },
          ],
        },
      });
    }

    return settings;
  }),

  update: protectedProcedure
    .input(
      z.object({
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        emailNotifications: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
        weeklyReport: z.boolean().optional(),
        transitionAlerts: z.boolean().optional(),
        sessionTimeoutMinutes: z.number().min(15).max(480).optional(),
        require2fa: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "org:settings")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You need admin access to change organization settings.",
        });
      }

      return db.orgSettings.upsert({
        where: { orgId: user.orgId },
        create: { orgId: user.orgId, ...input, updatedById: user.id },
        update: { ...input, updatedById: user.id },
      });
    }),

  updateCustomList: protectedProcedure
    .input(
      z.object({
        field: z.enum([
          "customWorkstreams",
          "customFacilityTypes",
          "customTaskPhases",
          "customDealStatuses",
          "customRoles",
        ]),
        items: z.array(
          z.object({
            id: z.string(),
            label: z.string().min(1),
            color: z.string().optional(),
            icon: z.string().optional(),
            isDefault: z.boolean().default(false),
            isActive: z.boolean().default(true),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "org:settings")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required.",
        });
      }

      return db.orgSettings.upsert({
        where: { orgId: user.orgId },
        create: {
          orgId: user.orgId,
          [input.field]: input.items as any,
          updatedById: user.id,
        },
        update: {
          [input.field]: input.items as any,
          updatedById: user.id,
        },
      });
    }),

  // ── Admin Data Management ─────────────────────────────────────────

  /** Get data counts for admin panel */
  getDataCounts: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const [deals, tasks, templates, users, files, otaDocs, aiConversations, activityLogs] =
      await Promise.all([
        db.deal.count({ where: { orgId: user.orgId } }),
        db.task.count({ where: { deal: { orgId: user.orgId } } }),
        db.template.count({ where: { orgId: user.orgId } }),
        db.user.count({ where: { orgId: user.orgId } }),
        db.taskFile.count({ where: { task: { deal: { orgId: user.orgId } } } }),
        db.otaDocument.count({ where: { deal: { orgId: user.orgId } } }),
        db.aiConversation.count({ where: { orgId: user.orgId } }),
        db.activityLog.count({ where: { deal: { orgId: user.orgId } } }),
      ]);

    return { deals, tasks, templates, users, files, otaDocs, aiConversations, activityLogs };
  }),

  /** List all deals for admin management */
  listDealsForAdmin: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return db.deal.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true,
        name: true,
        facilityName: true,
        status: true,
        facilityType: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Delete a specific deal and all related data */
  deleteDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify deal belongs to org
      const deal = await db.deal.findFirst({
        where: { id: input.dealId, orgId: user.orgId },
      });
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      await db.deal.delete({ where: { id: input.dealId } });
      return { success: true, name: deal.name };
    }),

  /** Purge all content (deals, tasks, templates, AI, activity) but keep users and org */
  purgeAllContent: protectedProcedure
    .input(z.object({ confirm: z.literal("DELETE_ALL_CONTENT") }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (user.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Super Admins can purge all content.",
        });
      }

      // Delete in dependency order
      await db.aiMessage.deleteMany({ where: { conversation: { orgId: user.orgId } } });
      await db.aiConversation.deleteMany({ where: { orgId: user.orgId } });
      await db.activityLog.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.userPresence.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.buildingAssignment.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.feedPost.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.chatMessage.deleteMany({ where: { channel: { deal: { orgId: user.orgId } } } });
      await db.chatChannel.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.otaAnalysis.deleteMany({ where: { otaDocument: { deal: { orgId: user.orgId } } } });
      await db.otaDocument.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.dueDiligenceDoc.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.taskComment.deleteMany({ where: { task: { deal: { orgId: user.orgId } } } });
      await db.taskFile.deleteMany({ where: { task: { deal: { orgId: user.orgId } } } });
      await db.task.deleteMany({ where: { deal: { orgId: user.orgId } } });
      await db.deal.deleteMany({ where: { orgId: user.orgId } });
      await db.templateTask.deleteMany({ where: { template: { orgId: user.orgId } } });
      await db.template.deleteMany({ where: { orgId: user.orgId } });

      return { success: true };
    }),
});
