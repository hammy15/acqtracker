import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const templatesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        templateType: z.string().optional(),
        facilityType: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view templates." });
      }

      const where: Record<string, unknown> = { orgId: user.orgId };

      if (input?.templateType) where.templateType = input.templateType;
      if (input?.facilityType) where.facilityType = input.facilityType;
      if (input?.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      const templates = await db.template.findMany({
        where: where as any,
        include: {
          createdBy: { select: userSelect },
          _count: { select: { templateTasks: true, deals: true } },
        },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      });

      return templates;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const template = await db.template.findUnique({
        where: { id: input.id },
        include: {
          createdBy: { select: userSelect },
          templateTasks: {
            orderBy: [{ workstream: "asc" }, { sortOrder: "asc" }],
            include: {
              childTasks: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          _count: { select: { deals: true } },
        },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
      }

      if (template.orgId !== user.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return template;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        templateType: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).default("PRE_CLOSE"),
        facilityType: z.enum(["SNF", "ALF", "ILF", "HOSPICE", "IN_HOME"]).optional(),
        state: z.string().optional(),
        isDefault: z.boolean().default(false),
        tasks: z
          .array(
            z.object({
              workstream: z.string(),
              section: z.string().optional(),
              title: z.string().min(1),
              description: z.string().optional(),
              sortOrder: z.number().default(0),
              indentLevel: z.number().default(0),
              defaultRole: z.string().optional(),
              daysOffset: z.number().default(0),
              isRequired: z.boolean().default(true),
              isStateSpecific: z.boolean().default(false),
              facilityTypes: z.array(z.string()).optional(),
              requiresPhoto: z.boolean().default(false),
              phase: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).default("PRE_CLOSE"),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:create")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to create templates." });
      }

      // If marking as default, unset any existing default for same type+facilityType
      if (input.isDefault) {
        await db.template.updateMany({
          where: {
            orgId: user.orgId,
            templateType: input.templateType as any,
            facilityType: input.facilityType ? (input.facilityType as any) : undefined,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const template = await db.template.create({
        data: {
          orgId: user.orgId,
          name: input.name,
          templateType: input.templateType as any,
          facilityType: input.facilityType ? (input.facilityType as any) : undefined,
          state: input.state,
          isDefault: input.isDefault,
          createdById: user.id,
          templateTasks: input.tasks
            ? {
                create: input.tasks.map((task) => ({
                  workstream: task.workstream,
                  section: task.section,
                  title: task.title,
                  description: task.description,
                  sortOrder: task.sortOrder,
                  indentLevel: task.indentLevel,
                  defaultRole: task.defaultRole,
                  daysOffset: task.daysOffset,
                  isRequired: task.isRequired,
                  isStateSpecific: task.isStateSpecific,
                  facilityTypes: (task.facilityTypes ?? []) as any,
                  requiresPhoto: task.requiresPhoto,
                  phase: task.phase as any,
                })),
              }
            : undefined,
        },
        include: {
          createdBy: { select: userSelect },
          templateTasks: { orderBy: { sortOrder: "asc" } },
        },
      });

      return template;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        templateType: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).optional(),
        facilityType: z.enum(["SNF", "ALF", "ILF", "HOSPICE", "IN_HOME"]).nullable().optional(),
        state: z.string().nullable().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.template.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      // If marking as default, unset any existing default for same type
      if (input.isDefault) {
        const templateType = input.templateType ?? existing.templateType;
        const facilityType = input.facilityType !== undefined ? input.facilityType : existing.facilityType;
        await db.template.updateMany({
          where: {
            orgId: user.orgId,
            templateType: templateType as any,
            facilityType: facilityType ? (facilityType as any) : undefined,
            isDefault: true,
            id: { not: input.id },
          },
          data: { isDefault: false },
        });
      }

      const { id, ...rest } = input;

      return db.template.update({
        where: { id },
        data: {
          ...rest,
          templateType: rest.templateType ? (rest.templateType as any) : undefined,
          facilityType: rest.facilityType === null ? null : rest.facilityType ? (rest.facilityType as any) : undefined,
          version: { increment: 1 },
        } as any,
        include: {
          createdBy: { select: userSelect },
          _count: { select: { templateTasks: true } },
        },
      });
    }),

  addTask: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        workstream: z.string(),
        section: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        parentTaskId: z.string().optional(),
        sortOrder: z.number().optional(),
        indentLevel: z.number().default(0),
        defaultRole: z.string().optional(),
        daysOffset: z.number().default(0),
        isRequired: z.boolean().default(true),
        isStateSpecific: z.boolean().default(false),
        facilityTypes: z.array(z.string()).optional(),
        requiresPhoto: z.boolean().default(false),
        phase: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).default("PRE_CLOSE"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const template = await db.template.findUnique({ where: { id: input.templateId } });
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      if (template.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      // Auto-calculate sortOrder if not provided
      let sortOrder = input.sortOrder;
      if (sortOrder === undefined) {
        const lastTask = await db.templateTask.findFirst({
          where: { templateId: input.templateId, workstream: input.workstream },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        sortOrder = (lastTask?.sortOrder ?? 0) + 1;
      }

      const task = await db.templateTask.create({
        data: {
          templateId: input.templateId,
          workstream: input.workstream,
          section: input.section,
          title: input.title,
          description: input.description,
          parentTaskId: input.parentTaskId,
          sortOrder,
          indentLevel: input.indentLevel,
          defaultRole: input.defaultRole,
          daysOffset: input.daysOffset,
          isRequired: input.isRequired,
          isStateSpecific: input.isStateSpecific,
          facilityTypes: (input.facilityTypes ?? []) as any,
          requiresPhoto: input.requiresPhoto,
          phase: input.phase as any,
        },
      });

      // Bump template version
      await db.template.update({
        where: { id: input.templateId },
        data: { version: { increment: 1 } },
      });

      return task;
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        workstream: z.string().optional(),
        section: z.string().nullable().optional(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
        indentLevel: z.number().optional(),
        defaultRole: z.string().nullable().optional(),
        daysOffset: z.number().optional(),
        isRequired: z.boolean().optional(),
        isStateSpecific: z.boolean().optional(),
        facilityTypes: z.array(z.string()).optional(),
        requiresPhoto: z.boolean().optional(),
        phase: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.templateTask.findUnique({
        where: { id: input.id },
        include: { template: { select: { orgId: true, id: true } } },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.template.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, ...rest } = input;

      const updated = await db.templateTask.update({
        where: { id },
        data: {
          ...rest,
          facilityTypes: rest.facilityTypes ? (rest.facilityTypes as any) : undefined,
          phase: rest.phase ? (rest.phase as any) : undefined,
        } as any,
      });

      // Bump template version
      await db.template.update({
        where: { id: existing.template.id },
        data: { version: { increment: 1 } },
      });

      return updated;
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:update")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await db.templateTask.findUnique({
        where: { id: input.id },
        include: { template: { select: { orgId: true, id: true } } },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.template.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      await db.templateTask.delete({ where: { id: input.id } });

      // Bump template version
      await db.template.update({
        where: { id: existing.template.id },
        data: { version: { increment: 1 } },
      });

      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:create")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const original = await db.template.findUnique({
        where: { id: input.id },
        include: {
          templateTasks: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!original) throw new TRPCError({ code: "NOT_FOUND" });
      if (original.orgId !== user.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      const newName = input.name ?? `${original.name} (Copy)`;

      // Create the new template with all tasks
      const duplicate = await db.template.create({
        data: {
          orgId: user.orgId,
          name: newName,
          templateType: original.templateType,
          facilityType: original.facilityType,
          state: original.state,
          isDefault: false,
          createdById: user.id,
        },
      });

      // Re-create tasks, mapping parentTaskIds
      if (original.templateTasks.length > 0) {
        const oldToNewIdMap = new Map<string, string>();

        for (const task of original.templateTasks) {
          const newTask = await db.templateTask.create({
            data: {
              templateId: duplicate.id,
              workstream: task.workstream,
              section: task.section,
              title: task.title,
              description: task.description,
              parentTaskId: task.parentTaskId ? oldToNewIdMap.get(task.parentTaskId) : undefined,
              sortOrder: task.sortOrder,
              indentLevel: task.indentLevel,
              defaultRole: task.defaultRole,
              daysOffset: task.daysOffset,
              isRequired: task.isRequired,
              isStateSpecific: task.isStateSpecific,
              facilityTypes: task.facilityTypes,
              requiresPhoto: task.requiresPhoto,
              phase: task.phase,
            },
          });
          oldToNewIdMap.set(task.id, newTask.id);
        }
      }

      // Return the full duplicate
      return db.template.findUnique({
        where: { id: duplicate.id },
        include: {
          createdBy: { select: userSelect },
          templateTasks: { orderBy: { sortOrder: "asc" } },
          _count: { select: { deals: true } },
        },
      });
    }),

  createFromDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        name: z.string().min(1),
        templateType: z.enum(["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"]).default("PRE_CLOSE"),
        facilityType: z.enum(["SNF", "ALF", "ILF", "HOSPICE", "IN_HOME"]).optional(),
        includeAssignees: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "templates:create")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to create templates." });
      }

      // Verify deal access
      const deal = await db.deal.findFirst({
        where: { id: input.dealId, orgId: user.orgId },
        include: {
          tasks: {
            orderBy: [{ workstream: "asc" }, { section: "asc" }, { sortOrder: "asc" }],
            include: {
              assignedTo: { select: { role: true } },
            },
          },
        },
      });

      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found." });
      }

      if (deal.tasks.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deal has no tasks to create a template from." });
      }

      // Create the template
      const template = await db.template.create({
        data: {
          orgId: user.orgId,
          name: input.name,
          templateType: input.templateType as any,
          facilityType: (input.facilityType ?? deal.facilityType) as any,
          state: deal.state,
          isDefault: false,
          createdById: user.id,
        },
      });

      // Map old task IDs to new template task IDs for parent-child relationships
      const oldToNewIdMap = new Map<string, string>();

      for (const task of deal.tasks) {
        const templateTask = await db.templateTask.create({
          data: {
            templateId: template.id,
            workstream: task.workstream,
            section: task.section,
            title: task.title,
            description: task.description,
            parentTaskId: task.parentTaskId ? oldToNewIdMap.get(task.parentTaskId) : undefined,
            sortOrder: task.sortOrder,
            indentLevel: task.indentLevel,
            defaultRole: input.includeAssignees ? task.assignedTo?.role : undefined,
            daysOffset: 0,
            isRequired: true,
            isStateSpecific: false,
            facilityTypes: [],
            requiresPhoto: false,
            phase: task.phase as any,
          },
        });
        oldToNewIdMap.set(task.id, templateTask.id);
      }

      return db.template.findUnique({
        where: { id: template.id },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          templateTasks: { orderBy: { sortOrder: "asc" } },
          _count: { select: { deals: true } },
        },
      });
    }),
});
