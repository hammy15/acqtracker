import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal, getDealsScope } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const reportsRouter = router({
  dealProgress: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "reports:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view reports." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const deal = await db.deal.findUnique({
        where: { id: input.dealId },
        select: {
          id: true,
          name: true,
          facilityName: true,
          status: true,
          targetCloseDate: true,
          actualCloseDate: true,
          createdAt: true,
        },
      });

      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const tasks = await db.task.findMany({
        where: { dealId: input.dealId },
        select: {
          id: true,
          status: true,
          phase: true,
          workstream: true,
          priority: true,
          assignedToId: true,
          dueDate: true,
          completedDate: true,
        },
      });

      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "COMPLETE").length;
      const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
      const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const notStarted = tasks.filter((t) => t.status === "NOT_STARTED").length;
      const na = tasks.filter((t) => t.status === "NA").length;

      // By workstream
      const byWorkstream: Record<string, { total: number; completed: number; blocked: number; progress: number }> = {};
      for (const task of tasks) {
        if (!byWorkstream[task.workstream]) {
          byWorkstream[task.workstream] = { total: 0, completed: 0, blocked: 0, progress: 0 };
        }
        byWorkstream[task.workstream].total++;
        if (task.status === "COMPLETE") byWorkstream[task.workstream].completed++;
        if (task.status === "BLOCKED") byWorkstream[task.workstream].blocked++;
      }
      for (const ws of Object.keys(byWorkstream)) {
        const ws_data = byWorkstream[ws];
        ws_data.progress = ws_data.total > 0 ? Math.round((ws_data.completed / ws_data.total) * 100) : 0;
      }

      // By phase
      const byPhase: Record<string, { total: number; completed: number; progress: number }> = {};
      for (const task of tasks) {
        if (!byPhase[task.phase]) {
          byPhase[task.phase] = { total: 0, completed: 0, progress: 0 };
        }
        byPhase[task.phase].total++;
        if (task.status === "COMPLETE") byPhase[task.phase].completed++;
      }
      for (const phase of Object.keys(byPhase)) {
        const phaseData = byPhase[phase];
        phaseData.progress = phaseData.total > 0 ? Math.round((phaseData.completed / phaseData.total) * 100) : 0;
      }

      // By priority
      const byPriority: Record<string, { total: number; completed: number }> = {};
      for (const task of tasks) {
        if (!byPriority[task.priority]) {
          byPriority[task.priority] = { total: 0, completed: 0 };
        }
        byPriority[task.priority].total++;
        if (task.status === "COMPLETE") byPriority[task.priority].completed++;
      }

      // Overdue tasks
      const now = new Date();
      const overdueTasks = tasks.filter(
        (t) => t.dueDate && t.dueDate < now && t.status !== "COMPLETE" && t.status !== "NA"
      ).length;

      return {
        deal,
        summary: {
          total,
          completed,
          blocked,
          inProgress,
          notStarted,
          na,
          overdue: overdueTasks,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        byWorkstream,
        byPhase,
        byPriority,
      };
    }),

  teamPerformance: protectedProcedure
    .input(
      z.object({
        dealId: z.string().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "reports:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // If dealId is provided, scope to that deal; otherwise scope to accessible deals
      let dealFilter: Record<string, unknown> = {};

      if (input?.dealId) {
        const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
        if (!canAccess) throw new TRPCError({ code: "FORBIDDEN" });
        dealFilter = { dealId: input.dealId };
      } else {
        const scope = await getDealsScope(user.id, user.role, user.orgId);
        const accessibleDeals = await db.deal.findMany({
          where: scope.where as any,
          select: { id: true },
        });
        dealFilter = { dealId: { in: accessibleDeals.map((d) => d.id) } };
      }

      const dateFilter: Record<string, unknown> = {};
      if (input?.dateFrom || input?.dateTo) {
        dateFilter.completedDate = {};
        if (input?.dateFrom) (dateFilter.completedDate as any).gte = new Date(input.dateFrom);
        if (input?.dateTo) (dateFilter.completedDate as any).lte = new Date(input.dateTo);
      }

      // Get all tasks with assignees
      const tasks = await db.task.findMany({
        where: {
          ...dealFilter,
          assignedToId: { not: null },
        } as any,
        select: {
          id: true,
          status: true,
          assignedToId: true,
          completedDate: true,
          priority: true,
          assignedTo: { select: userSelect },
        },
      });

      // Completed tasks with date filter
      const completedTasks = await db.task.findMany({
        where: {
          ...dealFilter,
          ...dateFilter,
          status: "COMPLETE",
          completedById: { not: null },
        } as any,
        select: {
          id: true,
          completedById: true,
          completedDate: true,
          completedBy: { select: userSelect },
        },
      });

      // Aggregate by user
      const userStats: Record<
        string,
        {
          user: typeof userSelect extends infer T ? Record<string, unknown> : never;
          assigned: number;
          completed: number;
          inProgress: number;
          blocked: number;
        }
      > = {};

      for (const task of tasks) {
        const uid = task.assignedToId!;
        if (!userStats[uid]) {
          userStats[uid] = {
            user: task.assignedTo as any,
            assigned: 0,
            completed: 0,
            inProgress: 0,
            blocked: 0,
          };
        }
        userStats[uid].assigned++;
        if (task.status === "COMPLETE") userStats[uid].completed++;
        if (task.status === "IN_PROGRESS") userStats[uid].inProgress++;
        if (task.status === "BLOCKED") userStats[uid].blocked++;
      }

      // Add completed counts from completedBy
      for (const task of completedTasks) {
        const uid = task.completedById!;
        if (!userStats[uid]) {
          userStats[uid] = {
            user: task.completedBy as any,
            assigned: 0,
            completed: 0,
            inProgress: 0,
            blocked: 0,
          };
        }
        // Only count if not already counted (avoid double-counting self-completed)
        if (!tasks.find((t) => t.id === task.id && t.assignedToId === uid)) {
          userStats[uid].completed++;
        }
      }

      const teamStats = Object.values(userStats).sort((a, b) => b.completed - a.completed);

      return {
        teamStats,
        totals: {
          totalAssigned: tasks.length,
          totalCompleted: completedTasks.length,
        },
      };
    }),

  pipelineOverview: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "reports:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const scope = await getDealsScope(user.id, user.role, user.orgId);

      const deals = await db.deal.findMany({
        where: scope.where as any,
        select: {
          id: true,
          status: true,
          facilityType: true,
          state: true,
          createdAt: true,
          updatedAt: true,
          targetCloseDate: true,
          actualCloseDate: true,
          _count: { select: { tasks: true } },
          tasks: {
            select: { status: true },
          },
        },
      });

      // Deals by status
      const byStatus: Record<string, number> = {};
      for (const deal of deals) {
        byStatus[deal.status] = (byStatus[deal.status] || 0) + 1;
      }

      // Deals by facility type
      const byFacilityType: Record<string, number> = {};
      for (const deal of deals) {
        byFacilityType[deal.facilityType] = (byFacilityType[deal.facilityType] || 0) + 1;
      }

      // Deals by state
      const byState: Record<string, number> = {};
      for (const deal of deals) {
        byState[deal.state] = (byState[deal.state] || 0) + 1;
      }

      // Average completion percentage
      const activeDeals = deals.filter((d) => d.status !== "ARCHIVED");
      const avgProgress =
        activeDeals.length > 0
          ? Math.round(
              activeDeals.reduce((sum, deal) => {
                const total = deal.tasks.length;
                const completed = deal.tasks.filter((t) => t.status === "COMPLETE").length;
                return sum + (total > 0 ? (completed / total) * 100 : 0);
              }, 0) / activeDeals.length
            )
          : 0;

      // Average days in pipeline (for closed deals)
      const closedDeals = deals.filter((d) => d.actualCloseDate);
      const avgDaysToClose =
        closedDeals.length > 0
          ? Math.round(
              closedDeals.reduce((sum, d) => {
                const days =
                  (new Date(d.actualCloseDate!).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / closedDeals.length
            )
          : null;

      return {
        summary: {
          totalDeals: deals.length,
          activeDeals: activeDeals.length,
          archivedDeals: deals.filter((d) => d.status === "ARCHIVED").length,
          avgProgress,
          avgDaysToClose,
        },
        byStatus,
        byFacilityType,
        byState,
      };
    }),
});
