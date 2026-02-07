"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle,
  Hash,
  Send,
  Paperclip,
  AtSign,
  Smile,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { broadcastEvent } from "@/lib/realtime";
import { LiveIndicator } from "@/components/shared/LiveIndicator";

const avatarColors = [
  "bg-primary-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ChannelsSkeleton() {
  return (
    <div className="py-2 space-y-1 px-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-2">
          <Skeleton className="w-3.5 h-3.5 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-5 px-6 py-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Fetch channels
  const { data: channels, isLoading: channelsLoading } =
    trpc.chat.getChannels.useQuery({ dealId }, { enabled: !!dealId });

  // Auto-select first channel when loaded
  const firstChannelId = channels?.[0]?.id ?? null;
  useEffect(() => {
    if (firstChannelId && !activeChannelId) {
      setActiveChannelId(firstChannelId);
    }
  }, [firstChannelId, activeChannelId]);

  // Fetch messages for active channel with 5s polling for real-time chat
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { channelId: activeChannelId!, cursor: undefined, limit: 50 },
    { enabled: !!activeChannelId }
  );

  const { data: messagesData, isLoading: messagesLoading } = messagesQuery;

  // Smart polling: 5s for active chat + cross-tab sync
  useRealtimeQuery(messagesQuery, {
    pollingInterval: 5_000,
    enabled: !!activeChannelId,
    eventFilter: (e) =>
      e.type === "chat-message" && e.dealId === dealId,
  });

  const messages = messagesData?.messages ?? [];

  // Send message mutation
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      if (activeChannelId) {
        utils.chat.getMessages.invalidate({ channelId: activeChannelId });
        // Broadcast to other tabs
        broadcastEvent({
          type: "chat-message",
          dealId,
          channelId: activeChannelId,
        });
      }
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activeChannelId) return;
    sendMessage.mutate({
      channelId: activeChannelId,
      body: message.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeChannel = channels?.find((ch) => ch.id === activeChannelId);

  return (
    <div className="flex gap-0 max-w-6xl mx-auto h-[calc(100vh-220px)] min-h-[500px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 neu-card rounded-r-none border-r-0 p-0 flex flex-col">
        <div className="px-4 py-4 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary-500" />
            Channels
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {channelsLoading && <ChannelsSkeleton />}
          {!channelsLoading && channels && channels.length === 0 && (
            <p className="px-4 py-6 text-xs text-surface-400 text-center">
              No channels yet
            </p>
          )}
          {channels?.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
                activeChannelId === ch.id
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
                  : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
              )}
            >
              <span className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" />
                {ch.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 neu-card rounded-l-none p-0 flex flex-col">
        {/* Channel Header */}
        <div className="px-6 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
          <Hash className="w-4 h-4 text-surface-400" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
            {activeChannel?.name ?? "Select a channel"}
          </h3>
          {activeChannel?.channelType && (
            <span className="text-xs text-surface-400 ml-2">
              {activeChannel.channelType}
            </span>
          )}
          <div className="ml-auto">
            <LiveIndicator isPolling={!!activeChannelId} compact />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {messagesLoading && <MessagesSkeleton />}

          {!messagesLoading && !activeChannelId && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-surface-400">
                Select a channel to start chatting.
              </p>
            </div>
          )}

          {!messagesLoading && activeChannelId && messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-surface-400">
                No messages in #{activeChannel?.name} yet.
              </p>
            </div>
          )}

          {!messagesLoading &&
            messages.map((msg) => {
              if (msg.isSystemMessage) {
                return (
                  <div
                    key={msg.id}
                    className="text-center text-xs text-surface-400 dark:text-surface-500 py-1"
                  >
                    {msg.body}
                  </div>
                );
              }

              const userName = msg.user?.name ?? "Unknown";
              const initials = getInitials(userName);
              const color = getAvatarColor(userName);

              return (
                <div key={msg.id} className="flex gap-3">
                  {msg.user?.avatar ? (
                    <img
                      src={msg.user.avatar}
                      alt={userName}
                      className="w-8 h-8 rounded-full shrink-0 object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                        color
                      )}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                        {userName}
                      </span>
                      <span className="text-xs text-surface-400">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300 mt-0.5 whitespace-pre-wrap">
                      {msg.body}
                    </p>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
              <Paperclip className="w-4 h-4 text-surface-400" />
            </button>
            <input
              type="text"
              placeholder={
                activeChannel
                  ? `Message #${activeChannel.name}...`
                  : "Select a channel..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeChannelId || sendMessage.isPending}
              className="neu-input flex-1 py-2"
            />
            <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
              <AtSign className="w-4 h-4 text-surface-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
              <Smile className="w-4 h-4 text-surface-400" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || !activeChannelId || sendMessage.isPending}
              className={cn(
                "neu-button-primary p-2.5",
                (!message.trim() || !activeChannelId) && "opacity-50 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
