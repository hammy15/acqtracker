import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";
import { analyzeOta } from "@/server/ai/otaAnalysis";

export const otaRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // Get OTA documents for a deal
  // ──────────────────────────────────────────────────────────────────────────
  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal.",
        });
      }

      if (!hasPermission(user.role, "ota:read")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view OTA documents.",
        });
      }

      const documents = await db.otaDocument.findMany({
        where: { dealId: input.dealId },
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
        orderBy: { createdAt: "desc" },
      });

      return documents;
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // Get analysis for a specific OTA document
  // ──────────────────────────────────────────────────────────────────────────
  getAnalysis: protectedProcedure
    .input(z.object({ otaDocumentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const analysis = await db.otaAnalysis.findUnique({
        where: { otaDocumentId: input.otaDocumentId },
        include: {
          otaDocument: true,
        },
      });

      if (!analysis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OTA analysis not found.",
        });
      }

      const canAccess = await canAccessDeal(
        user.id,
        user.role,
        analysis.otaDocument.dealId,
      );
      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal.",
        });
      }

      if (!hasPermission(user.role, "ota:read")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view OTA analyses.",
        });
      }

      return analysis;
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // Trigger analysis for an OTA document
  // ──────────────────────────────────────────────────────────────────────────
  analyze: protectedProcedure
    .input(z.object({ otaDocumentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      if (!hasPermission(user.role, "ota:analyze")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to analyze OTA documents.",
        });
      }

      const document = await db.otaDocument.findUnique({
        where: { id: input.otaDocumentId },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OTA document not found.",
        });
      }

      const canAccess = await canAccessDeal(
        user.id,
        user.role,
        document.dealId,
      );
      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal.",
        });
      }

      if (!document.extractedText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "OTA document has no extracted text. Please re-upload the document.",
        });
      }

      // Update status to ANALYZING
      await db.otaDocument.update({
        where: { id: input.otaDocumentId },
        data: { status: "ANALYZING" },
      });

      try {
        const result = await analyzeOta(document.extractedText);

        const analysis = await db.otaAnalysis.create({
          data: {
            otaDocumentId: input.otaDocumentId,
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
          where: { id: input.otaDocumentId },
          data: { status: "COMPLETE" },
        });

        return analysis;
      } catch (error) {
        await db.otaDocument.update({
          where: { id: input.otaDocumentId },
          data: {
            status: "ERROR",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Analysis failed with an unknown error.",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "OTA analysis failed.",
        });
      }
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // Delete existing analysis and re-run
  // ──────────────────────────────────────────────────────────────────────────
  reanalyze: protectedProcedure
    .input(z.object({ otaDocumentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      if (!hasPermission(user.role, "ota:analyze")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to analyze OTA documents.",
        });
      }

      const document = await db.otaDocument.findUnique({
        where: { id: input.otaDocumentId },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OTA document not found.",
        });
      }

      const canAccess = await canAccessDeal(
        user.id,
        user.role,
        document.dealId,
      );
      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal.",
        });
      }

      if (!document.extractedText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "OTA document has no extracted text. Please re-upload the document.",
        });
      }

      // Delete existing analysis
      await db.otaAnalysis.deleteMany({
        where: { otaDocumentId: input.otaDocumentId },
      });

      // Update status to ANALYZING
      await db.otaDocument.update({
        where: { id: input.otaDocumentId },
        data: { status: "ANALYZING", errorMessage: null },
      });

      try {
        const result = await analyzeOta(document.extractedText);

        const analysis = await db.otaAnalysis.create({
          data: {
            otaDocumentId: input.otaDocumentId,
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
          where: { id: input.otaDocumentId },
          data: { status: "COMPLETE" },
        });

        return analysis;
      } catch (error) {
        await db.otaDocument.update({
          where: { id: input.otaDocumentId },
          data: {
            status: "ERROR",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Re-analysis failed with an unknown error.",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "OTA re-analysis failed.",
        });
      }
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // Delete an OTA document
  // ──────────────────────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      if (!hasPermission(user.role, "ota:analyze")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete OTA documents.",
        });
      }

      const document = await db.otaDocument.findUnique({
        where: { id: input.id },
        select: { dealId: true, fileName: true },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OTA document not found.",
        });
      }

      const canAccess = await canAccessDeal(
        user.id,
        user.role,
        document.dealId,
      );
      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal.",
        });
      }

      // Cascade delete handles the OtaAnalysis record
      await db.otaDocument.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
