"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  FolderOpen,
  MessageCircle,
  Calendar,
  FileText,
  MapPin,
  Activity,
  Zap,
  Settings,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "checklist", label: "Checklist", icon: CheckSquare, href: "checklist" },
  { id: "files", label: "Files", icon: FolderOpen, href: "files" },
  { id: "chat", label: "Chat", icon: MessageCircle, href: "chat" },
  { id: "timeline", label: "Timeline", icon: Calendar, href: "timeline" },
  { id: "documents", label: "Documents", icon: FileText, href: "documents" },
  { id: "state-reqs", label: "State Reqs", icon: MapPin, href: "state-reqs" },
  { id: "activity", label: "Activity", icon: Activity, href: "activity" },
  { id: "transition", label: "Transition", icon: Zap, href: "transition" },
  { id: "settings", label: "Settings", icon: Settings, href: "settings" },
];

const mockDeal = {
  id: "1",
  name: "Cedar Ridge SNF Acquisition",
  facilityName: "Cedar Ridge Skilled Nursing Facility",
  type: "SNF",
  state: "ID",
  city: "Boise",
  status: "CHOW_FILED",
  progress: 72,
  closeDate: "Mar 15, 2026",
  daysToClose: 38,
  lead: "Owen Richardson",
  tasksDone: 134,
  tasksTotal: 187,
  bedCount: 120,
};

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Deal Header */}
      <div className="neu-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {mockDeal.facilityName}
              </h1>
              <StatusBadge status={mockDeal.type} />
              <StatusBadge status={mockDeal.status} />
            </div>
            <p className="text-surface-500 dark:text-surface-400">
              {mockDeal.city}, {mockDeal.state} &middot; {mockDeal.bedCount} beds &middot; Lead: {mockDeal.lead}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Close: {mockDeal.closeDate}
              </p>
              <p className="text-sm font-medium text-primary-500">
                {mockDeal.daysToClose} days
              </p>
            </div>
            <div className="w-32">
              <ProgressBar value={mockDeal.progress} showLabel size="md" />
              <p className="text-xs text-surface-400 mt-1 text-right">
                {mockDeal.tasksDone}/{mockDeal.tasksTotal} tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/deals/${dealId}/${tab.href}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
              tab.id === "checklist"
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                : "text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Default view redirects to checklist */}
      <div className="neu-card text-center py-12">
        <p className="text-surface-500 dark:text-surface-400">
          Select a tab above to view deal details.
        </p>
        <Link
          href={`/deals/${dealId}/checklist`}
          className="neu-button-primary inline-flex items-center gap-2 mt-4"
        >
          <CheckSquare className="w-4 h-4" />
          Open Checklist
        </Link>
      </div>
    </div>
  );
}
