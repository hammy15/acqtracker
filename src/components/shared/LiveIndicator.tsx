"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// LiveIndicator — a small pulsing "Live" badge
// ---------------------------------------------------------------------------

interface LiveIndicatorProps {
  /** Whether data is currently being polled / connection is active */
  isPolling: boolean;
  /** Optional: compact mode shows only the dot, no label */
  compact?: boolean;
  /** Optional: custom className */
  className?: string;
}

export function LiveIndicator({
  isPolling,
  compact = false,
  className,
}: LiveIndicatorProps) {
  if (!isPolling) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        className
      )}
      title="Data is syncing in real-time"
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>

      {/* Label */}
      {!compact && (
        <span className="text-[11px] font-medium text-emerald-600 tracking-wide uppercase">
          Live
        </span>
      )}
    </span>
  );
}
