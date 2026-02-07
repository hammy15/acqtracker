"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const PHASE_ORDER = ["PRE_CLOSE", "DAY_OF", "WEEK_1", "WEEK_2"] as const;
const PHASE_LABELS: Record<string, string> = {
  PRE_CLOSE: "Pre-Close",
  DAY_OF: "Day Of",
  WEEK_1: "Week 1",
  WEEK_2: "Week 2",
};

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  COMPLETE: { bar: "bg-emerald-500", text: "text-emerald-600" },
  IN_PROGRESS: { bar: "bg-sky-500", text: "text-sky-600" },
  UNDER_REVIEW: { bar: "bg-violet-500", text: "text-violet-600" },
  WAITING: { bar: "bg-amber-400", text: "text-amber-600" },
  BLOCKED: { bar: "bg-red-500", text: "text-red-600" },
  NOT_STARTED: { bar: "bg-gray-300", text: "text-gray-500" },
  NA: { bar: "bg-gray-200", text: "text-gray-400" },
};

const PRIORITY_INDICATOR: Record<string, string> = {
  CRITICAL: "border-l-red-500",
  HIGH: "border-l-amber-500",
  MEDIUM: "border-l-sky-400",
  LOW: "border-l-gray-300",
};

type Task = {
  id: string;
  title: string;
  workstream: string;
  section: string | null;
  phase: string;
  status: string;
  priority: string;
  dueDate: Date | string | null;
  completedDate: Date | string | null;
  createdAt: Date | string;
  assignedTo: { id: string; name: string | null } | null;
};

type WorkstreamGroup = {
  name: string;
  tasks: Task[];
  stats: { total: number; complete: number; blocked: number };
};

