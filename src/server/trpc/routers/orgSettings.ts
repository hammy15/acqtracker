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
});
