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
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function ArchivePage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.archive.list.useQuery({
    search,
  });

  const archivedDeals = data?.deals ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Archive className="w-6 h-6 text-primary-500" />
          Archive
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          {archivedDeals.length} archived deals
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

      {/* Loading State */}
      {isLoading && <PageLoader />}

      {/* Empty State */}
      {!isLoading && archivedDeals.length === 0 && (
        <EmptyState
          icon={Archive}
          title="No archived deals"
          description={
            search
              ? "No archived deals match your search. Try a different term."
              : "Archived deals will appear here."
          }
        />
      )}

      {/* Archived Deals */}
      {!isLoading && archivedDeals.length > 0 && (
        <div className="space-y-3">
          {archivedDeals.map((deal) => (
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
                      {deal.city}, {deal.state}
                      {deal.bedCount ? (
                        <>
                          {" "}
                          &middot; {deal.bedCount} beds
                        </>
                      ) : null}
                      {deal.facilityType ? (
                        <>
                          {" "}
                          &middot; {deal.facilityType}
                        </>
                      ) : null}
                    </p>
                    {deal.facilityName && deal.facilityName !== deal.name && (
                      <p className="text-xs text-surface-400 mt-0.5">
                        {deal.facilityName}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={deal.status} />
              </div>
              <div className="flex items-center gap-6 mt-3 pt-3 border-t border-surface-200 dark:border-surface-800 text-xs text-surface-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Archived{" "}
                  {deal.archivedAt
                    ? new Date(deal.archivedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "-"}
                </span>
                {deal.dealLead?.name && (
                  <span>Lead: {deal.dealLead.name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
