"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeft,
  Monitor,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Radio,
  Phone,
} from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";

export default function CommandDashboardPage() {
  const params = useParams();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/transition-day/${params.dealId}`}
            className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-primary-500" />
              Command Dashboard
            </h1>
            <p className="text-surface-500 dark:text-surface-400">
              Cedar Ridge SNF &middot; Real-time transition monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-500">LIVE</span>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="neu-card text-center py-20">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Monitor className="w-16 h-16 text-surface-300 dark:text-surface-600" />
            <Radio className="w-8 h-8 text-primary-500 absolute -bottom-1 -right-1" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
          Command Dashboard
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-lg mx-auto mb-8">
          The full-screen command dashboard with real-time metrics, team GPS locations,
          live photo feed, and communication hub is under development.
        </p>

        {/* Preview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="neu-card text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">5</p>
            <p className="text-xs text-surface-400">Tasks Done</p>
          </div>
          <div className="neu-card text-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">1</p>
            <p className="text-xs text-surface-400">Blocked</p>
          </div>
          <div className="neu-card text-center">
            <Users className="w-5 h-5 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">6</p>
            <p className="text-xs text-surface-400">On Site</p>
          </div>
          <div className="neu-card text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">1:15</p>
            <p className="text-xs text-surface-400">Elapsed (hrs)</p>
          </div>
        </div>

        <div className="max-w-md mx-auto mt-6">
          <ProgressBar value={42} showLabel size="md" />
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-3 mt-8">
          <button className="neu-button-primary flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Call Team Lead
          </button>
          <Link
            href={`/transition-day/${params.dealId}`}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            Back to Building View
          </Link>
        </div>
      </div>
    </div>
  );
}
