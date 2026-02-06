"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  useRealtimeEvents,
  useVisibilityChange,
  useWindowFocus,
  type RealtimeEvent,
} from "@/lib/realtime";

// ---------------------------------------------------------------------------
// useRealtimeQuery — wraps any tRPC query result with smart refetching
// ---------------------------------------------------------------------------

interface UseRealtimeQueryOptions {
  /** Polling interval in ms. Set to 0 or omit to disable polling. */
  pollingInterval?: number;
  /** Whether realtime features are enabled (default: true) */
  enabled?: boolean;
  /** Optional filter: only refetch when a matching event arrives */
  eventFilter?: (event: RealtimeEvent) => boolean;
}

interface QueryHandle {
  refetch: () => void;
}

export function useRealtimeQuery(
  queryHandle: QueryHandle,
  options: UseRealtimeQueryOptions = {}
) {
  const { pollingInterval = 0, enabled = true, eventFilter } = options;
  const refetchRef = useRef(queryHandle.refetch);
  refetchRef.current = queryHandle.refetch;

  // Stable refetch function
  const doRefetch = useCallback(() => {
    refetchRef.current();
  }, []);

  // ── Refetch on window focus ──────────────────────────────────────────
  useWindowFocus(
    useCallback(() => {
      if (enabled) doRefetch();
    }, [enabled, doRefetch])
  );

  // ── Refetch on visibility change (tab becomes active) ───────────────
  useVisibilityChange(
    useCallback(() => {
      if (enabled) doRefetch();
    }, [enabled, doRefetch])
  );

  // ── Refetch on BroadcastChannel events from other tabs ──────────────
  useRealtimeEvents(
    useCallback(
      (event: RealtimeEvent) => {
        if (!enabled) return;
        if (eventFilter && !eventFilter(event)) return;
        doRefetch();
      },
      [enabled, eventFilter, doRefetch]
    )
  );

  // ── Optional polling interval ───────────────────────────────────────
  useEffect(() => {
    if (!enabled || !pollingInterval || pollingInterval <= 0) return;

    const interval = setInterval(() => {
      // Only poll when the tab is visible to save resources
      if (document.visibilityState === "visible") {
        doRefetch();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enabled, pollingInterval, doRefetch]);
}
