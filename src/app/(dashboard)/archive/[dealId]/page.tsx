"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
  RotateCcw,
  Download,
} from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";

export default function ArchivedDealPage() {
  useParams();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/archive"
            className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
              <Archive className="w-6 h-6 text-surface-400" />
              Pinecrest Health Center
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              Archived &middot; Closed Nov 15, 2025
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
            <RotateCcw className="w-4 h-4" />
            Restore Deal
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="neu-card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide">Facility</p>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">SNF &middot; 88 beds</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Twin Falls, ID</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide">Closed</p>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Nov 15, 2025</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">92 day process</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide">Lead</p>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Owen Richardson</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">6 team members</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide">Completion</p>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">182/182 tasks</p>
              <ProgressBar value={100} showLabel size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Archived Workstreams */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Completed Workstreams
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: "Administration", tasks: 42, files: 12 },
            { name: "Operations", tasks: 38, files: 8 },
            { name: "Accounting", tasks: 35, files: 15 },
            { name: "Legal / Compliance", tasks: 28, files: 22 },
            { name: "HR / Staffing", tasks: 24, files: 6 },
            { name: "Transition Day", tasks: 15, files: 34 },
          ].map((ws) => (
            <div key={ws.name} className="neu-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">{ws.name}</h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center gap-4 text-xs text-surface-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {ws.tasks} tasks completed
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {ws.files} files
                </span>
              </div>
              <ProgressBar value={100} size="sm" className="mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Read-only Notice */}
      <div className="neu-card bg-surface-50 dark:bg-surface-900/50 text-center py-6">
        <Archive className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
        <p className="text-sm text-surface-500 dark:text-surface-400">
          This deal is archived and in read-only mode. Use the &quot;Restore Deal&quot; button to make it active again.
        </p>
      </div>
    </div>
  );
}
