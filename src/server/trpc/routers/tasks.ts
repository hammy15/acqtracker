import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";
import {
  sendTaskAssignmentNotification,
  sendTaskBlockedNotification,
} from "@/server/email/send";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const tasksRouter = router({
  listByDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        phase: z.string().optional(),
        workstream: z.string().optional(),
        status: z.string().optional(),
        assignedToId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const where: Record<string, unknown> = { dealId: input.dealId };

      if (input.phase) where.phase = input.phase;
      if (input.workstream) where.workstream = input.workstream;
      if (input.status) where.status = input.status;
      if (input.assignedToId) where.assignedToId = input.assignedToId;
      if (input.search) {
        where.title = { contains: input.search, mode: "insensitive" };
      }

      const tasks = await db.task.findMany({
        where: where as any,
        include: {
          assignedTo: { select: userSelect },
          completedBy: { select: userSelect },
          _count: { select: { files: true, comments: true, childTasks: true } },
        },
        orderBy: [{ workstream: "asc" }, { sortOrder: "asc" }],
      });

      return tasks;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await db.task.findUnique({
        where: { id: input.id },
        include: {
          assignedTo: { select: userSelect },
          completedBy: { select: userSelect },
          deal: { select: { id: true, name: true, facilityName: true, status: true } },
          files: {
            include: { uploadedBy: { select: userSelect } },
            orderBy: { createdAt: "desc" },
          },
          comments: {
            where: { parentCommentId: null },
            include: {
              user: { select: userSelect },
              replies: {
                include: { user: { select: userSelect } },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          childTasks: {
            include: { assignedTo: { select: userSelect } },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, task.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return task;
    }),

  create: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        workstream: z.string(),
        section: z.string().optional(),
        phase: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).default("PRE_CLOSE"),
        assignedToId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
        parentTaskId: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "tasks:create")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Auto-calculate sortOrder if not provided
      let sortOrder = input.sortOrder;
      if (sortOrder === undefined) {
        const lastTask = await db.task.findFirst({
          where: { dealId: input.dealId, workstream: input.workstream },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        sortOrder = (lastTask?.sortOrder ?? 0) + 1;
      }

      const task = await db.task.create({
        data: {
          dealId: input.dealId,
          title: input.title,
          description: input.description,
          workstream: input.workstream,
          section: input.section,
          phase: input.phase as any,
          assignedToId: input.assignedToId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          priority: input.priority as any,
          parentTaskId: input.parentTaskId,
          sortOrder,
        },
        include: {
          assignedTo: { select: userSelect },
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          action: "TASK_CREATED" as any,
          entityType: "Task",
          entityId: task.id,
          newValue: { title: task.title, workstream: task.workstream },
        },
      });

      // Fire-and-forget: notify assignee if task was assigned on creation
      if (input.assignedToId) {
        void sendTaskAssignmentNotification(task.id, input.assignedToId);
      }

      return task;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "UNDER_REVIEW", "WAITING", "BLOCKED", "COMPLETE", "NA"]),
        flagReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "tasks:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.task.findUnique({
        where: { id: input.id },
        select: { dealId: true, status: true, title: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const canAccess = await canAccessDeal(user.id, user.role, existing.dealId);
      if (!canAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const data: Record<string, unknown> = { status: input.status };

      if (input.status === "COMPLETE") {
        data.completedDate = new Date();
        data.completedById = user.id;
        data.flagReason = null;
      } else if (input.status === "BLOCKED") {
        data.flagReason = input.flagReason || "Blocked — no reason provided";
      } else {
        data.completedDate = null;
        data.completedById = null;
        data.flagReason = null;
      }

      const updated = await db.task.update({
        where: { id: input.id },
        data: data as any,
        include: { assignedTo: { select: userSelect } },
      });

      // Log appropriate activity
      let action: string;
      if (input.status === "COMPLETE") {
        action = "TASK_COMPLETED";
      } else if (input.status === "BLOCKED") {
        action = "TASK_FLAGGED";
      } else {
        action = "TASK_STATUS_CHANGED";
      }

      await db.activityLog.create({
        data: {
          dealId: existing.dealId,
          userId: user.id,
          action: action as any,
          entityType: "Task",
          entityId: input.id,
          oldValue: { status: existing.status },
          newValue: { status: input.status, flagReason: input.flagReason },
        },
      });

      // Fire-and-forget: notify deal lead when a task is blocked
      if (input.status === "BLOCKED") {
        void sendTaskBlockedNotification(input.id);
      }

      return updated;
    }),

  assign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "tasks:assign")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.task.findUnique({
        where: { id: input.id },
        select: { dealId: true, assignedToId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await db.task.update({
        where: { id: input.id },
        data: { assignedToId: input.assignedToId },
        include: { assignedTo: { select: userSelect } },
      });

      await db.activityLog.create({
        data: {
          dealId: existing.dealId,
          userId: user.id,
          action: "TASK_ASSIGNED" as any,
          entityType: "Task",
          entityId: input.id,
          oldValue: { assignedToId: existing.assignedToId },
          newValue: { assignedToId: input.assignedToId },
        },
      });

      // Fire-and-forget: notify newly assigned user
      if (input.assignedToId) {
        void sendTaskAssignmentNotification(input.id, input.assignedToId);
      }

      return updated;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        dueDate: z.string().datetime().nullable().optional(),
        section: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "tasks:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.task.findUnique({
        where: { id: input.id },
        select: { dealId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const canAccess = await canAccessDeal(user.id, user.role, existing.dealId);
      if (!canAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, dueDate, ...rest } = input;

      return db.task.update({
        where: { id },
        data: {
          ...rest,
          dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
        } as any,
        include: { assignedTo: { select: userSelect } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "tasks:delete")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.task.delete({ where: { id: input.id } });
      return { success: true };
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        body: z.string().min(1),
        parentCommentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const task = await db.task.findUnique({
        where: { id: input.taskId },
        select: { dealId: true },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      const comment = await db.taskComment.create({
        data: {
          taskId: input.taskId,
          userId: user.id,
          body: input.body,
          parentCommentId: input.parentCommentId,
        },
        include: { user: { select: userSelect } },
      });

      await db.activityLog.create({
        data: {
          dealId: task.dealId,
          userId: user.id,
          action: "COMMENT_ADDED" as any,
          entityType: "TaskComment",
          entityId: comment.id,
        },
      });

      return comment;
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "UNDER_REVIEW", "WAITING", "BLOCKED", "COMPLETE", "NA"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "tasks:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const data: Record<string, unknown> = { status: input.status };
      if (input.status === "COMPLETE") {
        data.completedDate = new Date();
        data.completedById = user.id;
      }

      await db.task.updateMany({
        where: { id: { in: input.taskIds } },
        data: data as any,
      });

      return { success: true, count: input.taskIds.length };
    }),

  getMyTasks: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const where: Record<string, unknown> = {
        assignedToId: user.id,
      };

      if (input?.status) {
        where.status = input.status;
      } else {
        where.status = { not: "COMPLETE" };
      }

      return db.task.findMany({
        where: where as any,
        include: {
          deal: { select: { id: true, name: true, facilityName: true, status: true } },
          _count: { select: { files: true, comments: true } },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: input?.limit ?? 20,
      });
    }),
});
