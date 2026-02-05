"use client";

import { useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";

interface PresenceUser {
  userId: string;
  name: string;
  avatar?: string;
  status: "ACTIVE" | "IDLE" | "OFFLINE";
  lastSeenAt: string;
}

export function usePresence(dealId: string | null) {
  const { socket, isConnected } = useSocket(
    dealId ? `transition/${dealId}` : undefined
  );

  const updatePresence = useCallback(
    (status: "ACTIVE" | "IDLE" | "OFFLINE") => {
      if (socket && isConnected && dealId) {
        socket.emit("presence:update", { dealId, status });
      }
    },
    [socket, isConnected, dealId]
  );

  // Auto-track active/idle
  useEffect(() => {
    if (!dealId) return;

    updatePresence("ACTIVE");

    let idleTimer: NodeJS.Timeout;

    const resetIdle = () => {
      updatePresence("ACTIVE");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => updatePresence("IDLE"), 5 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("touchstart", resetIdle);

    idleTimer = setTimeout(() => updatePresence("IDLE"), 5 * 60 * 1000);

    return () => {
      clearTimeout(idleTimer);
      updatePresence("OFFLINE");
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, [dealId, updatePresence]);

  return { isConnected, updatePresence };
}

export type { PresenceUser };
