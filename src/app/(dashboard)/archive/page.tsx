"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  MapPin,
  RotateCcw,
} from "lucide-react";

interface ArchivedDeal {
  id: string;
  name: string;
  facilityType: string;
  city: string;
  state: string;
  closedDate: string;
  bedCount: number;
  totalTasks: number;
  archiveDate: string;
  lead: string;
  outcome: "completed" | "withdrawn" | "lost";
}

const mockArchived: ArchivedDeal[] = [
  { id: "a1", name: "Pinecrest Health Center", facilityType: "SNF", city: "Twin Falls", state: "ID", closedDate: "Nov 15, 2025", bedCount: 88, totalTasks: 182, archiveDate: "Dec 01, 2025", lead: "Owen Richardson", outcome: "completed" },
  { id: "a2", name: "Lakeside Senior Living", facilityType: "ALF", city: "Coeur d'Alene", state: "ID", closedDate: "Sep 30, 2025", bedCount: 42, totalTasks: 138, archiveDate: "Oct 15, 2025", lead: "Steve Anderson", outcome: "completed" },
  { id: "a3", name: "Greenfield Care Home", facilityType: "ALF", city: "Eugene", state: "OR", closedDate: "-", bedCount: 55, totalTasks: 64, archiveDate: "Aug 20, 2025", lead: "Doug Martinez", outcome: "withdrawn" },
  { id: "a4", name: "Summit Ridge SNF", facilityType: "SNF", city: "Pocatello", state: "ID", closedDate: "Jul 01, 2025", bedCount: 110, totalTasks: 190, archiveDate: "Jul 30, 2025", lead: "Owen Richardson", outcome: "completed" },
  { id: "a5", name: "Willow Creek Hospice", facilityType: "Hospice", city: "Nampa", state: "ID", closedDate: "-", bedCount: 24, totalTasks: 45, archiveDate: "Jun 15, 2025", lead: "Sarah Chen", outcome: "lost" },
];

const outcomeStyle: Record<string, { label: string; classes: string }> = {
  completed: { label: "Completed", classes: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" },
  withdrawn: { label: "Withdrawn", classes: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
  lost: { label: "Lost", classes: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" },
};

export default function ArchivePage() {
  const [search, setSearch] = useState("");

  const filtered = mockArchived.filter(
    (d) => !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Archive className="w-6 h-6 text-primary-500" />
          Archive
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          {mockArchived.length} archived deals
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search archived deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input pl-10"
        />
      </div>

      {/* Archived Deals */}
      <div className="space-y-3">
        {filtered.map((deal) => {
          const outcome = outcomeStyle[deal.outcome];
          return (
            <Link
              key={deal.id}
              href={`/archive/${deal.id}`}
              className="neu-card group block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-surface-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors">
                      {deal.name}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {deal.city}, {deal.state} &middot; {deal.bedCount} beds &middot; {deal.facilityType}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${outcome.classes}`}>
                  {outcome.label}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-3 pt-3 border-t border-surface-200 dark:border-surface-800 text-xs text-surface-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {deal.outcome === "completed" ? `Closed ${deal.closedDate}` : `Archived ${deal.archiveDate}`}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {deal.totalTasks} tasks
                </span>
                <span>Lead: {deal.lead}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
