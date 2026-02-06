import { NextResponse } from "next/server";
import { anthropic } from "@/server/ai/anthropic";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const start = Date.now();
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello in 5 words." }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "n/a";
    return NextResponse.json({
      ok: true,
      ms: Date.now() - start,
      text,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      ms: Date.now() - start,
      error: error?.message || String(error),
      type: error?.constructor?.name,
    });
  }
}
