"use client";

import { useState } from "react";
import {
  MapPin,
  Search,
  Plus,
  ChevronRight,
  Building2,
  FileText,
  Shield,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StateReq {
  state: string;
  abbr: string;
  facilityTypes: string[];
  agency: string;
  totalRequirements: number;
  avgProcessingDays: number;
  lastUpdated: string;
  notes: string;
}

const mockStates: StateReq[] = [
  { state: "Idaho", abbr: "ID", facilityTypes: ["SNF", "ALF"], agency: "Dept of Health & Welfare", totalRequirements: 12, avgProcessingDays: 90, lastUpdated: "Feb 02, 2026", notes: "Surety bond required. Fire marshal inspection mandatory." },
  { state: "Montana", abbr: "MT", facilityTypes: ["SNF", "ALF"], agency: "DPHHS", totalRequirements: 10, avgProcessingDays: 75, lastUpdated: "Jan 15, 2026", notes: "Requires Certificate of Need for new licenses." },
  { state: "Oregon", abbr: "OR", facilityTypes: ["SNF", "ALF", "ILF"], agency: "DHS / Oregon Health Authority", totalRequirements: 14, avgProcessingDays: 120, lastUpdated: "Jan 20, 2026", notes: "Moratorium in certain counties. Check before applying." },
  { state: "Washington", abbr: "WA", facilityTypes: ["SNF", "ALF"], agency: "DSHS / Aging & Long-Term Support", totalRequirements: 11, avgProcessingDays: 60, lastUpdated: "Dec 10, 2025", notes: "Expedited process available for existing operators." },
  { state: "Utah", abbr: "UT", facilityTypes: ["SNF"], agency: "Dept of Health & Human Services", totalRequirements: 9, avgProcessingDays: 45, lastUpdated: "Nov 30, 2025", notes: "Relatively streamlined process." },
  { state: "Wyoming", abbr: "WY", facilityTypes: ["SNF", "ALF"], agency: "Dept of Health", totalRequirements: 8, avgProcessingDays: 60, lastUpdated: "Dec 05, 2025", notes: "" },
];

export default function StateRequirementsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockStates.filter(
    (s) => !search || s.state.toLowerCase().includes(search.toLowerCase()) || s.abbr.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search states..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input pl-10"
        />
      </div>

      {/* State Cards */}
      <div className="space-y-3">
        {filtered.map((state) => (
          <div key={state.abbr} className="neu-card group cursor-pointer hover:border-primary-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary-500">{state.abbr}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors">
                    {state.state}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {state.agency}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {state.facilityTypes.map((ft) => (
                      <span
                        key={ft}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300"
                      >
                        {ft}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-surface-300 dark:text-surface-600 group-hover:text-primary-500 transition-colors shrink-0" />
            </div>
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-surface-200 dark:border-surface-800 text-xs text-surface-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {state.totalRequirements} requirements
              </span>
              <span>~{state.avgProcessingDays} day processing</span>
              <span>Updated {state.lastUpdated}</span>
              {state.notes && (
                <span className="text-surface-500 dark:text-surface-400 italic truncate max-w-xs">
                  {state.notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
