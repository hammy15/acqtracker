"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Upload,
  MessageCircle,
  UserPlus,
  AlertTriangle,
  Settings,
  Eye,
  Plus,
  Rss,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ActionType =
  | "DEAL_CREATED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "TASK_FLAGGED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "FILE_UPLOADED"
  | "COMMENT_ADDED"
  | "FEED_POST"
  | "STATUS_CHANGED";

const actionConfig: Record<ActionType, { icon: React.ReactNode; bg: string }> = {
  DEAL_CREATED: {
    icon: <Plus className="w-4 h-4 text-white" />,
    bg: "bg-primary-500",
  },
  TASK_CREATED: {
    icon: <Plus className="w-4 h-4 text-white" />,
    bg: "bg-blue-500",
  },
  TASK_COMPLETED: {
    icon: <CheckCircle2 className="w-4 h-4 text-white" />,
    bg: "bg-emerald-500",
  },
  TASK_FLAGGED: {
    icon: <AlertTriangle className="w-4 h-4 text-white" />,
    bg: "bg-red-500",
  },
  TASK_STATUS_CHANGED: {
    icon: <Eye className="w-4 h-4 text-white" />,
    bg: "bg-amber-500",
  },
  TASK_ASSIGNED: {
    icon: <UserPlus className="w-4 h-4 text-white" />,
    bg: "bg-purple-500",
  },
  FILE_UPLOADED: {
    icon: <Upload className="w-4 h-4 text-white" />,
    bg: "bg-blue-500",
  },
  COMMENT_ADDED: {
    icon: <MessageCircle className="w-4 h-4 text-white" />,
    bg: "bg-primary-500",
  },
  FEED_POST: {
    icon: <Rss className="w-4 h-4 text-white" />,
    bg: "bg-indigo-500",
  },
  STATUS_CHANGED: {
    icon: <Settings className="w-4 h-4 text-white" />,
    bg: "bg-surface-500",
  },
};

const actionLabels: Record<ActionType, string> = {
  DEAL_CREATED: "created the deal",
  TASK_CREATED: "created task",
  TASK_COMPLETED: "completed task",
  TASK_FLAGGED: "flagged as blocked",
  TASK_STATUS_CHANGED: "changed status of",
  TASK_ASSIGNED: "assigned",
  FILE_UPLOADED: "uploaded file",
  COMMENT_ADDED: "commented on",
  FEED_POST: "posted in feed",
  STATUS_CHANGED: "changed deal status to",
};

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateOnly.getTime() === today.getTime()) return "Today";
  if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActivitySkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((group) => (
        <div key={group}>
          <Skeleton className="h-3 w-20 mb-4" />
          <div className="space-y-0">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="w-px flex-1 bg-surface-200 dark:bg-surface-700 my-1" />
                </div>
                <div className="pb-6 min-w-0 flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const { data, isLoading } = trpc.activity.listByDeal.useQuery(
    { dealId, cursor: undefined, limit: 50 },
    { enabled: !!dealId }
  );

  const activities = data?.logs ?? [];

  // Group activities by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof activities> = {};

    for (const activity of activities) {
      const dateKey = formatDate(activity.timestamp);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    }

    return groups;
  }, [activities]);

  const getDetail = (activity: (typeof activities)[number]) => {
    if (activity.newValue) {
      if (typeof activity.newValue === "string") return activity.newValue;
      if (typeof activity.newValue === "object" && activity.newValue !== null) {
        const val = activity.newValue as Record<string, unknown>;
        // Try common keys: title, name, status, fileName, body
        return (
          (val.title as string) ??
          (val.name as string) ??
          (val.status as string) ??
          (val.fileName as string) ??
          (val.body as string) ??
          JSON.stringify(val)
        );
      }
    }
    if (activity.entityType) return `${activity.entityType} ${activity.entityId ?? ""}`.trim();
    return "";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary-500" />
          Activity Log
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Recent activity across all workstreams
        </p>
      </div>

      {/* Loading */}
      {isLoading && <ActivitySkeleton />}

      {/* Empty */}
      {!isLoading && activities.length === 0 && (
        <div className="neu-card text-center py-12">
          <Activity className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400">
            No activity yet for this deal.
          </p>
        </div>
      )}

      {/* Activity Timeline */}
      {!isLoading && activities.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dateActivities]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
                {date}
              </h3>
              <div className="space-y-0">
                {dateActivities.map((activity, i) => {
                  const action = activity.action as ActionType;
                  const config = actionConfig[action] ?? {
                    icon: <Activity className="w-4 h-4 text-white" />,
                    bg: "bg-surface-500",
                  };
                  const label = actionLabels[action] ?? activity.action;
                  const detail = getDetail(activity);
                  const isLast = i === dateActivities.length - 1;

                  return (
                    <div key={activity.id} className="flex gap-4">
                      {/* Timeline line + icon */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            config.bg
                          )}
                        >
                          {config.icon}
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-surface-200 dark:bg-surface-700 my-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-6 min-w-0">
                        <p className="text-sm text-surface-800 dark:text-surface-100">
                          <span className="font-semibold">
                            {activity.user?.name ?? "System"}
                          </span>{" "}
                          <span className="text-surface-500 dark:text-surface-400">
                            {label}
                          </span>{" "}
                          {detail && (
                            <span className="font-medium text-surface-700 dark:text-surface-200">
                              {detail}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-surface-400 mt-1">
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
