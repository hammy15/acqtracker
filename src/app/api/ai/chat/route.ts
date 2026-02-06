import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { anthropic } from "@/server/ai/anthropic";
import { buildSystemPrompt } from "@/server/ai/dealContext";
import { aiTools, handleToolCall } from "@/server/ai/tools";
import { db } from "@/server/db";
import type { AppSession } from "@/types";
import type {
  MessageParam,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 4096;
const MAX_CONTEXT_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 10;

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const session = (await auth()) as AppSession | null;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // ── Parse body ────────────────────────────────────────────────────────
  let body: { message: string; conversationId?: string; dealId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { message, dealId } = body;
  let { conversationId } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // ── Conversation ──────────────────────────────────────────────────────
  if (!conversationId) {
    const conversation = await db.aiConversation.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        title: message.slice(0, 100),
        context: dealId ? "DEAL" : "GLOBAL",
        dealId: dealId ?? null,
      },
    });
    conversationId = conversation.id;
  } else {
    // Verify ownership
    const existing = await db.aiConversation.findFirst({
      where: { id: conversationId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
  }

  // ── Save user message ─────────────────────────────────────────────────
  await db.aiMessage.create({
    data: {
      conversationId,
      role: "user",
      content: message,
    },
  });

  // ── Load conversation history ─────────────────────────────────────────
  const previousMessages = await db.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: MAX_CONTEXT_MESSAGES,
  });

  const messages: MessageParam[] = previousMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // ── Build system prompt ───────────────────────────────────────────────
  const systemPrompt = await buildSystemPrompt(
    user.orgId,
    dealId ?? undefined
  );

  // ── Streaming response ────────────────────────────────────────────────
  const encoder = new TextEncoder();
  let fullAssistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        let currentMessages = [...messages];
        let toolRounds = 0;

        // Loop to handle multi-round tool use
        while (toolRounds <= MAX_TOOL_ROUNDS) {
          // Collect all content blocks from the streamed response so we can
          // reconstruct the full assistant message (text + tool_use blocks).
          const contentBlocks: ContentBlock[] = [];
          let blockIndex = -1;

          // Track per-block state for assembling tool_use input JSON
          const toolInputBuffers: Map<number, string> = new Map();
          const textBuffers: Map<number, string> = new Map();

          let stopReason: string | null = null;

          const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: currentMessages,
            tools: aiTools,
            stream: true,
          });

          for await (const event of response) {
            switch (event.type) {
              case "content_block_start": {
                blockIndex = event.index;
                if (event.content_block.type === "text") {
                  textBuffers.set(blockIndex, "");
                } else if (event.content_block.type === "tool_use") {
                  toolInputBuffers.set(blockIndex, "");
                }
                // Store a shallow copy; we will mutate text/input later.
                contentBlocks[blockIndex] = { ...event.content_block } as ContentBlock;
                break;
              }

              case "content_block_delta": {
                const idx = event.index;
                if (event.delta.type === "text_delta") {
                  const text = event.delta.text;
                  fullAssistantResponse += text;
                  textBuffers.set(
                    idx,
                    (textBuffers.get(idx) ?? "") + text
                  );
                  sendEvent({ type: "text", content: text });
                } else if (event.delta.type === "input_json_delta") {
                  toolInputBuffers.set(
                    idx,
                    (toolInputBuffers.get(idx) ?? "") + event.delta.partial_json
                  );
                }
                break;
              }

              case "content_block_stop": {
                const idx = event.index;
                const block = contentBlocks[idx];
                if (block && block.type === "text") {
                  (block as TextBlock).text = textBuffers.get(idx) ?? "";
                } else if (block && block.type === "tool_use") {
                  const raw = toolInputBuffers.get(idx) ?? "{}";
                  try {
                    (block as ToolUseBlock).input = JSON.parse(raw);
                  } catch {
                    (block as ToolUseBlock).input = {};
                  }
                }
                break;
              }

              case "message_delta": {
                if ("stop_reason" in event.delta) {
                  stopReason = (event.delta as { stop_reason: string }).stop_reason;
                }
                break;
              }
            }
          }

          // Determine if there were any tool_use blocks
          const toolUseBlocks = contentBlocks.filter(
            (b): b is ToolUseBlock => b.type === "tool_use"
          );

          if (toolUseBlocks.length === 0) {
            // No tool calls -- we're done
            break;
          }

          // ── Handle tool calls ───────────────────────────────────────
          // Append the full assistant message (with tool_use blocks) to history
          currentMessages.push({
            role: "assistant",
            content: contentBlocks,
          });

          // Execute each tool and collect results
          const toolResults: ToolResultBlockParam[] = [];
          for (const toolBlock of toolUseBlocks) {
            const result = await handleToolCall(
              toolBlock.name,
              toolBlock.input as Record<string, unknown>,
              user.orgId
            );
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolBlock.id,
              content: result,
            });
          }

          // Append tool results as a user message (Anthropic's convention)
          currentMessages.push({
            role: "user",
            content: toolResults,
          });

          toolRounds++;

          // If stop_reason is "end_turn" even though there were tool calls,
          // we still continue so the model can produce a final text response
          // after seeing the tool results.
        }

        // ── Save assistant response ───────────────────────────────────
        if (fullAssistantResponse.length > 0) {
          await db.aiMessage.create({
            data: {
              conversationId: conversationId!,
              role: "assistant",
              content: fullAssistantResponse,
            },
          });
        }

        // Update conversation timestamp
        await db.aiConversation.update({
          where: { id: conversationId! },
          data: { updatedAt: new Date() },
        });

        sendEvent({ type: "done", conversationId });
        controller.close();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        sendEvent({ type: "error", content: errorMessage });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
