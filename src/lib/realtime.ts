"use client";

import { useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Realtime event types for cross-tab communication
// ---------------------------------------------------------------------------

export type RealtimeEvent =
  | { type: "task-updated"; dealId: string; taskId: string }
  | { type: "task-completed"; dealId: string; taskId: string }
  | { type: "chat-message"; dealId: string; channelId: string }
  | { type: "deal-updated"; dealId: string }
  | { type: "presence-change"; userId: string; dealId: string; action: "join" | "leave" };

// ---------------------------------------------------------------------------
// BroadcastChannel singleton (cross-tab sync)
// ---------------------------------------------------------------------------

const CHANNEL_NAME = "acqtracker-realtime";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      // BroadcastChannel not supported (e.g. some older browsers)
      return null;
    }
  }
  return channel;
}

// ---------------------------------------------------------------------------
// Broadcast an event to all open tabs
// ---------------------------------------------------------------------------

export function broadcastEvent(event: RealtimeEvent) {
  getChannel()?.postMessage(event);
}

// ---------------------------------------------------------------------------
// Listen for events from other tabs
// ---------------------------------------------------------------------------

export function useRealtimeEvents(callback: (event: RealtimeEvent) => void) {
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    const ch = getChannel();
    if (!ch) return;

    const handler = (e: MessageEvent<RealtimeEvent>) => {
      stableCallback(e.data);
    };

    ch.addEventListener("message", handler);
    return () => ch.removeEventListener("message", handler);
  }, [stableCallback]);
}

// ---------------------------------------------------------------------------
// Visibility-change helper
// ---------------------------------------------------------------------------

export function useVisibilityChange(onVisible: () => void) {
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        onVisible();
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [onVisible]);
}

// ---------------------------------------------------------------------------
// Window focus helper
// ---------------------------------------------------------------------------

export function useWindowFocus(onFocus: () => void) {
  useEffect(() => {
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [onFocus]);
}
