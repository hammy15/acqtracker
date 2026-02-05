import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

export const stateReqsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        stateCode: z.string().optional(),
        facilityType: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "state-reqs:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view state requirements." });
      }

      const where: Record<string, unknown> = { orgId: user.orgId };

      if (input?.stateCode) where.stateCode = input.stateCode;
      if (input?.facilityType) where.facilityType = input.facilityType;
      if (input?.search) {
        where.OR = [
          { stateCode: { contains: input.search, mode: "insensitive" } },
          { licensingBody: { contains: input.search, mode: "insensitive" } },
          { notes: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const requirements = await db.stateRequirement.findMany({
        where: where as any,
        orderBy: [{ stateCode: "asc" }, { facilityType: "asc" }],
      });

      return requirements;
    }),

  getByState: protectedProcedure
    .input(
      z.object({
        stateCode: z.string().min(2).max(2),
        facilityType: z.enum(["SNF", "ALF", "ILF", "HOSPICE", "IN_HOME"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "state-reqs:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const requirement = await db.stateRequirement.findUnique({
        where: {
          orgId_stateCode_facilityType: {
            orgId: user.orgId,
            stateCode: input.stateCode.toUpperCase(),
            facilityType: input.facilityType as any,
          },
        },
      });

      if (!requirement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No requirements found for ${input.stateCode} / ${input.facilityType}.`,
        });
      }

      return requirement;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        stateCode: z.string().min(2).max(2),
        facilityType: z.enum(["SNF", "ALF", "ILF", "HOSPICE", "IN_HOME"]),
        licensingBody: z.string().optional(),
        licensingBodyUrl: z.string().url().optional(),
        contactInfo: z.record(z.string(), z.unknown()).optional(),
        chowFormUrl: z.string().url().optional(),
        requirementsChecklist: z.record(z.string(), z.unknown()).optional(),
        notificationsRequired: z.record(z.string(), z.unknown()).optional(),
        suretyBondRequired: z.boolean().optional(),
        suretyBondAmount: z.number().positive().optional(),
        conRequired: z.boolean().optional(),
        backgroundCheckRequired: z.boolean().optional(),
        processingTimelineDays: z.number().int().positive().optional(),
        adminLicenseReqs: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "state-reqs:update")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to update state requirements." });
      }

      const { stateCode, facilityType, ...data } = input;

      const requirement = await db.stateRequirement.upsert({
        where: {
          orgId_stateCode_facilityType: {
            orgId: user.orgId,
            stateCode: stateCode.toUpperCase(),
            facilityType: facilityType as any,
          },
        },
        update: {
          ...data,
          facilityType: undefined, // Don't update the unique key fields
          updatedById: user.id,
        } as any,
        create: {
          orgId: user.orgId,
          stateCode: stateCode.toUpperCase(),
          facilityType: facilityType as any,
          ...data,
          updatedById: user.id,
        } as any,
      });

      return requirement;
    }),
});
