import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { extractTextFromPdf } from "@/server/ai/pdfExtract";
import { analyzeOta } from "@/server/ai/otaAnalysis";
import type { AppSession } from "@/types";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ─────────────────────────────────────────────────────────
    const session = (await auth()) as AppSession | null;
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in." },
        { status: 401 },
      );
    }

    // ── Parse multipart form data ──────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dealId = formData.get("dealId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 },
      );
    }

    if (!dealId) {
      return NextResponse.json(
        { error: "No dealId provided." },
        { status: 400 },
      );
    }

    // ── Validate file ──────────────────────────────────────────────────────
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 50MB limit." },
        { status: 400 },
      );
    }

    // ── Verify deal exists ─────────────────────────────────────────────────
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      select: { id: true, orgId: true },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found." },
        { status: 404 },
      );
    }

    // ── Save file to uploads directory ─────────────────────────────────────
    const uploadsDir = join(process.cwd(), "public", "uploads", "ota", dealId);
    await mkdir(uploadsDir, { recursive: true });

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const storedFileName = `${timestamp}-${safeFileName}`;
    const filePath = join(uploadsDir, storedFileName);
    const relativePath = `uploads/ota/${dealId}/${storedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // ── Create OtaDocument record with UPLOADING status ────────────────────
    let document = await db.otaDocument.create({
      data: {
        dealId,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        fileType: file.type,
        uploadedById: session.user.id,
        status: "UPLOADING",
      },
    });

    // ── Extract text from PDF ──────────────────────────────────────────────
    document = await db.otaDocument.update({
      where: { id: document.id },
      data: { status: "EXTRACTING" },
    });

    const extractedText = await extractTextFromPdf(buffer);

    document = await db.otaDocument.update({
      where: { id: document.id },
      data: {
        extractedText,
        status: "ANALYZING",
      },
    });

    // ── Run OTA analysis ───────────────────────────────────────────────────
    const analysisResult = await analyzeOta(extractedText);

    const analysis = await db.otaAnalysis.create({
      data: {
        otaDocumentId: document.id,
        summary: analysisResult.summary,
        sections: analysisResult.sections as any,
        risks: analysisResult.risks as any,
        compliance: analysisResult.compliance as any,
        agreedVsOpen: analysisResult.agreedVsOpen as any,
        operationalImpact: analysisResult.operationalImpact as any,
        tokensUsed: analysisResult.tokensUsed,
      },
    });

    // ── Update document status to COMPLETE ─────────────────────────────────
    document = await db.otaDocument.update({
      where: { id: document.id },
      data: { status: "COMPLETE" },
      include: {
        analysis: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ document, analysis }, { status: 200 });
  } catch (error) {
    console.error("[OTA Upload Error]", error);

    // If we have a document ID, update its status to ERROR
    // We need to try to extract it from the closure
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
