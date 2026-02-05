import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { hasPermission, canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const chatRouter = router({
  getChannels: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "chat:read")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to read chat." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const channels = await db.chatChannel.findMany({
        where: { dealId: input.dealId },
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              user: { select: userSelect },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return channels.map((channel) => ({
        ...channel,
        lastMessage: channel.messages[0] ?? null,
        messages: undefined,
      }));
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "chat:read")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const channel = await db.chatChannel.findUnique({
        where: { id: input.channelId },
        select: { dealId: true },
      });

      if (!channel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, channel.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const messages = await db.chatMessage.findMany({
        where: { channelId: input.channelId },
        include: {
          user: { select: userSelect },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? {
              cursor: { id: input.cursor },
              skip: 1,
            }
          : {}),
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const next = messages.pop();
        nextCursor = next?.id;
      }

      return {
        messages: messages.reverse(),
        nextCursor,
      };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        body: z.string().min(1),
        fileId: z.string().optional(),
        mentions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "chat:write")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to send messages." });
      }

      const channel = await db.chatChannel.findUnique({
        where: { id: input.channelId },
        select: { dealId: true },
      });

      if (!channel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found." });
      }

      const canAccess = await canAccessDeal(user.id, user.role, channel.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const message = await db.chatMessage.create({
        data: {
          channelId: input.channelId,
          userId: user.id,
          body: input.body,
          fileId: input.fileId,
          mentions: input.mentions ?? [],
        },
        include: {
          user: { select: userSelect },
        },
      });

      await db.activityLog.create({
        data: {
          dealId: channel.dealId,
          userId: user.id,
          action: "CHAT_MESSAGE" as any,
          entityType: "ChatMessage",
          entityId: message.id,
          newValue: { channelId: input.channelId, body: input.body.substring(0, 100) },
        },
      });

      return message;
    }),

  createChannel: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        name: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!hasPermission(user.role, "chat:write")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Check for existing channel with same name in this deal
      const existing = await db.chatChannel.findUnique({
        where: {
          dealId_name: {
            dealId: input.dealId,
            name: input.name.toLowerCase().replace(/\s+/g, "-"),
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A channel with this name already exists for this deal.",
        });
      }

      const channel = await db.chatChannel.create({
        data: {
          dealId: input.dealId,
          name: input.name.toLowerCase().replace(/\s+/g, "-"),
          channelType: "CUSTOM" as any,
        },
      });

      return channel;
    }),
});
