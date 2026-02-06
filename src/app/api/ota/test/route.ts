import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { analyzeOta } from "@/server/ai/otaAnalysis";

export const runtime = "nodejs";
export const maxDuration = 60;

// Diagnostic endpoint - runs the full OTA analysis pipeline
export async function GET(request: NextRequest) {
  const start = Date.now();
  const log: string[] = [];

  try {
    // Find the most recent OtaDocument with extracted text
    log.push(`[${Date.now() - start}ms] Finding document...`);
    const doc = await db.otaDocument.findFirst({
      where: { extractedText: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    if (!doc || !doc.extractedText) {
      return NextResponse.json({
        ok: false,
        log,
        error: "No document with extracted text found",
      });
    }

    log.push(
      `[${Date.now() - start}ms] Found doc ${doc.id}, text length: ${doc.extractedText.length}`,
    );

    // Run the analysis
    log.push(`[${Date.now() - start}ms] Starting analyzeOta()...`);
    const result = await analyzeOta(doc.extractedText);
    log.push(
      `[${Date.now() - start}ms] Analysis complete! Tokens: ${result.tokensUsed}`,
    );

    // Save to DB
    log.push(`[${Date.now() - start}ms] Saving to DB...`);

    // Delete existing analysis if any
    await db.otaAnalysis.deleteMany({ where: { otaDocumentId: doc.id } });

    await db.otaAnalysis.create({
      data: {
        otaDocumentId: doc.id,
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
      where: { id: doc.id },
      data: { status: "COMPLETE" },
    });

    log.push(`[${Date.now() - start}ms] Done!`);

    return NextResponse.json({
      ok: true,
      ms: Date.now() - start,
      log,
      summaryPreview: result.summary.substring(0, 200),
      tokensUsed: result.tokensUsed,
      risksCount: result.risks.length,
    });
  } catch (error: any) {
    log.push(
      `[${Date.now() - start}ms] ERROR: ${error?.message || String(error)}`,
    );
    return NextResponse.json({
      ok: false,
      ms: Date.now() - start,
      log,
      error: error?.message || String(error),
      type: error?.constructor?.name,
    });
  }
}
