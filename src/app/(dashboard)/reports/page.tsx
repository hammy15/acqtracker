"use client";

import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Users,
  Download,
  Filter,
  Layers,
  Activity,
} from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { PipelineFunnel, PipelineFunnelSkeleton } from "@/components/charts/PipelineFunnel";
import { TaskCompletionTrend, TaskCompletionTrendSkeleton } from "@/components/charts/TaskCompletionTrend";
import { WorkstreamProgress, WorkstreamProgressSkeleton } from "@/components/charts/WorkstreamProgress";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";

const statusColorMap: Record<string, string> = {
  PIPELINE: "bg-surface-400",
  LOI: "bg-blue-500",
  DUE_DILIGENCE: "bg-amber-500",
  CHOW_FILED: "bg-primary-500",
  CLOSING: "bg-emerald-500",
  TRANSITION_DAY: "bg-cyan-500",
  WEEK_1: "bg-teal-500",
  WEEK_2: "bg-teal-600",
  POST_CLOSE: "bg-indigo-500",
  ARCHIVED: "bg-surface-300",
};

const statusColorHex: Record<string, string> = {
  PIPELINE: "#9ca3af",
  LOI: "#3b82f6",
  DUE_DILIGENCE: "#f59e0b",
  CHOW_FILED: "#14b8a6",
  CLOSING: "#10b981",
  TRANSITION_DAY: "#06b6d4",
  WEEK_1: "#14b8a6",
  WEEK_2: "#0d9488",
  POST_CLOSE: "#6366f1",
  ARCHIVED: "#d1d5db",
};

const statusLabelMap: Record<string, string> = {
  PIPELINE: "Pipeline",
  LOI: "LOI",
  DUE_DILIGENCE: "Due Diligence",
  CHOW_FILED: "CHOW Filed",
  CLOSING: "Closing",
  TRANSITION_DAY: "Transition Day",
  WEEK_1: "Week 1",
  WEEK_2: "Week 2",
  POST_CLOSE: "Post Close",
  ARCHIVED: "Archived",
};

function ChartCardSkeleton() {
  return (
    <div className="neu-card animate-pulse">
      <div className="h-4 w-36 bg-surface-200 dark:bg-surface-700 rounded mb-4" />
      <div className="h-[260px] bg-surface-100 dark:bg-surface-800 rounded-lg" />
    </div>
  );
}

export default function ReportsPage() {
  const { data: pipeline, isLoading: pipelineLoading } =
    trpc.reports.pipelineOverview.useQuery();
  const { data: teamData, isLoading: teamLoading } =
    trpc.reports.teamPerformance.useQuery({});
  const { data: trendData, isLoading: trendLoading } =
    trpc.reports.taskCompletionTrend.useQuery({ days: 30 });
  const { data: workstreamData, isLoading: workstreamLoading } =
    trpc.reports.workstreamBreakdown.useQuery();

  const isLoading = pipelineLoading || teamLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary-500" />
              Reports &amp; Analytics
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              Organization-wide acquisition metrics
            </p>
          </div>
        </div>
        <PageLoader />
      </div>
    );
  }

  // Convert Record<string, number> to arrays for rendering
  const pipelineStats = Object.entries(pipeline?.byStatus ?? {}).map(
    ([status, count]) => ({
      status,
      label: statusLabelMap[status] ?? status,
      count,
      color: statusColorHex[status] ?? "#9ca3af",
    })
  );

  const facilityStats = Object.entries(pipeline?.byFacilityType ?? {}).map(
    ([type, count]) => ({ type, count })
  );

  const stateStats = Object.entries(pipeline?.byState ?? {}).map(
    ([state, count]) => ({ state, count })
  );

  const teamStats = teamData?.teamStats ?? [];

  // Transform trend data for the TaskCompletionTrend chart
  const trendChartData = (trendData ?? []).map((d) => ({
    date: d.date,
    completed: d.completed,
    total: d.cumulative,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary-500" />
            Reports &amp; Analytics
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Organization-wide acquisition metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="neu-button-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {pipeline?.summary?.totalDeals ?? 0}
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Total Deals
              </p>
            </div>
            <Building2 className="w-5 h-5 text-primary-500" />
          </div>
        </div>
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {pipeline?.summary?.activeDeals ?? 0}
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Active Deals
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {pipeline?.summary?.avgProgress ?? 0}%
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Avg Progress
              </p>
            </div>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {teamStats.length}
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Team Members
              </p>
            </div>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Pipeline Distribution Chart */}
      {pipelineLoading ? (
        <ChartCardSkeleton />
      ) : (
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
            Pipeline Distribution
          </h2>
          {pipelineStats.length > 0 ? (
            <PipelineFunnel data={pipelineStats} />
          ) : (
            <p className="text-sm text-surface-400 py-8 text-center">
              No pipeline data available yet.
            </p>
          )}
        </div>
      )}

      {/* Task Completion Trend */}
      {trendLoading ? (
        <ChartCardSkeleton />
      ) : (
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Task Completion Trend (30 Days)
          </h2>
          {trendChartData.length > 0 ? (
            <TaskCompletionTrend data={trendChartData} />
          ) : (
            <p className="text-sm text-surface-400 py-8 text-center">
              No task completion data available yet.
            </p>
          )}
        </div>
      )}

      {/* Workstream Breakdown */}
      {workstreamLoading ? (
        <ChartCardSkeleton />
      ) : (
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Workstream Breakdown
          </h2>
          {workstreamData && workstreamData.length > 0 ? (
            <WorkstreamProgress data={workstreamData} />
          ) : (
            <p className="text-sm text-surface-400 py-8 text-center">
              No workstream data available yet.
            </p>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Performance */}
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Performance
          </h2>
          {teamStats.length > 0 ? (
            <div className="space-y-3">
              {teamStats.map((member: any) => {
                const total = member.assigned || 1;
                const pct = Math.round((member.completed / total) * 100);
                return (
                  <div key={(member.user as any)?.id ?? member.completed}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {(member.user as any)?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-surface-400">
                        {member.completed}/{member.assigned} tasks
                      </span>
                    </div>
                    <ProgressBar value={pct} showLabel size="sm" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-surface-400 py-4">
              No team data available yet.
            </p>
          )}
        </div>

        {/* Breakdown by Facility Type */}
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            By Facility Type
          </h2>
          {facilityStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-800">
                    <th className="text-left py-2 text-xs font-semibold text-surface-500 dark:text-surface-400">
                      Type
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-surface-500 dark:text-surface-400">
                      Deals
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {facilityStats.map((ft) => (
                    <tr key={ft.type}>
                      <td className="py-2 text-sm text-surface-700 dark:text-surface-300">
                        {ft.type}
                      </td>
                      <td className="py-2 text-sm text-right text-surface-500">
                        {ft.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-surface-400 py-4">
              No facility data available yet.
            </p>
          )}
        </div>
      </div>

      {/* By State */}
      {stateStats.length > 0 && (
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Deals by State
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stateStats.map((s) => (
              <div
                key={s.state}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900/30"
              >
                <span className="text-sm font-medium text-surface-800 dark:text-surface-100">
                  {s.state}
                </span>
                <span className="text-lg font-bold text-primary-500">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
