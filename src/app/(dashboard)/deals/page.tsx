"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, Search, Filter } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";

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

const mockDeals = [
  { id: "1", name: "Cedar Ridge SNF", facilityName: "Cedar Ridge Skilled Nursing Facility", city: "Boise", state: "ID", type: "SNF", status: "CHOW_FILED", progress: 72, lead: "Owen Richardson", bedCount: 120, closeDate: "Mar 15, 2026", tasksDone: 134, tasksTotal: 187 },
  { id: "2", name: "Mountain View ALF", facilityName: "Mountain View Assisted Living", city: "Helena", state: "MT", type: "ALF", status: "DUE_DILIGENCE", progress: 45, lead: "James Peterson", bedCount: 60, closeDate: "Apr 1, 2026", tasksDone: 54, tasksTotal: 120 },
  { id: "3", name: "Riverside Care", facilityName: "Riverside Care Center", city: "Portland", state: "OR", type: "SNF", status: "CLOSING", progress: 88, lead: "Doug Martinez", bedCount: 90, closeDate: "Feb 28, 2026", tasksDone: 165, tasksTotal: 188 },
  { id: "4", name: "Valley Health SNF", facilityName: "Valley Health Skilled Nursing", city: "Spokane", state: "WA", type: "SNF", status: "LOI", progress: 15, lead: "Sarah Chen", bedCount: 80, closeDate: "May 15, 2026", tasksDone: 28, tasksTotal: 190 },
  { id: "5", name: "Sunset Gardens ALF", facilityName: "Sunset Gardens Assisted Living", city: "Meridian", state: "ID", type: "ALF", status: "PIPELINE", progress: 0, lead: "Unassigned", bedCount: 45, closeDate: "TBD", tasksDone: 0, tasksTotal: 0 },
];

export default function DealsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = mockDeals.filter((d) => {
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Deals
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {mockDeals.length} active acquisitions
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neu-input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neu-input w-auto min-w-[160px]"
          >
            {DEAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
            <button
              onClick={() => setView("grid")}
              className={`p-2.5 ${view === "grid" ? "bg-primary-500 text-white" : "bg-surface-200 dark:bg-surface-800 text-surface-500"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2.5 ${view === "list" ? "bg-primary-500 text-white" : "bg-surface-200 dark:bg-surface-800 text-surface-500"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status pipeline pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {DEAL_STATUSES.map((s) => {
          const count = s === "ALL" ? mockDeals.length : mockDeals.filter((d) => d.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary-500 text-white"
                  : "bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-700"
              }`}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
      </div>

      {/* Deal Grid */}
      <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
        {filtered.map((deal) => (
          <Link
            key={deal.id}
            href={`/deals/${deal.id}`}
            className="neu-card group block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors truncate">
                  {deal.name}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {deal.city}, {deal.state} &middot; {deal.bedCount} beds
                </p>
              </div>
              <StatusBadge status={deal.status} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-surface-500 dark:text-surface-400">
                <span>Lead: {deal.lead}</span>
                <span>Close: {deal.closeDate}</span>
              </div>

              <ProgressBar value={deal.progress} showLabel />

              <div className="flex justify-between text-xs text-surface-400">
                <span>{deal.tasksDone}/{deal.tasksTotal} tasks</span>
                <StatusBadge status={deal.type} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
