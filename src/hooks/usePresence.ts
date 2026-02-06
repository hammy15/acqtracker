"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { broadcastEvent } from "@/lib/realtime";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresenceUser {
  userId: string;
  name: string;
  avatar?: string | null;
  status: "ACTIVE" | "IDLE" | "OFFLINE";
  lastSeenAt: string;
}

// ---------------------------------------------------------------------------
// usePresence — tRPC-based presence for Vercel serverless deployment
//
// Sends a heartbeat every 30s via tRPC mutation (updatePresence).
// Polls getPresence every 15s to see who else is online.
// Tracks active/idle state via mouse/keyboard/touch events.
// ---------------------------------------------------------------------------

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const PRESENCE_POLL_INTERVAL = 15_000; // 15 seconds

export function usePresence(dealId: string | null) {
  const [currentStatus, setCurrentStatus] = useState<"ACTIVE" | "IDLE" | "OFFLINE">("ACTIVE");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<"ACTIVE" | "IDLE" | "OFFLINE">("ACTIVE");
  const dealIdRef = useRef(dealId);
  dealIdRef.current = dealId;

  // ── tRPC mutation for heartbeat ─────────────────────────────────────
  const updatePresence = trpc.chat.updatePresence.useMutation();
  const mutateRef = useRef(updatePresence.mutate);
  mutateRef.current = updatePresence.mutate;

  // ── tRPC query for presence list ────────────────────────────────────
  const { data: presenceData, refetch: refetchPresence } =
    trpc.chat.getPresence.useQuery(
      { dealId: dealId! },
      {
        enabled: !!dealId,
        refetchInterval: PRESENCE_POLL_INTERVAL,
        refetchIntervalInBackground: false,
      }
    );

  const onlineUsers: PresenceUser[] = (presenceData ?? []).map((p: any) => ({
    userId: p.userId,
    name: p.user?.name ?? "Unknown",
    avatar: p.user?.avatar ?? null,
    status: p.status as "ACTIVE" | "IDLE" | "OFFLINE",
    lastSeenAt: p.lastSeenAt?.toISOString?.() ?? String(p.lastSeenAt),
  }));

  // ── Send heartbeat (stable — uses refs, no deps that change) ──────
  const sendHeartbeat = useRef((status: "ACTIVE" | "IDLE" | "OFFLINE") => {
    const id = dealIdRef.current;
    if (!id) return;
    statusRef.current = status;
    setCurrentStatus(status);
    mutateRef.current(
      { dealId: id, status },
      {
        onSuccess: () => {
          broadcastEvent({
            type: "presence-change",
            userId: "",
            dealId: id,
            action: status === "OFFLINE" ? "leave" : "join",
          });
        },
      }
    );
  }).current;

  // ── Reset idle timer on user activity ───────────────────────────────
  const resetIdle = useRef(() => {
    if (statusRef.current !== "ACTIVE") {
      sendHeartbeat("ACTIVE");
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      sendHeartbeat("IDLE");
    }, IDLE_TIMEOUT);
  }).current;

  // ── Setup heartbeat + activity tracking ─────────────────────────────
  useEffect(() => {
    if (!dealId) return;

    // Initial heartbeat
    sendHeartbeat("ACTIVE");

    // Periodic heartbeat
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(statusRef.current);
    }, HEARTBEAT_INTERVAL);

    // Idle detection
    idleTimerRef.current = setTimeout(() => {
      sendHeartbeat("IDLE");
    }, IDLE_TIMEOUT);

    // Activity listeners
    const events = ["mousemove", "keydown", "touchstart", "scroll"] as const;
    events.forEach((evt) => window.addEventListener(evt, resetIdle));

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetIdle));
      sendHeartbeat("OFFLINE");
    };
  }, [dealId, sendHeartbeat, resetIdle]);

  // ── Handle tab visibility ───────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (!dealIdRef.current) return;
      if (document.visibilityState === "visible") {
        sendHeartbeat("ACTIVE");
        refetchPresence();
      } else {
        sendHeartbeat("IDLE");
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [sendHeartbeat, refetchPresence]);

  return {
    onlineUsers,
    currentStatus,
    refetchPresence,
  };
}
