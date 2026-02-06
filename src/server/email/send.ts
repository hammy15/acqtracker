import { resend, FROM_EMAIL } from "./resend";
import {
  taskAssignmentEmail,
  taskBlockedEmail,
  transitionDayReminderEmail,
  dailyDigestEmail,
  weeklyReportEmail,
} from "./templates";
import { db } from "@/server/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://acqtracker.com";

function getResend() {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return null;
  }
  return resend;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function taskUrl(dealId: string, taskId: string): string {
  return `${APP_URL}/deals/${dealId}/tasks/${taskId}`;
}

function dealUrl(dealId: string): string {
  return `${APP_URL}/deals/${dealId}`;
}

function dashboardUrl(): string {
  return `${APP_URL}/dashboard`;
}

async function isEmailEnabled(orgId: string): Promise<boolean> {
  const settings = await db.orgSettings.findFirst({ where: { orgId } });
  return settings?.emailNotifications !== false;
}

async function isDailyDigestEnabled(orgId: string): Promise<boolean> {
  const settings = await db.orgSettings.findFirst({ where: { orgId } });
  return (
    settings?.emailNotifications !== false && settings?.dailyDigest !== false
  );
}

async function isWeeklyReportEnabled(orgId: string): Promise<boolean> {
  const settings = await db.orgSettings.findFirst({ where: { orgId } });
  return (
    settings?.emailNotifications !== false && settings?.weeklyReport === true
  );
}

async function isTransitionAlertsEnabled(orgId: string): Promise<boolean> {
  const settings = await db.orgSettings.findFirst({ where: { orgId } });
  return (
    settings?.emailNotifications !== false &&
    settings?.transitionAlerts !== false
  );
}

// ─────────────────────────────────────────────
// Send: Task Assignment Notification
// ─────────────────────────────────────────────

export async function sendTaskAssignmentNotification(
  taskId: string,
  assigneeId: string,
): Promise<void> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        deal: { select: { id: true, name: true, orgId: true } },
      },
    });

    if (!task || !task.deal) return;

    const enabled = await isEmailEnabled(task.deal.orgId);
    if (!enabled) return;

    const assignee = await db.user.findUnique({
      where: { id: assigneeId },
      select: { name: true, email: true },
    });

    if (!assignee?.email) return;

    const html = taskAssignmentEmail(
      assignee.name || "Team Member",
      task.title,
      task.deal.name,
      taskUrl(task.deal.id, task.id),
    );

    await getResend()?.emails.send({
      from: FROM_EMAIL,
      to: assignee.email,
      subject: `Task Assigned: ${task.title}`,
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send task assignment notification:", error);
  }
}

// ─────────────────────────────────────────────
// Send: Task Blocked Notification
// ─────────────────────────────────────────────

export async function sendTaskBlockedNotification(
  taskId: string,
): Promise<void> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        deal: {
          select: {
            id: true,
            name: true,
            orgId: true,
            dealLeadId: true,
          },
        },
      },
    });

    if (!task || !task.deal || !task.deal.dealLeadId) return;

    const enabled = await isEmailEnabled(task.deal.orgId);
    if (!enabled) return;

    const dealLead = await db.user.findUnique({
      where: { id: task.deal.dealLeadId },
      select: { name: true, email: true },
    });

    if (!dealLead?.email) return;

    const html = taskBlockedEmail(
      dealLead.name || "Deal Lead",
      task.title,
      task.deal.name,
      task.flagReason || "No reason provided",
      taskUrl(task.deal.id, task.id),
    );

    await getResend()?.emails.send({
      from: FROM_EMAIL,
      to: dealLead.email,
      subject: `Task Blocked: ${task.title}`,
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send task blocked notification:", error);
  }
}

// ─────────────────────────────────────────────
// Send: Transition Day Reminder
// ─────────────────────────────────────────────

export async function sendTransitionDayReminder(
  dealId: string,
): Promise<void> {
  try {
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        name: true,
        facilityName: true,
        orgId: true,
        targetCloseDate: true,
        buildingAssignments: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!deal) return;

    const enabled = await isTransitionAlertsEnabled(deal.orgId);
    if (!enabled) return;

    const transitionDate = deal.targetCloseDate
      ? deal.targetCloseDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date TBD";

    const scheduleUrl = dealUrl(deal.id);

    for (const assignment of deal.buildingAssignments) {
      if (!assignment.user.email) continue;

      try {
        const html = transitionDayReminderEmail(
          assignment.user.name || "Team Member",
          deal.name,
          deal.facilityName,
          transitionDate,
          scheduleUrl,
        );

        await getResend()?.emails.send({
          from: FROM_EMAIL,
          to: assignment.user.email,
          subject: `Transition Day Approaching: ${deal.facilityName}`,
          html,
        });
      } catch (err) {
        console.error(
          `[Email] Failed to send transition reminder to ${assignment.user.email}:`,
          err,
        );
      }
    }
  } catch (error) {
    console.error(
      "[Email] Failed to send transition day reminders:",
      error,
    );
  }
}

