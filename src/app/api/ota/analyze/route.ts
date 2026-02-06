import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { analyzeOta } from "@/server/ai/otaAnalysis";
import type { AppSession } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = (await auth()) as AppSession | null;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ota:analyze")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { otaDocumentId } = await request.json();
    if (!otaDocumentId) {
      return NextResponse.json({ error: "Missing otaDocumentId" }, { status: 400 });
    }

    const document = await db.otaDocument.findUnique({
      where: { id: otaDocumentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const canAccess = await canAccessDeal(session.user.id, session.user.role, document.dealId);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!document.extractedText) {
      return NextResponse.json({ error: "No extracted text" }, { status: 400 });
    }

    // Set status to ANALYZING immediately
    await db.otaDocument.update({
      where: { id: otaDocumentId },
      data: { status: "ANALYZING" },
    });

    // Schedule the actual analysis to run AFTER the response is sent
    after(async () => {
      try {
        const result = await analyzeOta(document.extractedText!);

        await db.otaAnalysis.create({
          data: {
            otaDocumentId,
            summary: result.summary,
            sections: result.sections as any,
            risks: result.risks as any,
            compliance: result.compliance as any,
            agreedVsOpen: result.agreedVsOpen as any,
            operationalImpact: result.operationalImpact as any,
            tokensUsed: result.tokensUsed,
          },
        });

        await db.otaDocument.update({
          where: { id: otaDocumentId },
          data: { status: "COMPLETE" },
        });
      } catch (error) {
        console.error("[OTA Analysis Error]", error);
        await db.otaDocument.update({
          where: { id: otaDocumentId },
          data: {
            status: "ERROR",
            errorMessage: error instanceof Error ? error.message : "Analysis failed",
          },
        });
      }
    });

    // Return immediately - analysis runs in the background
    return NextResponse.json({ status: "started" });
  } catch (error) {
    console.error("[OTA Analyze Route Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
