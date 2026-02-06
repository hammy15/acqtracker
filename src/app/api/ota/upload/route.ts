import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { extractTextFromPdf } from "@/server/ai/pdfExtract";
import type { AppSession } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const session = (await auth()) as AppSession | null;
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dealId = formData.get("dealId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!dealId) {
      return NextResponse.json({ error: "No dealId provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds the 50MB limit." }, { status: 400 });
    }

    const deal = await db.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const relativePath = `ota/${dealId}/${Date.now()}-${safeFileName}`;

    // Create document record
    const document = await db.otaDocument.create({
      data: {
        dealId,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        fileType: file.type,
        uploadedById: session.user.id,
        status: "EXTRACTING",
      },
    });

    // Extract text from PDF
    try {
      const extractedText = await extractTextFromPdf(buffer);

      await db.otaDocument.update({
        where: { id: document.id },
        data: {
          extractedText,
          status: "UPLOADING", // Ready for analysis
        },
      });

      return NextResponse.json({ documentId: document.id, status: "ready" });
    } catch (extractError) {
      await db.otaDocument.update({
        where: { id: document.id },
        data: {
          status: "ERROR",
          errorMessage: extractError instanceof Error ? extractError.message : "Text extraction failed",
        },
      });
      return NextResponse.json(
        { error: "Failed to extract text from PDF" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[OTA Upload Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
