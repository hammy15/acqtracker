"use client";

import { useState, useMemo } from "react";
import {
  MapPin,
  Search,
  Plus,
  ChevronRight,
  Building2,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function StateRequirementsPage() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState("");

  const { data: requirements, isLoading } = trpc.stateReqs.list.useQuery({
    search,
    stateCode: stateFilter || undefined,
    facilityType: facilityTypeFilter || undefined,
  });

  // Group requirements by state code
  const groupedByState = useMemo(() => {
    if (!requirements) return {};
    return requirements.reduce(
      (acc, req) => {
        const key = req.stateCode;
        if (!acc[key]) acc[key] = [];
        acc[key].push(req);
        return acc;
      },
      {} as Record<string, typeof requirements>
    );
  }, [requirements]);

  // Get unique state codes for filter dropdown
  const uniqueStates = useMemo(() => {
    if (!requirements) return [];
    return [...new Set(requirements.map((r) => r.stateCode))].sort();
  }, [requirements]);

  // Get unique facility types for filter dropdown
  const uniqueFacilityTypes = useMemo(() => {
    if (!requirements) return [];
    return [...new Set(requirements.map((r) => r.facilityType))].sort();
  }, [requirements]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-primary-500" />
            State Requirements
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Manage CHOW requirements by state and facility type
          </p>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add State
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search states..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neu-input pl-10"
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="neu-input w-32"
        >
          <option value="">All States</option>
          {uniqueStates.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={facilityTypeFilter}
          onChange={(e) => setFacilityTypeFilter(e.target.value)}
          className="neu-input w-36"
        >
          <option value="">All Types</option>
          {uniqueFacilityTypes.map((ft) => (
            <option key={ft} value={ft}>
              {ft}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && <PageLoader />}

      {/* Empty State */}
      {!isLoading && requirements?.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No requirements found"
          description={
            search || stateFilter || facilityTypeFilter
              ? "No requirements match your filters. Try different criteria."
              : "Add your first state requirement to get started."
          }
        />
      )}

      {/* Grouped State Cards */}
      {!isLoading && requirements && requirements.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByState).map(([stateCode, reqs]) => (
            <div key={stateCode} className="space-y-3">
              {/* State Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-500">
                    {stateCode}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {stateCode}
                </h2>
                <span className="text-xs text-surface-400">
                  {reqs.length} requirement{reqs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Requirement Cards */}
              {reqs.map((req) => (
                <div
                  key={req.id}
                  className="neu-card group cursor-pointer hover:border-primary-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                            {req.facilityType}
                          </span>
                        </div>
                        <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {req.licensingBody}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-surface-300 dark:text-surface-600 group-hover:text-primary-500 transition-colors shrink-0" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-surface-200 dark:border-surface-800 text-xs text-surface-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{req.processingTimelineDays} day processing
                    </span>
                    {req.suretyBondRequired && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <AlertTriangle className="w-3 h-3" />
                        Surety Bond Required
                      </span>
                    )}
                    {req.conRequired && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <FileText className="w-3 h-3" />
                        CON Required
                      </span>
                    )}
                    {req.backgroundCheckRequired && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <CheckCircle2 className="w-3 h-3" />
                        Background Check
                      </span>
                    )}
                  </div>

                  {req.notes && (
                    <p className="mt-2 text-xs text-surface-500 dark:text-surface-400 italic">
                      {req.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
