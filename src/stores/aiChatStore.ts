import { create } from "zustand";

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface AiChatState {
  isOpen: boolean;
  isStreaming: boolean;
  messages: AiMessage[];
  conversationId: string | null;
  dealContext: { id: string; name: string } | null;

  toggle: () => void;
  open: () => void;
  close: () => void;
  setStreaming: (streaming: boolean) => void;
  addMessage: (msg: AiMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setConversationId: (id: string) => void;
  setDealContext: (ctx: { id: string; name: string } | null) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  isOpen: false,
  isStreaming: false,
  messages: [],
  conversationId: null,
  dealContext: null,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistantMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const lastIdx = msgs.findLastIndex((m) => m.role === "assistant");
      if (lastIdx >= 0) {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      }
      return { messages: msgs };
    }),
  setConversationId: (id) => set({ conversationId: id }),
  setDealContext: (ctx) => set({ dealContext: ctx }),
  clearMessages: () => set({ messages: [], conversationId: null }),
  reset: () =>
    set({
      isOpen: false,
      isStreaming: false,
      messages: [],
      conversationId: null,
      dealContext: null,
    }),
}));
