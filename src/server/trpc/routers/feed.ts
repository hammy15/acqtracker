import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { canAccessDeal } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

export const feedRouter = router({
  listByDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        postType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this deal." });
      }

      const where: Record<string, unknown> = { dealId: input.dealId };

      if (input.postType) {
        where.postType = input.postType;
      }

      const posts = await db.feedPost.findMany({
        where: where as any,
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
      if (posts.length > input.limit) {
        const next = posts.pop();
        nextCursor = next?.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        postType: z.enum(["MESSAGE", "PHOTO"]),
        body: z.string().optional(),
        fileId: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const canAccess = await canAccessDeal(user.id, user.role, input.dealId);
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.postType === "MESSAGE" && !input.body) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message posts require a body." });
      }

      const post = await db.feedPost.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          postType: input.postType as any,
          body: input.body,
          fileId: input.fileId,
          metadata: input.metadata as any ?? undefined,
        },
        include: {
          user: { select: userSelect },
        },
      });

      await db.activityLog.create({
        data: {
          dealId: input.dealId,
          userId: user.id,
          action: "FEED_POST" as any,
          entityType: "FeedPost",
          entityId: post.id,
          newValue: { postType: input.postType, body: input.body?.substring(0, 100) },
        },
      });

      return post;
    }),
});
