"use client";

import { usePresence, type PresenceUser } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// PresenceIndicator — shows online users as colored avatar dots
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 5;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  IDLE: "bg-amber-400",
  OFFLINE: "bg-gray-300",
};

const statusRingColors: Record<string, string> = {
  ACTIVE: "ring-emerald-500/30",
  IDLE: "ring-amber-400/30",
  OFFLINE: "ring-gray-300/30",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarBg(name: string): string {
  const colors = [
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
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Single avatar bubble
// ---------------------------------------------------------------------------

function UserBubble({ user }: { user: PresenceUser }) {
  const statusColor = statusColors[user.status] ?? statusColors.OFFLINE;
  const ringColor = statusRingColors[user.status] ?? statusRingColors.OFFLINE;

  return (
    <div className="relative group" title={`${user.name} (${user.status.toLowerCase()})`}>
      {/* Avatar */}
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
        />
      ) : (
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white",
            getAvatarBg(user.name)
          )}
        >
          {getInitials(user.name)}
        </div>
      )}

      {/* Status dot */}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white",
          statusColor
        )}
      />

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {user.name}
        <span className="ml-1.5 text-gray-400">
          {user.status === "ACTIVE" ? "online" : user.status.toLowerCase()}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PresenceIndicatorProps {
  dealId: string;
}

export function PresenceIndicator({ dealId }: PresenceIndicatorProps) {
  const { onlineUsers } = usePresence(dealId);

  // Filter to ACTIVE or IDLE users only
  const visibleUsers = onlineUsers.filter(
    (u) => u.status === "ACTIVE" || u.status === "IDLE"
  );

  if (visibleUsers.length === 0) return null;

  const shown = visibleUsers.slice(0, MAX_VISIBLE);
  const overflow = visibleUsers.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-1">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {shown.map((user) => (
          <UserBubble key={user.userId} user={user} />
        ))}
        {overflow > 0 && (
          <div
            className="w-7 h-7 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] font-semibold text-gray-500"
            title={`${overflow} more user${overflow > 1 ? "s" : ""}`}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Online count label */}
      <span className="text-xs text-gray-500 ml-1.5 hidden sm:inline">
        {visibleUsers.length} online
      </span>
    </div>
  );
}
