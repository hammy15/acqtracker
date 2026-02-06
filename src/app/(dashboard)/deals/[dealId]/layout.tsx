"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
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
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAiChatStore } from "@/stores/aiChatStore";

const tabs = [
  { id: "checklist", label: "Checklist", icon: CheckSquare, href: "" },
  { id: "files", label: "Files", icon: FolderOpen, href: "/files" },
  { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
  { id: "timeline", label: "Timeline", icon: Calendar, href: "/timeline" },
  { id: "documents", label: "Documents", icon: FileText, href: "/documents" },
  { id: "state-reqs", label: "State Reqs", icon: MapPin, href: "/state-reqs" },
  { id: "activity", label: "Activity", icon: Activity, href: "/activity" },
  { id: "transition", label: "Transition", icon: Zap, href: "/transition" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

function DealHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-black/[0.03]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-28 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <div className="w-32 space-y-1">
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DealDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const dealId = params.dealId as string;

  const setDealContext = useAiChatStore((s) => s.setDealContext);

  const { data, isLoading } = trpc.deals.getById.useQuery(
    { id: dealId },
    { enabled: !!dealId }
  );

  // Set AI chat deal context
  useEffect(() => {
    if (data) {
      setDealContext({ id: data.id, name: data.facilityName });
    }
    return () => setDealContext(null);
  }, [data, setDealContext]);

  const basePath = `/deals/${dealId}`;

  const getActiveTab = () => {
    const relative = pathname.replace(basePath, "");
    if (!relative || relative === "/") return "checklist";
    const segment = relative.split("/")[1];
    return segment || "checklist";
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Deal Header */}
      {isLoading ? (
        <DealHeaderSkeleton />
      ) : data ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-black/[0.03]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {data.facilityName}
                </h1>
                <StatusBadge status={data.facilityType} />
                <StatusBadge status={data.status} />
              </div>
              <p className="text-gray-500">
                {data.city}, {data.state} &middot; {data.bedCount} beds
                {data.dealLead && <> &middot; Lead: {data.dealLead.name}</>}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {data.targetCloseDate && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Close: {new Date(data.targetCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {(() => {
                    const diff = Math.ceil(
                      (new Date(data.targetCloseDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return diff > 0 ? (
                      <p className="text-sm font-medium text-teal-500">
                        {diff} days
                      </p>
                    ) : null;
                  })()}
                </div>
              )}
              {data._taskStats && (
                <div className="w-32">
                  <ProgressBar value={data._taskStats.progress} showLabel size="md" />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {data._taskStats.completed}/{data._taskStats.total} tasks
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="neu-card text-center py-8">
          <p className="text-gray-500">
            Deal not found.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`${basePath}${tab.href}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-teal-50 text-teal-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
