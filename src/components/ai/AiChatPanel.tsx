"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Loader2,
  RotateCcw,
  MessageSquare,
  X,
  AlertCircle,
} from "lucide-react";
import { useAiChat } from "@/hooks/useAiChat";
import { useAiChatStore } from "@/stores/aiChatStore";
import { cn } from "@/lib/utils";

function isErrorMessage(content: string) {
  const errorPhrases = [
    "something went wrong",
    "session has expired",
    "too many requests",
    "temporarily unavailable",
    "request failed",
    "timed out",
    "no response received",
    "encountered an error",
  ];
  return errorPhrases.some((p) => content.toLowerCase().includes(p));
}

export function AiChatPanel() {
  const { messages, isStreaming, sendMessage } = useAiChat();
  const { dealContext, clearMessages, close } = useAiChatStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleRetry = () => {
    // Find the last user message and resend it
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the error message
      clearMessages();
      sendMessage(lastUserMsg.content);
    }
  };

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        onClick={close}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
      />

      {/* Slide-out panel — full height sidebar on desktop, near-full on mobile */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-in slide-in-from-right duration-300 lg:top-16">
        <div className="flex h-full flex-col bg-white shadow-2xl shadow-black/10 lg:border-l lg:border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-teal-500 via-teal-500 to-emerald-500 px-5 py-4 safe-top">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">
                  AI Assistant
                </h3>
                {dealContext ? (
                  <p className="text-[12px] text-teal-100/90">
                    Focused on: {dealContext.name}
                  </p>
                ) : (
                  <p className="text-[12px] text-teal-100/90">
                    All deals &bull; Ask anything
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="rounded-lg p-2 text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={close}
                className="rounded-lg p-2 text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center mb-5 shadow-sm">
                  <MessageSquare className="h-7 w-7 text-teal-500" />
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1.5">
                  How can I help?
                </h4>
                <p className="text-sm text-gray-500 mb-8 max-w-[280px]">
                  Ask about deals, tasks, OTA agreements, or anything about your
                  acquisitions.
                </p>
                <div className="space-y-2.5 w-full max-w-xs">
                  {[
                    {
                      q: "How many active deals do we have?",
                      icon: "📊",
                    },
                    {
                      q: "What tasks are blocked right now?",
                      icon: "🚧",
                    },
                    {
                      q: "Give me a status summary across all deals",
                      icon: "📋",
                    },
                    {
                      q: "Which deals close this month?",
                      icon: "📅",
                    },
                  ].map(({ q, icon }) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full flex items-center gap-3 text-left text-sm px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700 transition-all group"
                    >
                      <span className="text-base">{icon}</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {q}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isError =
                  msg.role === "assistant" && isErrorMessage(msg.content);
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50">
                        {isError ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-teal-500 text-white rounded-br-md"
                          : isError
                            ? "bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md",
                      )}
                    >
                      {msg.content ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-gray-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Thinking...
                        </span>
                      )}
                      {isError && !isStreaming && (
                        <button
                          onClick={handleRetry}
                          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Try again
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-100 px-5 py-4 safe-bottom"
          >
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your deals..."
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-white transition-all hover:bg-teal-600 disabled:opacity-30 disabled:hover:bg-teal-500"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              AI can make mistakes. Verify important information.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
