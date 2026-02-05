"use client";

import { Building2, CheckSquare, AlertTriangle, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";

const mockStats = [
  { label: "Active Deals", value: "4", icon: Building2, color: "text-primary-500" },
  { label: "Due This Week", value: "12", icon: CheckSquare, color: "text-amber-500" },
  { label: "Overdue Tasks", value: "3", icon: AlertTriangle, color: "text-red-500" },
  { label: "Closing This Mo", value: "2", icon: Calendar, color: "text-emerald-500" },
];

const mockDeals = [
  { id: "1", name: "Cedar Ridge SNF", city: "Boise", state: "ID", type: "SNF", status: "CHOW_FILED", progress: 72, lead: "Owen", closeDate: "Mar 15, 2026" },
  { id: "2", name: "Mountain View ALF", city: "Helena", state: "MT", type: "ALF", status: "DUE_DILIGENCE", progress: 45, lead: "James", closeDate: "Apr 1, 2026" },
  { id: "3", name: "Riverside Care", city: "Portland", state: "OR", type: "SNF", status: "CLOSING", progress: 88, lead: "Doug", closeDate: "Feb 28, 2026" },
  { id: "4", name: "Valley Health SNF", city: "Spokane", state: "WA", type: "SNF", status: "LOI", progress: 15, lead: "Sarah", closeDate: "May 15, 2026" },
];

const mockTasks = [
  { id: "1", title: "Complete Medicaid License Application", deal: "Cedar Ridge SNF", dueDate: "Feb 10", status: "IN_PROGRESS", priority: "HIGH" },
  { id: "2", title: "Evaluate Pharmacy relationship", deal: "Cedar Ridge SNF", dueDate: "Feb 8", status: "BLOCKED", priority: "CRITICAL" },
  { id: "3", title: "Workers Comp — obtain payroll estimates", deal: "Mountain View ALF", dueDate: "Feb 15", status: "NOT_STARTED", priority: "MEDIUM" },
  { id: "4", title: "Schedule Family Forum", deal: "Riverside Care", dueDate: "Feb 12", status: "IN_PROGRESS", priority: "MEDIUM" },
  { id: "5", title: "Complete seller disclosure docs", deal: "Valley Health SNF", dueDate: "Feb 20", status: "NOT_STARTED", priority: "LOW" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Good morning, Owen.
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Here&apos;s your acquisition overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat) => (
          <div key={stat.label} className="neu-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {stat.value}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {stat.label}
                </p>
              </div>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline / Active Deals */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Active Deals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {mockDeals.map((deal) => (
            <a
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="neu-card group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors">
                    {deal.name}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {deal.city}, {deal.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={deal.type} />
                  <StatusBadge status={deal.status} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500 dark:text-surface-400">
                    Close: {deal.closeDate}
                  </span>
                  <span className="text-surface-500 dark:text-surface-400">
                    Lead: {deal.lead}
                  </span>
                </div>
                <ProgressBar value={deal.progress} showLabel />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* My Tasks */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          My Tasks
        </h2>
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-surface-200 dark:divide-surface-800">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-md border-2 border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                    {task.title}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {task.deal}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
                <span className="text-sm text-surface-500 dark:text-surface-400 shrink-0">
                  {task.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
