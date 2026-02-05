"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle,
  Hash,
  Send,
  Paperclip,
  AtSign,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

const channels = [
  { id: "general", name: "general", unread: 2 },
  { id: "admin", name: "admin", unread: 0 },
  { id: "operations", name: "operations", unread: 5 },
  { id: "accounting", name: "accounting", unread: 0 },
  { id: "documents", name: "documents", unread: 1 },
];

interface Message {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  channel: string;
}

const mockMessages: Message[] = [
  { id: "1", user: "Owen Richardson", avatar: "OR", text: "Just got off the phone with the seller. They confirmed the closing date of March 15th works for them.", time: "10:32 AM", channel: "general" },
  { id: "2", user: "Steve Anderson", avatar: "SA", text: "Great news. I'll update the timeline. Medicare app is almost done, should have it submitted by EOD.", time: "10:45 AM", channel: "general" },
  { id: "3", user: "Sarah Chen", avatar: "SC", text: "Financials look clean. AR aging report is uploaded to the files section. A few items to flag in tomorrow's call.", time: "11:02 AM", channel: "general" },
  { id: "4", user: "Tim Brooks", avatar: "TB", text: "Employee benefits comparison is ready for review. The current staff has slightly better dental coverage, so we need to figure out the transition plan.", time: "11:15 AM", channel: "general" },
  { id: "5", user: "Doug Martinez", avatar: "DM", text: "Rate structure analysis shows we can improve margins by ~8% with managed care renegotiation. Details in the ops channel.", time: "11:30 AM", channel: "general" },
  { id: "6", user: "Owen Richardson", avatar: "OR", text: "Perfect. Let's discuss all of this on the 2pm call. Everyone please review the files before then.", time: "11:45 AM", channel: "general" },
  { id: "7", user: "Steve Anderson", avatar: "SA", text: "Medicaid application has a few gaps. Need the DNS and Medical Director names ASAP.", time: "9:15 AM", channel: "admin" },
  { id: "8", user: "Doug Martinez", avatar: "DM", text: "Managed care contracts expire in 90 days. We should start renegotiation immediately post-close.", time: "10:00 AM", channel: "operations" },
];

const avatarColors: Record<string, string> = {
  OR: "bg-primary-500",
  SA: "bg-emerald-500",
  SC: "bg-purple-500",
  TB: "bg-amber-500",
  DM: "bg-blue-500",
  JP: "bg-red-500",
};

export default function ChatPage() {
  const params = useParams();
  const [activeChannel, setActiveChannel] = useState("general");
  const [message, setMessage] = useState("");

  const channelMessages = mockMessages.filter((m) => m.channel === activeChannel);

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
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
                activeChannel === ch.id
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
                  : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
              )}
            >
              <span className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" />
                {ch.name}
              </span>
              {ch.unread > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-500 text-white">
                  {ch.unread}
                </span>
              )}
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
            {activeChannel}
          </h3>
          <span className="text-xs text-surface-400 ml-2">
            {channelMessages.length} messages
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {channelMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-surface-400">
                No messages in #{activeChannel} yet.
              </p>
            </div>
          ) : (
            channelMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                    avatarColors[msg.avatar] || "bg-surface-500"
                  )}
                >
                  {msg.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                      {msg.user}
                    </span>
                    <span className="text-xs text-surface-400">{msg.time}</span>
                  </div>
                  <p className="text-sm text-surface-700 dark:text-surface-300 mt-0.5">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
              <Paperclip className="w-4 h-4 text-surface-400" />
            </button>
            <input
              type="text"
              placeholder={`Message #${activeChannel}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="neu-input flex-1 py-2"
            />
            <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
              <AtSign className="w-4 h-4 text-surface-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
              <Smile className="w-4 h-4 text-surface-400" />
            </button>
            <button className="neu-button-primary p-2.5">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
