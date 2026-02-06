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
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            conversationId,
            dealId: dealContext?.id,
          }),
        });

        if (!res.ok) throw new Error("Failed to send message");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

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
              } else if (parsed.type === "done") {
                if (parsed.conversationId) {
                  setConversationId(parsed.conversationId);
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch {
        updateLastAssistantMessage(
          "Sorry, something went wrong. Please try again.",
        );
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
