import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { analyzeOta } from "@/server/ai/otaAnalysis";
import type { AppSession } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Auth + validation first (fast, no streaming needed)
  let session;
  try {
    session = (await auth()) as any;
  } catch {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(session.user.role, "ota:analyze")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { otaDocumentId } = body;
  if (!otaDocumentId) {
    return NextResponse.json(
      { error: "Missing otaDocumentId" },
      { status: 400 },
    );
  }

  const document = await db.otaDocument.findUnique({
    where: { id: otaDocumentId },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const canAccess = await canAccessDeal(
    session.user.id,
    session.user.role,
    document.dealId,
  );
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!document.extractedText) {
    return NextResponse.json({ error: "No extracted text" }, { status: 400 });
  }

  // Set ANALYZING status
  await db.otaDocument.update({
    where: { id: otaDocumentId },
    data: { status: "ANALYZING" },
  });

  // Return a streaming response that sends keepalive newlines every 10s
  // while the Claude analysis runs. This prevents Vercel gateway timeout.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Keepalive interval - sends a newline every 10 seconds
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("\n"));
        } catch {
          // Stream may already be closed
        }
      }, 10_000);

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

        controller.enqueue(
          encoder.encode(JSON.stringify({ status: "complete" }) + "\n"),
        );
      } catch (error) {
        console.error("[OTA Analysis Error]", error);
        try {
          await db.otaDocument.update({
            where: { id: otaDocumentId },
            data: {
              status: "ERROR",
              errorMessage:
                error instanceof Error ? error.message : "Analysis failed",
            },
          });
        } catch (dbError) {
          console.error("[OTA DB Update Error]", dbError);
        }
        controller.enqueue(
          encoder.encode(JSON.stringify({ status: "error" }) + "\n"),
        );
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
