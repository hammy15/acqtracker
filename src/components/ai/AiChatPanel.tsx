"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Loader2,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { useAiChat } from "@/hooks/useAiChat";
import { useAiChatStore } from "@/stores/aiChatStore";
import { cn } from "@/lib/utils";

export function AiChatPanel() {
  const { messages, isStreaming, sendMessage } = useAiChat();
  const { dealContext, clearMessages } = useAiChatStore();
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

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[400px] max-sm:inset-x-3 max-sm:bottom-20 max-sm:w-auto animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex h-[600px] max-sm:h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                AI Assistant
              </h3>
              {dealContext ? (
                <p className="text-[11px] text-teal-100">
                  Context: {dealContext.name}
                </p>
              ) : (
                <p className="text-[11px] text-teal-100">All deals</p>
              )}
            </div>
          </div>
          <button
            onClick={clearMessages}
            className="rounded-lg p-1.5 text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
            title="New conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-teal-500" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                How can I help?
              </h4>
              <p className="text-xs text-gray-500 mb-6">
                Ask about deals, tasks, OTA agreements, or anything related to
                your acquisitions.
              </p>
              <div className="space-y-2 w-full">
                {[
                  "How many active deals do we have?",
                  "What tasks are blocked?",
                  "Compare our deal progress",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-teal-500 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md",
                  )}
                >
                  {msg.content || (
                    <span className="inline-flex items-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking...
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-100 px-4 py-3"
        >
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white transition-all hover:bg-teal-600 disabled:opacity-30 disabled:hover:bg-teal-500"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
