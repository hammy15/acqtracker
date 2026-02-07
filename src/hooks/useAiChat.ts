"use client";

import { useCallback } from "react";
import { useAiChatStore } from "@/stores/aiChatStore";

export function useAiChat() {
  const {
    messages,
    isStreaming,
    conversationId,
    dealContext,
    addMessage,
    updateLastAssistantMessage,
    setStreaming,
    setConversationId,
  } = useAiChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return;

      // Add user message
      const userMsg = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: content.trim(),
        createdAt: new Date(),
      };
      addMessage(userMsg);

      // Add placeholder assistant message
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "",
        createdAt: new Date(),
      };
      addMessage(assistantMsg);
      setStreaming(true);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000);

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            conversationId,
            dealId: dealContext?.id,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          let errorDetail = "";
          try {
            const errBody = await res.json();
            errorDetail = errBody.error || "";
          } catch {
            // ignore parse failure
          }

          if (res.status === 401) {
            throw new Error("Your session has expired. Please refresh the page and sign in again.");
          } else if (res.status === 429) {
            throw new Error("Too many requests. Please wait a moment and try again.");
          } else if (res.status >= 500) {
            throw new Error(errorDetail || "The AI service is temporarily unavailable. Please try again in a few seconds.");
          } else {
            throw new Error(errorDetail || `Request failed (${res.status}). Please try again.`);
          }
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Could not read response stream. Please try again.");

        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text") {
                fullContent += parsed.content;
                updateLastAssistantMessage(fullContent);
              } else if (parsed.type === "error") {
                throw new Error(parsed.content || "The AI encountered an error processing your request.");
              } else if (parsed.type === "done") {
                if (parsed.conversationId) {
                  setConversationId(parsed.conversationId);
                }
              }
            } catch (e) {
              // Re-throw actual errors (from error events above)
              if (e instanceof Error && e.message !== "Unexpected token") {
                throw e;
              }
              // Skip malformed JSON
            }
          }
        }

        // If we got through the stream but have no content, something went wrong
        if (!fullContent) {
          throw new Error("No response received from AI. Please try again.");
        }
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "AbortError"
            ? "Request timed out. The AI is taking too long — please try a simpler question."
            : err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.";
        updateLastAssistantMessage(message);
      } finally {
        setStreaming(false);
      }
    },
    [
      isStreaming,
      conversationId,
      dealContext,
      addMessage,
      updateLastAssistantMessage,
      setStreaming,
      setConversationId,
    ],
  );

  return { messages, isStreaming, sendMessage };
}
