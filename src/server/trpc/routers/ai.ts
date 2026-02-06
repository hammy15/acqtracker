import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const aiRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;

    const conversations = await db.aiConversation.findMany({
      where: { userId: user.id, orgId: user.orgId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        context: true,
        dealId: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return conversations;
  }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // Verify ownership
      const conversation = await db.aiConversation.findFirst({
        where: {
          id: input.conversationId,
          userId: user.id,
          orgId: user.orgId,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found.",
        });
      }

      const messages = await db.aiMessage.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      });

      return messages;
    }),

  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // Verify ownership
      const conversation = await db.aiConversation.findFirst({
        where: {
          id: input.conversationId,
          userId: user.id,
          orgId: user.orgId,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found.",
        });
      }

      // Cascade delete is handled by Prisma schema (onDelete: Cascade on AiMessage)
      await db.aiConversation.delete({
        where: { id: input.conversationId },
      });

      return { success: true };
    }),

  updateTitle: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        title: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // Verify ownership
      const conversation = await db.aiConversation.findFirst({
        where: {
          id: input.conversationId,
          userId: user.id,
          orgId: user.orgId,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found.",
        });
      }

      const updated = await db.aiConversation.update({
        where: { id: input.conversationId },
        data: { title: input.title },
      });

      return updated;
    }),
});
