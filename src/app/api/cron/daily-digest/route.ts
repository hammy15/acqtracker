import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sendDailyDigest } from "@/server/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all orgs with daily digest enabled
    const orgSettings = await db.orgSettings.findMany({
      where: {
        emailNotifications: true,
        dailyDigest: true,
      },
      select: { orgId: true },
    });

    const orgIds = orgSettings.map((s) => s.orgId);

    if (orgIds.length === 0) {
      return NextResponse.json({ message: "No orgs with daily digest enabled", sent: 0 });
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
        await sendDailyDigest(user.id);
        sent++;
      } catch (error) {
        console.error(`[Cron] Daily digest failed for user ${user.id}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      message: "Daily digest cron complete",
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    console.error("[Cron] Daily digest cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