export default function TimelinePage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(new Set());
  const [phaseFilter, setPhaseFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: deal } = trpc.deals.getById.useQuery(
    { id: dealId },
    { enabled: !!dealId }
  );

  const { data: tasks, isLoading } = trpc.tasks.listByDeal.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  // Compute date range for the Gantt
  const { minDate, maxDate, totalDays, workstreams, phaseRanges, todayOffset } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(),
        totalDays: 1,
        workstreams: [] as WorkstreamGroup[],
        phaseRanges: [] as { phase: string; startPct: number; widthPct: number }[],
        todayOffset: 0,
      };
    }

    // Collect all dates
    const dates: Date[] = [];
    const now = new Date();
    dates.push(now);

    for (const t of tasks) {
      if (t.dueDate) dates.push(new Date(t.dueDate));
      if (t.completedDate) dates.push(new Date(t.completedDate));
      dates.push(new Date(t.createdAt));
    }

    if (deal?.targetCloseDate) {
      dates.push(new Date(deal.targetCloseDate));
    }

    const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
    // Add padding of 7 days on each side
    const min = new Date(sorted[0]);
    min.setDate(min.getDate() - 7);
    const max = new Date(sorted[sorted.length - 1]);
    max.setDate(max.getDate() + 14);

    const total = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));

    // Today offset
    const todayOff = Math.max(0, Math.ceil((now.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));

    // Filter tasks
    let filteredTasks = tasks as unknown as Task[];
    if (phaseFilter !== "ALL") {
      filteredTasks = filteredTasks.filter((t) => t.phase === phaseFilter);
    }
    if (statusFilter !== "ALL") {
      filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
    }

    // Group by workstream
    const wsMap = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const ws = t.workstream;
      if (!wsMap.has(ws)) wsMap.set(ws, []);
      wsMap.get(ws)!.push(t);
    }

    const wsGroups: WorkstreamGroup[] = Array.from(wsMap.entries())
      .map(([name, wsTasks]) => ({
        name,
        tasks: wsTasks.sort((a, b) => {
          const phaseA = PHASE_ORDER.indexOf(a.phase as any);
          const phaseB = PHASE_ORDER.indexOf(b.phase as any);
          if (phaseA !== phaseB) return phaseA - phaseB;
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return dateA - dateB;
        }),
        stats: {
          total: wsTasks.length,
          complete: wsTasks.filter((t) => t.status === "COMPLETE").length,
          blocked: wsTasks.filter((t) => t.status === "BLOCKED").length,
        },
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Phase ranges (approximate - using tasks' dates per phase)
    const phaseGroups = new Map<string, { min: number; max: number }>();
    for (const t of tasks as unknown as Task[]) {
      const phase = t.phase;
      const taskDate = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
      const dayOffset = Math.ceil((taskDate.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

      if (!phaseGroups.has(phase)) {
        phaseGroups.set(phase, { min: dayOffset, max: dayOffset });
      } else {
        const g = phaseGroups.get(phase)!;
        g.min = Math.min(g.min, dayOffset);
        g.max = Math.max(g.max, dayOffset);
      }
    }

    const ranges = PHASE_ORDER
      .filter((p) => phaseGroups.has(p))
      .map((phase) => {
        const g = phaseGroups.get(phase)!;
        const startPct = (g.min / total) * 100;
        const widthPct = Math.max(2, ((g.max - g.min + 7) / total) * 100);
        return { phase, startPct, widthPct };
      });

    return {
      minDate: min,
      maxDate: max,
      totalDays: total,
      workstreams: wsGroups,
      phaseRanges: ranges,
      todayOffset: todayOff,
    };
  }, [tasks, deal, phaseFilter, statusFilter]);

  // Generate month ticks
  const monthTicks = useMemo(() => {
    const ticks: { label: string; pct: number }[] = [];
    const cur = new Date(minDate);
    cur.setDate(1);
    cur.setMonth(cur.getMonth() + 1);

    while (cur <= maxDate) {
      const dayOff = Math.ceil((cur.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      ticks.push({
        label: cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        pct: (dayOff / totalDays) * 100,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return ticks;
  }, [minDate, maxDate, totalDays]);

  // Generate week ticks
  const weekTicks = useMemo(() => {
    const ticks: { pct: number }[] = [];
    const cur = new Date(minDate);
    // Move to next Monday
    const day = cur.getDay();
    const daysToMonday = day === 0 ? 1 : 8 - day;
    cur.setDate(cur.getDate() + daysToMonday);

    while (cur <= maxDate) {
      const dayOff = Math.ceil((cur.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      ticks.push({ pct: (dayOff / totalDays) * 100 });
      cur.setDate(cur.getDate() + 7);
    }
    return ticks;
  }, [minDate, maxDate, totalDays]);

  const toggleWorkstream = (name: string) => {
    setExpandedWorkstreams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedWorkstreams(new Set(workstreams.map((w) => w.name)));
  };

  const collapseAll = () => {
    setExpandedWorkstreams(new Set());
  };

  function getBarPosition(task: Task) {
    const startDate = new Date(task.createdAt);
    const endDate = task.dueDate
      ? new Date(task.dueDate)
      : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7-day bar

    const startDay = Math.max(
      0,
      Math.ceil((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const endDay = Math.ceil(
      (endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const leftPct = (startDay / totalDays) * 100;
    const widthPct = Math.max(0.5, ((endDay - startDay) / totalDays) * 100);

    // If completed, calculate fill
    let fillPct = 0;
    if (task.status === "COMPLETE") {
      fillPct = 100;
    } else if (task.status === "IN_PROGRESS" || task.status === "UNDER_REVIEW") {
      // Estimate progress based on time elapsed
      const now = Date.now();
      const elapsed = now - startDate.getTime();
      const totalDuration = endDate.getTime() - startDate.getTime();
      fillPct = totalDuration > 0 ? Math.min(85, Math.max(15, (elapsed / totalDuration) * 100)) : 50;
    }

    return { leftPct, widthPct, fillPct };
  }

  const todayPct = (todayOffset / totalDays) * 100;

  // Summary stats
  const totalTasks = tasks?.length ?? 0;
  const completeTasks = tasks?.filter((t: any) => t.status === "COMPLETE").length ?? 0;
  const blockedTasks = tasks?.filter((t: any) => t.status === "BLOCKED").length ?? 0;
  const inProgressTasks = tasks?.filter((t: any) => t.status === "IN_PROGRESS").length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-[500px] bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">No tasks yet</h2>
        <p className="text-gray-400 mt-1">Add tasks to this deal to see the timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-500" />
            Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalTasks} tasks &middot; {completeTasks} complete &middot; {inProgressTasks} in progress
            {blockedTasks > 0 && <span className="text-red-500"> &middot; {blockedTasks} blocked</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Phases</option>
            {PHASE_ORDER.map((p) => (
              <option key={p} value={p}>{PHASE_LABELS[p]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="WAITING">Waiting</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETE">Complete</option>
          </select>
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              onClick={expandAll}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 rounded hover:bg-teal-50 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Phase lanes header */}
        <div className="relative h-8 bg-gray-50 border-b border-gray-200 overflow-hidden">
          {/* Left spacer for label column */}
          <div className="absolute inset-y-0 left-0 w-[260px] bg-gray-50 border-r border-gray-200 z-10 flex items-center px-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Workstream</span>
          </div>
          <div className="ml-[260px] relative h-full">
            {phaseRanges.map(({ phase, startPct, widthPct }) => (
              <div
                key={phase}
                className="absolute top-0 bottom-0 flex items-center justify-center"
                style={{ left: `${startPct}%`, width: `${widthPct}%` }}
              >
                <div className="h-full w-full bg-teal-50/60 border-x border-teal-200/40 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Month ticks header */}
        <div className="relative h-6 bg-white border-b border-gray-100 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[260px] bg-white border-r border-gray-200 z-10" />
          <div className="ml-[260px] relative h-full">
            {monthTicks.map((tick, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-gray-200"
                style={{ left: `${tick.pct}%` }}
              >
                <span className="text-[10px] text-gray-400 ml-1.5 whitespace-nowrap">
                  {tick.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workstream rows */}
        <div className="divide-y divide-gray-100">
          {workstreams.map((ws) => {
            const isExpanded = expandedWorkstreams.has(ws.name);
            const pct = ws.stats.total > 0 ? Math.round((ws.stats.complete / ws.stats.total) * 100) : 0;

            return (
              <div key={ws.name}>
                {/* Workstream header row */}
                <div
                  className="flex items-center cursor-pointer hover:bg-gray-50/80 transition-colors group"
                  onClick={() => toggleWorkstream(ws.name)}
                >
                  {/* Label */}
                  <div className="w-[260px] shrink-0 px-4 py-2.5 flex items-center gap-2 border-r border-gray-200">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {ws.name.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                      {ws.stats.complete}/{ws.stats.total}
                    </span>
                    <div className="w-12 h-1.5 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Bars area - aggregated */}
                  <div className="flex-1 relative h-10 overflow-hidden">
                    {/* Week gridlines */}
                    {weekTicks.map((tick, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-gray-100"
                        style={{ left: `${tick.pct}%` }}
                      />
                    ))}
                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                    {/* Mini preview bars */}
                    {ws.tasks.map((task) => {
                      const { leftPct, widthPct } = getBarPosition(task);
                      const colors = STATUS_COLORS[task.status] || STATUS_COLORS.NOT_STARTED;
                      return (
                        <div
                          key={task.id}
                          className={cn("absolute h-2 rounded-full opacity-60 top-1/2 -translate-y-1/2", colors.bar)}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Expanded task rows */}
                {isExpanded &&
                  ws.tasks.map((task) => {
                    const { leftPct, widthPct, fillPct } = getBarPosition(task);
                    const colors = STATUS_COLORS[task.status] || STATUS_COLORS.NOT_STARTED;
                    const priorityBorder = PRIORITY_INDICATOR[task.priority] || PRIORITY_INDICATOR.MEDIUM;

                    return (
                      <div key={task.id} className="flex items-center hover:bg-gray-50/50 transition-colors">
                        {/* Task label */}
                        <div
                          className={cn(
                            "w-[260px] shrink-0 px-4 py-2 pl-10 border-r border-gray-200 border-l-2",
                            priorityBorder
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn("w-1.5 h-1.5 rounded-full shrink-0", colors.bar)}
                            />
                            <span className="text-xs text-gray-700 truncate flex-1" title={task.title}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 pl-3.5">
                            {task.assignedTo?.name && (
                              <span className="text-[10px] text-gray-400 truncate">
                                {task.assignedTo.name.split(" ")[0]}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-[10px] text-gray-400">
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bar area */}
                        <div className="flex-1 relative h-10 overflow-hidden">
                          {/* Week gridlines */}
                          {weekTicks.map((tick, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 border-l border-gray-100"
                              style={{ left: `${tick.pct}%` }}
                            />
                          ))}
                          {/* Today line */}
                          <div
                            className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                            style={{ left: `${todayPct}%` }}
                          />
                          {/* Task bar */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md bg-gray-100 overflow-hidden group/bar"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              minWidth: "4px",
                            }}
                          >
                            <div
                              className={cn("h-full rounded-md transition-all", colors.bar)}
                              style={{ width: `${fillPct}%` }}
                            />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/bar:block z-20 pointer-events-none">
                              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                                {task.title}
                                <br />
                                {task.status.replace(/_/g, " ")} &middot; {PHASE_LABELS[task.phase]}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-px h-4 bg-red-400" />
            <span className="text-[10px] text-gray-500">Today</span>
          </div>
          {Object.entries(STATUS_COLORS)
            .filter(([key]) => key !== "NA")
            .map(([status, colors]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-2 rounded-sm", colors.bar)} />
                <span className="text-[10px] text-gray-500">
                  {status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Milestones */}
      {deal?.targetCloseDate && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Key Dates
          </h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Target Close</p>
                <p className="text-xs text-gray-400">
                  {new Date(deal.targetCloseDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">Today</p>
                <p className="text-xs text-gray-400">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            {(() => {
              const daysToClose = Math.ceil(
                (new Date(deal.targetCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return daysToClose > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{daysToClose} Days Remaining</p>
                    <p className="text-xs text-gray-400">Until target close</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Close Date Passed</p>
                    <p className="text-xs text-gray-400">{Math.abs(daysToClose)} days ago</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