// ─────────────────────────────────────────────
// Send: Daily Digest
// ─────────────────────────────────────────────

export async function sendDailyDigest(userId: string): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, orgId: true },
    });

    if (!user?.email) return;

    const enabled = await isDailyDigestEnabled(user.orgId);
    if (!enabled) return;

    const now = new Date();

    const tasks = await db.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: "NA" },
      },
      include: {
        deal: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });

    const assigned = tasks.filter((t) => t.status !== "COMPLETE").length;
    const completed = tasks.filter((t) => t.status === "COMPLETE").length;
    const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
    const overdue = tasks.filter(
      (t) =>
        t.status !== "COMPLETE" && t.dueDate && t.dueDate < now,
    ).length;

    const activeTasks = tasks
      .filter((t) => t.status !== "COMPLETE" && t.status !== "NA")
      .map((t) => ({
        title: t.title,
        dealName: t.deal.name,
        status: t.status,
        dueDate: t.dueDate
          ? t.dueDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : null,
        url: taskUrl(t.deal.id, t.id),
      }));

    const html = dailyDigestEmail(
      user.name || "Team Member",
      { assigned, completed, blocked, overdue },
      activeTasks,
      dashboardUrl(),
    );

    await getResend()?.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Daily Digest — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send daily digest:", error);
  }
}

// ─────────────────────────────────────────────
// Send: Weekly Report
// ─────────────────────────────────────────────

export async function sendWeeklyReport(userId: string): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, orgId: true },
    });

    if (!user?.email) return;

    const enabled = await isWeeklyReportEnabled(user.orgId);
    if (!enabled) return;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Tasks completed this week
    const completedThisWeek = await db.task.count({
      where: {
        assignedToId: userId,
        status: "COMPLETE",
        completedDate: { gte: weekAgo },
      },
    });

    // Tasks created this week
    const createdThisWeek = await db.task.count({
      where: {
        assignedToId: userId,
        createdAt: { gte: weekAgo },
      },
    });

    // Currently blocked
    const blockedCount = await db.task.count({
      where: {
        assignedToId: userId,
        status: "BLOCKED",
      },
    });

    // Total assigned vs completed for completion rate
    const totalAssigned = await db.task.count({
      where: { assignedToId: userId, status: { not: "NA" } },
    });
    const totalCompleted = await db.task.count({
      where: { assignedToId: userId, status: "COMPLETE" },
    });
    const completionRate =
      totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    // Deals user is involved in
    const userDeals = await db.deal.findMany({
      where: {
        OR: [
          { dealLeadId: userId },
          { buildingAssignments: { some: { userId, isActive: true } } },
        ],
        status: { notIn: ["ARCHIVED", "POST_CLOSE"] },
      },
      include: {
        _count: {
          select: { tasks: true },
        },
        tasks: {
          where: { status: "COMPLETE" },
          select: { id: true },
        },
      },
      take: 8,
    });

    // Count deals that had activity this week
    const dealsProgressed = await db.activityLog.groupBy({
      by: ["dealId"],
      where: {
        userId,
        timestamp: { gte: weekAgo },
      },
    });

    const weeklyStats = {
      tasksCompleted: completedThisWeek,
      tasksCreated: createdThisWeek,
      tasksBlocked: blockedCount,
      dealsProgressed: dealsProgressed.length,
      completionRate,
    };

    const deals = userDeals.map((d) => ({
      name: d.name,
      facilityName: d.facilityName,
      status: d.status,
      taskProgress: {
        completed: d.tasks.length,
        total: d._count.tasks,
      },
      url: dealUrl(d.id),
    }));

    const html = weeklyReportEmail(
      user.name || "Team Member",
      weeklyStats,
      deals,
      dashboardUrl(),
    );

    await getResend()?.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Weekly Report — Week of ${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send weekly report:", error);
  }
}
