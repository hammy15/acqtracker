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

export const filesRouter = router({
  listByDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        taskId: z.string().optional(),
        isPhoto: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this deal." });
      }

      if (!hasPermission(user.role, "files:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view files." });
      }

      const where: Record<string, unknown> = { dealId: input.dealId };

      if (input.taskId) where.taskId = input.taskId;
      if (input.isPhoto !== undefined) where.isPhoto = input.isPhoto;
      if (input.search) {
        where.fileName = { contains: input.search, mode: "insensitive" };
      }

      const files = await db.taskFile.findMany({
        where: where as any,
        include: {
          uploadedBy: { select: userSelect },
          task: { select: { id: true, title: true, workstream: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return files;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await db.taskFile.findUnique({
        where: { id: input.id },
        include: {
          uploadedBy: { select: userSelect },
          task: { select: { id: true, title: true, workstream: true } },
          deal: { select: { id: true, name: true, facilityName: true } },
        },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found." });
      }

      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, file.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return file;
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "files:upload")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to upload files." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // TODO: Replace with actual S3 pre-signed URL generation
      const key = `uploads/${input.dealId}/${Date.now()}-${input.fileName}`;
      const uploadUrl = `https://s3.amazonaws.com/acqtracker-uploads/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600`;

      return {
        uploadUrl,
        key,
        filePath: key,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        taskId: z.string().optional(),
        fileName: z.string().min(1),
        filePath: z.string().min(1),
        fileType: z.string().min(1),
        fileSize: z.number().int().positive(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPhoto: z.boolean().default(false),
        gpsLat: z.number().optional(),
        gpsLon: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "files:upload")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to upload files." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const file = await db.taskFile.create({
        data: {
          dealId: input.dealId,
          taskId: input.taskId,
          fileName: input.fileName,
          filePath: input.filePath,
          fileType: input.fileType,
          fileSize: input.fileSize,
          uploadedById: user.id,
          description: input.description,
          tags: input.tags ?? [],
          isPhoto: input.isPhoto,
          gpsLat: input.gpsLat,
          gpsLon: input.gpsLon,
        },
        include: {
          uploadedBy: { select: userSelect },
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          action: "FILE_UPLOADED" as any,
          entityType: "TaskFile",
          entityId: file.id,
          newValue: { fileName: file.fileName, fileType: file.fileType, taskId: input.taskId },
        },
      });

      return file;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "files:delete")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to delete files." });
      }

      const file = await db.taskFile.findUnique({
        where: { id: input.id },
        select: { dealId: true, fileName: true },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, file.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.taskFile.delete({ where: { id: input.id } });

      await db.activityLog.create({
        data: {
          dealId: file.dealId,
          userId: user.id,
          action: "FILE_DELETED" as any,
          entityType: "TaskFile",
          entityId: input.id,
          oldValue: { fileName: file.fileName },
        },
      });

      return { success: true };
    }),
});
