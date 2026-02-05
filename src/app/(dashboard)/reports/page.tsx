"use client";

import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Users,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";

const pipelineStats = [
  { label: "Pipeline", count: 1, color: "bg-surface-400" },
  { label: "LOI", count: 1, color: "bg-blue-500" },
  { label: "Due Diligence", count: 1, color: "bg-amber-500" },
  { label: "CHOW Filed", count: 1, color: "bg-primary-500" },
  { label: "Closing", count: 1, color: "bg-emerald-500" },
];

const teamPerformance = [
  { name: "Owen Richardson", tasks: 342, deals: 4, avgCompletion: 94 },
  { name: "Steve Anderson", tasks: 287, deals: 3, avgCompletion: 91 },
  { name: "Sarah Chen", tasks: 198, deals: 3, avgCompletion: 88 },
  { name: "Doug Martinez", tasks: 156, deals: 2, avgCompletion: 85 },
  { name: "Tim Brooks", tasks: 124, deals: 2, avgCompletion: 82 },
  { name: "James Peterson", tasks: 89, deals: 2, avgCompletion: 79 },
];

const monthlyMetrics = [
  { month: "Sep 2025", dealsActive: 3, tasksClosed: 145, avgDaysToClose: 88 },
  { month: "Oct 2025", dealsActive: 3, tasksClosed: 167, avgDaysToClose: 85 },
  { month: "Nov 2025", dealsActive: 4, tasksClosed: 198, avgDaysToClose: 82 },
  { month: "Dec 2025", dealsActive: 4, tasksClosed: 156, avgDaysToClose: 80 },
  { month: "Jan 2026", dealsActive: 5, tasksClosed: 212, avgDaysToClose: 78 },
  { month: "Feb 2026", dealsActive: 5, tasksClosed: 89, avgDaysToClose: 76 },
];

export default function ReportsPage() {
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
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">5</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Active Deals</p>
            </div>
            <Building2 className="w-5 h-5 text-primary-500" />
          </div>
        </div>
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">381</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Tasks This Month</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">78</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Avg Days to Close</p>
            </div>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div className="neu-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">7</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Blocked Items</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Pipeline Distribution */}
      <div className="neu-card">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Pipeline Distribution
        </h2>
        <div className="flex gap-1 h-8 rounded-xl overflow-hidden mb-4">
          {pipelineStats.map((s) => (
            <div
              key={s.label}
              className={`${s.color} flex-1 flex items-center justify-center`}
              title={`${s.label}: ${s.count}`}
            >
              <span className="text-xs font-bold text-white">{s.count}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {pipelineStats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${s.color}`} />
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {s.label} ({s.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Performance */}
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Performance
          </h2>
          <div className="space-y-3">
            {teamPerformance.map((member) => (
              <div key={member.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {member.name}
                  </span>
                  <span className="text-xs text-surface-400">
                    {member.tasks} tasks &middot; {member.deals} deals
                  </span>
                </div>
                <ProgressBar value={member.avgCompletion} showLabel size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="neu-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Monthly Trends
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="text-left py-2 text-xs font-semibold text-surface-500 dark:text-surface-400">Month</th>
                  <th className="text-right py-2 text-xs font-semibold text-surface-500 dark:text-surface-400">Deals</th>
                  <th className="text-right py-2 text-xs font-semibold text-surface-500 dark:text-surface-400">Tasks</th>
                  <th className="text-right py-2 text-xs font-semibold text-surface-500 dark:text-surface-400">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                {monthlyMetrics.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 text-sm text-surface-700 dark:text-surface-300">{m.month}</td>
                    <td className="py-2 text-sm text-right text-surface-500">{m.dealsActive}</td>
                    <td className="py-2 text-sm text-right text-surface-500">{m.tasksClosed}</td>
                    <td className="py-2 text-sm text-right text-surface-500">{m.avgDaysToClose}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upcoming Closings */}
      <div className="neu-card">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Upcoming Closings
        </h2>
        <div className="space-y-3">
          {[
            { name: "Riverside Care", date: "Feb 28, 2026", daysOut: 23, progress: 88 },
            { name: "Cedar Ridge SNF", date: "Mar 15, 2026", daysOut: 38, progress: 72 },
            { name: "Mountain View ALF", date: "Apr 1, 2026", daysOut: 55, progress: 45 },
            { name: "Valley Health SNF", date: "May 15, 2026", daysOut: 99, progress: 15 },
          ].map((deal) => (
            <div key={deal.name} className="flex items-center gap-4">
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100 w-40 shrink-0">
                {deal.name}
              </span>
              <span className="text-xs text-surface-400 w-28 shrink-0">{deal.date}</span>
              <div className="flex-1">
                <ProgressBar value={deal.progress} showLabel size="sm" />
              </div>
              <span className="text-xs font-medium text-primary-500 shrink-0 w-16 text-right">
                {deal.daysOut}d out
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
