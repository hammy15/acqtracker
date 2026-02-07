"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Paperclip,
  MessageCircle,
  Check,
  AlertTriangle,
  Clock,
  // X,
  Flag,
  ListChecks,
  Circle,
  Ban,
  Eye,
  Hourglass,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { PresenceIndicator } from "@/components/shared/PresenceIndicator";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { WORKSTREAM_LIST } from "@/lib/constants";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { broadcastEvent } from "@/lib/realtime";

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  {
    value: "NOT_STARTED",
    label: "Not Started",
    icon: <Circle className="w-3.5 h-3.5" />,
    iconColor: "text-gray-400",
    bg: "bg-gray-50",
    ring: "ring-gray-200",
  },
  {
    value: "IN_PROGRESS",
    label: "Working",
    icon: <Clock className="w-3.5 h-3.5" />,
    iconColor: "text-teal-500",
    bg: "bg-teal-50",
    ring: "ring-teal-200",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
    icon: <Eye className="w-3.5 h-3.5" />,
    iconColor: "text-violet-500",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
  },
  {
    value: "WAITING",
    label: "Waiting",
    icon: <Hourglass className="w-3.5 h-3.5" />,
    iconColor: "text-amber-500",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  {
    value: "BLOCKED",
    label: "Blocked",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    ring: "ring-red-200",
  },
  {
    value: "COMPLETE",
    label: "Done",
    icon: <Check className="w-3.5 h-3.5" />,
    iconColor: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  {
    value: "NA",
    label: "N/A",
    icon: <Ban className="w-3.5 h-3.5" />,
    iconColor: "text-gray-400",
    bg: "bg-gray-50",
    ring: "ring-gray-200",
  },
] as const;

const statusMap = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

// ---------------------------------------------------------------------------
// StatusDropdown component
// ---------------------------------------------------------------------------

function StatusDropdown({
  currentStatus,
  onChangeStatus,
  disabled,
}: {
  currentStatus: string;
  onChangeStatus: (status: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = statusMap[currentStatus] ?? statusMap.NOT_STARTED;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen(!open);
        }}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all",
          "ring-1 ring-inset",
          current.bg,
          current.ring,
          current.iconColor,
          "hover:shadow-sm",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {current.icon}
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl bg-white border border-gray-200 shadow-lg shadow-black/5 py-1 animate-scale-in">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors",
                currentStatus === opt.value
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className={opt.iconColor}>{opt.icon}</span>
              {opt.label}
              {currentStatus === opt.value && (
                <Check className="w-3 h-3 ml-auto text-teal-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const phases = [
  { value: "", label: "All Phases" },
  { value: "PRE_CLOSE", label: "Pre-Close" },
  { value: "DAY_OF", label: "Day Of" },
  { value: "WEEK_1", label: "Week 1" },
  { value: "WEEK_2", label: "Week 2" },
];

const filterStatuses = [
  { value: "", label: "All Status" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "Working" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "WAITING", label: "Waiting" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETE", label: "Done" },
  { value: "NA", label: "N/A" },
];

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="neu-card p-0 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-2 w-24 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <div className="border-t border-gray-200">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="flex items-center gap-3 px-6 py-3 border-b border-gray-100"
              >
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-4 flex-1 max-w-md" />
                <Skeleton className="h-4 w-16 hidden sm:block" />
                <Skeleton className="h-4 w-14 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChecklistPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [workstream, setWorkstream] = useState("");
  const [status, setStatus] = useState("");
  const [assignedToId] = useState("");
  const [collapsedWorkstreams, setCollapsedWorkstreams] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const tasksQuery = trpc.tasks.listByDeal.useQuery(
    {
      dealId,
      phase: phase || undefined,
      workstream: workstream || undefined,
      status: status || undefined,
      assignedToId: assignedToId || undefined,
      search: searchQuery || undefined,
    },
    { enabled: !!dealId }
  );

  const { data: tasks, isLoading } = tasksQuery;

  // Smart polling: refetch on focus, visibility, cross-tab events, + 10s polling
  useRealtimeQuery(tasksQuery, {
    pollingInterval: 10_000,
    eventFilter: (e) =>
      (e.type === "task-updated" || e.type === "task-completed") &&
      e.dealId === dealId,
  });

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: (_data, variables) => {
      utils.tasks.listByDeal.invalidate({ dealId });
      utils.deals.getById.invalidate({ id: dealId });
      // Broadcast to other tabs
      broadcastEvent({
        type: variables.status === "COMPLETE" ? "task-completed" : "task-updated",
        dealId,
        taskId: variables.id,
      });
    },
  });

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: string) => {
      updateStatus.mutate({ id: taskId, status: newStatus as any });
    },
    [updateStatus]
  );

  const toggleWorkstream = (name: string) => {
    const next = new Set(collapsedWorkstreams);
    if (next.has(name)) { next.delete(name); } else { next.add(name); }
    setCollapsedWorkstreams(next);
  };

  const toggleSection = (key: string) => {
    const next = new Set(collapsedSections);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    setCollapsedSections(next);
  };

  // Group tasks by workstream, then by section
  const groupedTasks = (() => {
    if (!tasks) return [];

    const wsMap: Record<
      string,
      {
        name: string;
        sections: Record<
          string,
          { name: string; tasks: typeof tasks }
        >;
      }
    > = {};

    for (const task of tasks) {
      const wsName = task.workstream || "Other";
      if (!wsMap[wsName]) {
        wsMap[wsName] = { name: wsName, sections: {} };
      }
      const sectionName = task.section || "General";
      if (!wsMap[wsName].sections[sectionName]) {
        wsMap[wsName].sections[sectionName] = { name: sectionName, tasks: [] };
      }
      wsMap[wsName].sections[sectionName].tasks.push(task);
    }

    return Object.values(wsMap).map((ws) => ({
      name: ws.name,
      sections: Object.values(ws.sections),
    }));
  })();

  // Summary counts
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "COMPLETE" || t.status === "NA").length ?? 0;
  const blockedTasks = tasks?.filter((t) => t.status === "BLOCKED").length ?? 0;
  const inProgressTasks = tasks?.filter((t) => t.status === "IN_PROGRESS").length ?? 0;
  const underReviewTasks = tasks?.filter((t) => t.status === "UNDER_REVIEW").length ?? 0;
  const waitingTasks = tasks?.filter((t) => t.status === "WAITING").length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header: Presence + Live indicator */}
      <div className="flex items-center justify-between">
        <PresenceIndicator dealId={dealId} />
        <LiveIndicator isPolling={true} />
      </div>

      {/* Task Summary */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-2 text-gray-700">
          <ListChecks className="w-4 h-4 text-teal-500" />
          <span className="font-semibold">{totalTasks}</span> tasks
        </span>
        <span className="flex items-center gap-1.5 text-emerald-600">
          <Check className="w-3.5 h-3.5" />
          {completedTasks} done
        </span>
        {inProgressTasks > 0 && (
          <span className="flex items-center gap-1.5 text-teal-600">
            <Clock className="w-3.5 h-3.5" />
            {inProgressTasks} working
          </span>
        )}
        {underReviewTasks > 0 && (
          <span className="flex items-center gap-1.5 text-violet-600">
            <Eye className="w-3.5 h-3.5" />
            {underReviewTasks} under review
          </span>
        )}
        {waitingTasks > 0 && (
          <span className="flex items-center gap-1.5 text-amber-600">
            <Hourglass className="w-3.5 h-3.5" />
            {waitingTasks} waiting
          </span>
        )}
        {blockedTasks > 0 && (
          <span className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            {blockedTasks} blocked
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-input pl-10 py-2"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="neu-input w-auto py-2 text-sm"
          >
            {phases.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={workstream}
            onChange={(e) => setWorkstream(e.target.value)}
            className="neu-input w-auto py-2 text-sm"
          >
            <option value="">All Workstreams</option>
            {WORKSTREAM_LIST.map((ws) => (
              <option key={ws} value={ws}>
                {ws}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="neu-input w-auto py-2 text-sm"
          >
            {filterStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <ChecklistSkeleton />}

      {/* Empty State */}
      {!isLoading && totalTasks === 0 && (
        <div className="neu-card text-center py-12">
          <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No tasks found matching your filters.
          </p>
        </div>
      )}

      {/* Checklist grouped by workstream */}
      {!isLoading && (
        <div className="space-y-5">
          {groupedTasks.map((ws) => {
            const allWsTasks = ws.sections.flatMap((s) => s.tasks);
            const wsDone = allWsTasks.filter(
              (t) => t.status === "COMPLETE" || t.status === "NA"
            ).length;
            const wsTotal = allWsTasks.length;
            const isCollapsed = collapsedWorkstreams.has(ws.name);

            return (
              <div
                key={ws.name}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm shadow-black/[0.03] overflow-hidden"
              >
                {/* Workstream Header */}
                <button
                  onClick={() => toggleWorkstream(ws.name)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                      {ws.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {wsDone}/{wsTotal}
                    </span>
                    <div className="w-24">
                      <ProgressBar value={wsDone} max={wsTotal} size="sm" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {wsTotal > 0 ? Math.round((wsDone / wsTotal) * 100) : 0}%
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-gray-200">
                    {ws.sections.map((section) => {
                      const sectionKey = `${ws.name}:${section.name}`;
                      const sectionCollapsed = collapsedSections.has(sectionKey);
                      const sDone = section.tasks.filter(
                        (t) => t.status === "COMPLETE" || t.status === "NA"
                      ).length;
                      const sTotal = section.tasks.length;
                      const allDone = sDone === sTotal && sTotal > 0;

                      return (
                        <div key={sectionKey}>
                          {/* Section Header */}
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="w-full flex items-center justify-between px-6 py-2.5 bg-gray-50/50 hover:bg-gray-100/60 transition-colors border-b border-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              {sectionCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm font-semibold text-gray-700">
                                {section.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {sDone}/{sTotal}
                              </span>
                              {allDone && (
                                <Check className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                          </button>

                          {/* Tasks */}
                          {!sectionCollapsed && (
                            <div className="divide-y divide-gray-100">
                              {section.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "flex items-center gap-3 px-6 py-3 transition-colors",
                                    task.status === "BLOCKED"
                                      ? "bg-red-50/40"
                                      : "hover:bg-gray-50/60",
                                    selectedTask === task.id &&
                                      "bg-teal-50/40"
                                  )}
                                >
                                  {/* Status dropdown */}
                                  <StatusDropdown
                                    currentStatus={task.status}
                                    onChangeStatus={(s) =>
                                      handleStatusChange(task.id, s)
                                    }
                                    disabled={updateStatus.isPending}
                                  />

                                  {/* Title */}
                                  <button
                                    onClick={() =>
                                      setSelectedTask(
                                        task.id === selectedTask ? null : task.id
                                      )
                                    }
                                    className={cn(
                                      "flex-1 text-sm text-left",
                                      task.status === "COMPLETE"
                                        ? "line-through text-gray-400"
                                        : "text-gray-800"
                                    )}
                                  >
                                    {task.title}
                                  </button>

                                  {/* Blocked flag */}
                                  {task.status === "BLOCKED" && task.flagReason && (
                                    <span
                                      className="flex items-center gap-1 text-xs text-red-600 max-w-[200px] truncate"
                                      title={task.flagReason}
                                    >
                                      <Flag className="w-3 h-3 shrink-0" />
                                      {task.flagReason}
                                    </span>
                                  )}

                                  {/* Priority badge */}
                                  {task.priority && task.priority !== "MEDIUM" && (
                                    <StatusBadge status={task.priority} />
                                  )}

                                  {/* Meta */}
                                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                                    {task.assignedTo && (
                                      <span
                                        className="text-xs text-gray-500 w-16 text-right truncate"
                                        title={task.assignedTo.name}
                                      >
                                        {task.assignedTo.avatar ? (
                                          <img
                                            src={task.assignedTo.avatar}
                                            alt={task.assignedTo.name}
                                            className="w-5 h-5 rounded-full inline-block mr-1"
                                          />
                                        ) : null}
                                        {task.assignedTo.name.split(" ")[0]}
                                      </span>
                                    )}

                                    {task.dueDate && (
                                      <span className="text-xs text-gray-400 w-14 text-right">
                                        {new Date(task.dueDate).toLocaleDateString(
                                          "en-US",
                                          { month: "short", day: "numeric" }
                                        )}
                                      </span>
                                    )}

                                    {task._count?.files > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Paperclip className="w-3 h-3" />
                                        {task._count.files}
                                      </span>
                                    )}

                                    {task._count?.comments > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <MessageCircle className="w-3 h-3" />
                                        {task._count.comments}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
