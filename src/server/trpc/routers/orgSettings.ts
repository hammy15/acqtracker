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
        data: { orgId: user.orgId },
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
