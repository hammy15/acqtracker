"use client";

import { Sparkles, X } from "lucide-react";
import { useAiChatStore } from "@/stores/aiChatStore";
import { AiChatPanel } from "./AiChatPanel";

export function AiChatBubble() {
  const { isOpen, toggle } = useAiChatStore();

  return (
    <>
      {/* Slide-out panel */}
      {isOpen && <AiChatPanel />}

      {/* Floating AI button — bottom-right, more prominent with label */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-3 text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.97] lg:hidden"
      >
        {isOpen ? (
          <>
            <X className="h-5 w-5" />
            <span className="text-sm font-semibold">Close</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold">Ask AI</span>
            {/* Pulse */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white/80" />
            </span>
          </>
        )}
      </button>
    </>
  );
}
