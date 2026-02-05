"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { trpc } from "@/lib/trpc";

const DEAL_STATUSES = [
  "ALL",
  "PIPELINE",
  "LOI",
  "DUE_DILIGENCE",
  "CHOW_FILED",
  "CLOSING",
  "TRANSITION_DAY",
  "WEEK_1",
  "WEEK_2",
  "POST_CLOSE",
];

function DealCardSkeleton() {
  return (
    <div className="neu-card animate-pulse block">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-5 w-10 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const queryStatus = statusFilter === "ALL" ? undefined : statusFilter;
  const querySearch = search.trim() || undefined;

  const { data: dealsData, isLoading: dealsLoading } = trpc.deals.list.useQuery({
    status: queryStatus,
    search: querySearch,
    page,
    pageSize,
  });

  const { data: statsData, isLoading: statsLoading } = trpc.deals.getStats.useQuery();

  const deals = dealsData?.deals ?? [];
  const total = dealsData?.pagination?.total ?? 0;
  const totalPages = dealsData?.pagination?.totalPages ?? 1;

  const getStatusCount = (status: string): number => {
    if (status === "ALL") return statsData?.active ?? total;
    return statsData?.byStatus?.[status] ?? 0;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Deals
          </h1>
          <p className="text-gray-500 mt-1">
            {total} active acquisition{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/deals/new" className="neu-button-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="neu-input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="neu-input w-auto min-w-[160px]"
          >
            {DEAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setView("grid")}
              className={`p-2.5 ${view === "grid" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2.5 ${view === "list" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status pipeline pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {DEAL_STATUSES.map((s) => {
          const count = getStatusCount(s);
          return (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")} ({statsLoading ? "-" : count})
            </button>
          );
        })}
      </div>

      {/* Deal Grid */}
      <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
        {dealsLoading
          ? Array.from({ length: 6 }).map((_, i) => <DealCardSkeleton key={i} />)
          : deals.map((deal: any) => {
              const closeDate = deal.targetCloseDate
                ? new Date(deal.targetCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "TBD";
              const progress = (deal as any)._taskStats?.progress ?? 0;
              const tasksDone = (deal as any)._taskStats?.completed ?? 0;
              const tasksTotal = (deal as any)._taskStats?.total ?? 0;
              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="neu-card group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors truncate">
                        {deal.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {deal.city}, {deal.state} &middot; {deal.bedCount} beds
                      </p>
                    </div>
                    <StatusBadge status={deal.status} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Lead: {deal.dealLead?.name ?? "Unassigned"}</span>
                      <span>Close: {closeDate}</span>
                    </div>

                    <ProgressBar value={progress} showLabel />

                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{tasksDone}/{tasksTotal} tasks</span>
                      <StatusBadge status={deal.facilityType} />
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Pagination */}
      {!dealsLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="neu-button-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 px-4">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="neu-button-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
