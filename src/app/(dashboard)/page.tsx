"use client";

import { Building2, CheckSquare, AlertTriangle, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";

function StatCardSkeleton() {
  return (
    <div className="neu-card animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-12 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-5 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function DealCardSkeleton() {
  return (
    <div className="neu-card animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse">
      <div className="w-5 h-5 bg-gray-200 rounded" />
      <div className="flex-1 min-w-0">
        <div className="h-5 w-60 bg-gray-200 rounded mb-1.5" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-14 bg-gray-200 rounded" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: dealsData, isLoading: dealsLoading } = trpc.deals.list.useQuery({ status: undefined });
  const { data: tasksData, isLoading: tasksLoading } = trpc.tasks.getMyTasks.useQuery({});
  const { data: statsData, isLoading: statsLoading } = trpc.deals.getStats.useQuery();

  const deals = dealsData?.deals ?? [];
  const tasks = tasksData ?? [];

  const overdueTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date() && t.status !== "DONE";
  });

  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  const dueThisWeek = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= endOfWeek && t.status !== "DONE";
  });

  const closingThisMonth = deals.filter((d: any) => {
    if (!d.targetCloseDate) return false;
    const close = new Date(d.targetCloseDate);
    return close.getMonth() === now.getMonth() && close.getFullYear() === now.getFullYear();
  });

  const statCards = [
    { label: "Active Deals", value: String(statsData?.active ?? deals.length), icon: Building2, color: "text-teal-500" },
    { label: "Due This Week", value: String(dueThisWeek.length), icon: CheckSquare, color: "text-amber-500" },
    { label: "Overdue Tasks", value: String(overdueTasks.length), icon: AlertTriangle, color: "text-red-500" },
    { label: "Closing This Mo", value: String(closingThisMonth.length), icon: Calendar, color: "text-emerald-500" },
  ];

  const isLoading = dealsLoading || tasksLoading || statsLoading;

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s your acquisition overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat) => (
              <div key={stat.label} className="neu-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
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
        <h2 className="section-header mb-4">
          Active Deals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {dealsLoading
            ? Array.from({ length: 4 }).map((_, i) => <DealCardSkeleton key={i} />)
            : deals.map((deal: any) => {
                const closeDate = deal.targetCloseDate
                  ? new Date(deal.targetCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "TBD";
                const progress = (deal as any)._taskStats?.progress ?? 0;
                return (
                  <a
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="neu-card group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                          {deal.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {deal.city}, {deal.state}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <StatusBadge status={deal.facilityType} />
                        <StatusBadge status={deal.status} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Close: {closeDate}
                        </span>
                        <span className="text-gray-500">
                          Lead: {deal.dealLead?.name ?? "Unassigned"}
                        </span>
                      </div>
                      <ProgressBar value={progress} showLabel />
                    </div>
                  </a>
                );
              })}
        </div>
      </section>

      {/* My Tasks */}
      <section>
        <h2 className="section-header mb-4">
          My Tasks
        </h2>
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {tasksLoading
              ? Array.from({ length: 5 }).map((_, i) => <TaskRowSkeleton key={i} />)
              : tasks.map((task: any) => {
                  const dueLabel = task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "";
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-2 border-gray-300 text-teal-500 focus:ring-teal-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {task.deal?.name ?? ""}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <StatusBadge status={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                      <span className="text-sm text-gray-500 shrink-0">
                        {dueLabel}
                      </span>
                    </div>
                  );
                })}
          </div>
        </div>
      </section>
    </div>
  );
}
