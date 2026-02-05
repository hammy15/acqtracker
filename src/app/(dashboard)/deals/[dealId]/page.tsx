"use client";

import { useState, useCallback } from "react";
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
  X,
  Flag,
  ListChecks,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { WORKSTREAM_LIST } from "@/lib/constants";

const statusIcons: Record<string, React.ReactNode> = {
  NOT_STARTED: <div className="w-5 h-5 rounded-md border-2 border-surface-300 dark:border-surface-600" />,
  IN_PROGRESS: <Clock className="w-5 h-5 text-primary-500" />,
  BLOCKED: <AlertTriangle className="w-5 h-5 text-red-500" />,
  COMPLETE: (
    <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
      <Check className="w-3 h-3 text-white" />
    </div>
  ),
  NA: <X className="w-5 h-5 text-surface-400" />,
};

const phases = [
  { value: "", label: "All Phases" },
  { value: "PRE_CLOSE", label: "Pre-Close" },
  { value: "DAY_OF", label: "Day Of" },
  { value: "WEEK_1", label: "Week 1" },
  { value: "WEEK_2", label: "Week 2" },
];

const statuses = [
  { value: "", label: "All Status" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETE", label: "Complete" },
  { value: "NA", label: "N/A" },
];

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
          <div className="border-t border-surface-200 dark:border-surface-800">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="flex items-center gap-3 px-6 py-3 border-b border-surface-100 dark:border-surface-800/50"
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

export default function ChecklistPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [workstream, setWorkstream] = useState("");
  const [status, setStatus] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [collapsedWorkstreams, setCollapsedWorkstreams] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: tasks, isLoading } = trpc.tasks.listByDeal.useQuery(
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

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.listByDeal.invalidate({ dealId });
      utils.deals.getById.invalidate({ id: dealId });
    },
  });

  const handleToggleComplete = useCallback(
    (taskId: string, currentStatus: string) => {
      const newStatus = currentStatus === "COMPLETE" ? "NOT_STARTED" : "COMPLETE";
      updateStatus.mutate({ id: taskId, status: newStatus });
    },
    [updateStatus]
  );

  const toggleWorkstream = (name: string) => {
    const next = new Set(collapsedWorkstreams);
    next.has(name) ? next.delete(name) : next.add(name);
    setCollapsedWorkstreams(next);
  };

  const toggleSection = (key: string) => {
    const next = new Set(collapsedSections);
    next.has(key) ? next.delete(key) : next.add(key);
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

  return (
    <div className="space-y-4">
      {/* Task Summary */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-2 text-surface-700 dark:text-surface-200">
          <ListChecks className="w-4 h-4 text-primary-500" />
          <span className="font-semibold">{totalTasks}</span> tasks
        </span>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Check className="w-3.5 h-3.5" />
          {completedTasks} done
        </span>
        {inProgressTasks > 0 && (
          <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
            <Clock className="w-3.5 h-3.5" />
            {inProgressTasks} in progress
          </span>
        )}
        {blockedTasks > 0 && (
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            {blockedTasks} blocked
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
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
            {statuses.map((s) => (
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
          <ListChecks className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400">
            No tasks found matching your filters.
          </p>
        </div>
      )}

      {/* Checklist grouped by workstream */}
      {!isLoading && (
        <div className="space-y-4">
          {groupedTasks.map((ws) => {
            const allWsTasks = ws.sections.flatMap((s) => s.tasks);
            const wsDone = allWsTasks.filter(
              (t) => t.status === "COMPLETE" || t.status === "NA"
            ).length;
            const wsTotal = allWsTasks.length;
            const isCollapsed = collapsedWorkstreams.has(ws.name);

            return (
              <div key={ws.name} className="neu-card p-0 overflow-hidden">
                {/* Workstream Header */}
                <button
                  onClick={() => toggleWorkstream(ws.name)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                    <h3 className="text-base font-bold uppercase tracking-wide text-surface-800 dark:text-surface-100">
                      {ws.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-surface-500 dark:text-surface-400">
                      {wsDone}/{wsTotal}
                    </span>
                    <div className="w-24">
                      <ProgressBar value={wsDone} max={wsTotal} size="sm" />
                    </div>
                    <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                      {wsTotal > 0 ? Math.round((wsDone / wsTotal) * 100) : 0}%
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-surface-200 dark:border-surface-800">
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
                            className="w-full flex items-center justify-between px-6 py-2.5 bg-surface-50 dark:bg-surface-900/30 hover:bg-surface-100 dark:hover:bg-surface-900/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {sectionCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-surface-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-surface-400" />
                              )}
                              <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                                {section.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-surface-500 dark:text-surface-400">
                                {sDone}/{sTotal}
                              </span>
                              {allDone && (
                                <Check className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                          </button>

                          {/* Tasks */}
                          {!sectionCollapsed && (
                            <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
                              {section.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "flex items-center gap-3 px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors",
                                    task.status === "BLOCKED" &&
                                      "bg-red-50/50 dark:bg-red-950/10",
                                    selectedTask === task.id &&
                                      "bg-primary-50/50 dark:bg-primary-950/10"
                                  )}
                                >
                                  {/* Checkbox / Status toggle */}
                                  <button
                                    onClick={() =>
                                      handleToggleComplete(task.id, task.status)
                                    }
                                    className="shrink-0"
                                    disabled={updateStatus.isPending}
                                  >
                                    {statusIcons[task.status] || statusIcons.NOT_STARTED}
                                  </button>

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
                                        ? "line-through text-surface-400 dark:text-surface-500"
                                        : "text-surface-800 dark:text-surface-100"
                                    )}
                                  >
                                    {task.title}
                                  </button>

                                  {/* Blocked flag */}
                                  {task.status === "BLOCKED" && task.flagReason && (
                                    <span
                                      className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate"
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
                                    {/* Assignee avatar */}
                                    {task.assignedTo && (
                                      <span
                                        className="text-xs text-surface-500 dark:text-surface-400 w-16 text-right truncate"
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

                                    {/* Due date */}
                                    {task.dueDate && (
                                      <span className="text-xs text-surface-400 w-14 text-right">
                                        {new Date(task.dueDate).toLocaleDateString(
                                          "en-US",
                                          { month: "short", day: "numeric" }
                                        )}
                                      </span>
                                    )}

                                    {/* Files count */}
                                    {task._count?.files > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-surface-400">
                                        <Paperclip className="w-3 h-3" />
                                        {task._count.files}
                                      </span>
                                    )}

                                    {/* Comments count */}
                                    {task._count?.comments > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-surface-400">
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
