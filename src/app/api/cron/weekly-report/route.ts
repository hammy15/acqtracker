import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sendWeeklyReport } from "@/server/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all orgs with weekly report enabled
    const orgSettings = await db.orgSettings.findMany({
      where: {
        emailNotifications: true,
        weeklyReport: true,
      },
      select: { orgId: true },
    });

    const orgIds = orgSettings.map((s) => s.orgId);

    if (orgIds.length === 0) {
      return NextResponse.json({ message: "No orgs with weekly report enabled", sent: 0 });
    }

    // Get all active users in those orgs
    const users = await db.user.findMany({
      where: {
        orgId: { in: orgIds },
        isActive: true,
      },
      select: { id: true },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await sendWeeklyReport(user.id);
        sent++;
      } catch (error) {
        console.error(`[Cron] Weekly report failed for user ${user.id}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      message: "Weekly report cron complete",
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    console.error("[Cron] Weekly report cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
