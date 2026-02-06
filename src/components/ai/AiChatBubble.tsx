"use client";

import { Bot, X } from "lucide-react";
import { useAiChatStore } from "@/stores/aiChatStore";
import { AiChatPanel } from "./AiChatPanel";

export function AiChatBubble() {
  const { isOpen, toggle } = useAiChatStore();

  return (
    <>
      {/* Chat Panel */}
      {isOpen && <AiChatPanel />}

      {/* Floating Bubble */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-teal-500/30 active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Bot className="h-6 w-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-teal-400 opacity-20" />
          </>
        )}
      </button>
    </>
  );
}
