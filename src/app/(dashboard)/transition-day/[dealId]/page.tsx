"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Check,
  AlertTriangle,
  MessageCircle,
  Camera,
  ListChecks,
  Radio,
  Users,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/shared/ProgressBar";

const mockFeed = [
  { id: "1", type: "complete", user: "Owen", text: 'Completed "Collect all keys from seller"', time: "1:15 AM", hasPhoto: true },
  { id: "2", type: "message", user: "Steve", text: "Medicare switchover confirmed. New NPI is active.", time: "1:08 AM", hasPhoto: false },
  { id: "3", type: "complete", user: "Tim", text: 'Completed "Verify narcotics count with outgoing DNS"', time: "1:02 AM", hasPhoto: true },
  { id: "4", type: "flagged", user: "James", text: 'Flagged "Fire panel showing fault zone 3" as BLOCKED', time: "12:55 AM", hasPhoto: false },
  { id: "5", type: "complete", user: "Owen", text: 'Completed "Photograph lobby and entrance"', time: "12:45 AM", hasPhoto: true },
  { id: "6", type: "complete", user: "Sarah", text: 'Completed "Verify petty cash count"', time: "12:30 AM", hasPhoto: false },
  { id: "7", type: "message", user: "Doug", text: "Night shift supervisor is very cooperative. Smooth handoff so far.", time: "12:20 AM", hasPhoto: false },
  { id: "8", type: "system", user: "System", text: "TRANSITION DAY STARTED — Cedar Ridge SNF", time: "12:01 AM", hasPhoto: false },
];

const mockTasks = [
  { id: "1", title: "Collect all keys from seller", status: "complete", assignee: "Owen" },
  { id: "2", title: "Verify safe combo and contents", status: "complete", assignee: "Owen" },
  { id: "3", title: "Narcotics count verification", status: "complete", assignee: "Tim" },
  { id: "4", title: "Photograph lobby and entrance", status: "complete", assignee: "Owen" },
  { id: "5", title: "Verify petty cash count", status: "complete", assignee: "Sarah" },
  { id: "6", title: "Test fire panel all zones", status: "blocked", assignee: "James" },
  { id: "7", title: "Verify phone system transfer", status: "in_progress", assignee: "Steve" },
  { id: "8", title: "Check EHR system access", status: "in_progress", assignee: "Doug" },
  { id: "9", title: "Photograph kitchen and dining", status: "not_started", assignee: "Owen" },
  { id: "10", title: "Photograph all resident wings", status: "not_started", assignee: "Owen" },
  { id: "11", title: "Verify alarm codes changed", status: "not_started", assignee: "James" },
  { id: "12", title: "Inventory medical supplies", status: "not_started", assignee: "Tim" },
];

const feedTypeIcon: Record<string, { icon: React.ReactNode; bg: string }> = {
  complete: { icon: <Check className="w-3 h-3 text-white" />, bg: "bg-emerald-500" },
  message: { icon: <MessageCircle className="w-3 h-3 text-white" />, bg: "bg-primary-500" },
  flagged: { icon: <AlertTriangle className="w-3 h-3 text-white" />, bg: "bg-red-500" },
  system: { icon: <Zap className="w-3 h-3 text-white" />, bg: "bg-primary-500" },
};

const taskStatusIcon: Record<string, React.ReactNode> = {
  complete: <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>,
  in_progress: <Clock className="w-5 h-5 text-primary-500" />,
  blocked: <AlertTriangle className="w-5 h-5 text-red-500" />,
  not_started: <div className="w-5 h-5 rounded-md border-2 border-surface-300 dark:border-surface-600" />,
};

export default function TransitionDayBuildingPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"feed" | "tasks">("feed");

  const completedTasks = mockTasks.filter((t) => t.status === "complete").length;
  const blockedTasks = mockTasks.filter((t) => t.status === "blocked").length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Zap className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Cedar Ridge SNF
            </h1>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-surface-500 dark:text-surface-400">
            Transition Day &middot; Boise, ID &middot; {completedTasks}/{mockTasks.length} tasks complete
          </p>
        </div>
        <Link
          href={`/transition-day/${params.dealId}/command`}
          className="neu-button-primary flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Command View
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="neu-card text-center">
          <p className="text-2xl font-bold text-emerald-500">{completedTasks}</p>
          <p className="text-xs text-surface-400">Complete</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-2xl font-bold text-red-500">{blockedTasks}</p>
          <p className="text-xs text-surface-400">Blocked</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-2xl font-bold text-primary-500">
            {Math.round((completedTasks / mockTasks.length) * 100)}%
          </p>
          <p className="text-xs text-surface-400">Progress</p>
        </div>
      </div>

      <ProgressBar value={completedTasks} max={mockTasks.length} showLabel size="md" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={() => setActiveTab("feed")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "feed"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          )}
        >
          <Radio className="w-4 h-4" />
          Live Feed
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "tasks"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          )}
        >
          <ListChecks className="w-4 h-4" />
          Tasks
        </button>
      </div>

      {/* Feed Tab */}
      {activeTab === "feed" && (
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-surface-200 dark:divide-surface-800">
            {mockFeed.map((post) => {
              const fi = feedTypeIcon[post.type] || feedTypeIcon.message;
              return (
                <div key={post.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5", fi.bg)}>
                      {fi.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-surface-400">{post.time}</span>
                      </div>
                      <p className="text-sm text-surface-800 dark:text-surface-100">
                        <span className="font-semibold">{post.user}</span>{" "}
                        <span className="text-surface-600 dark:text-surface-300">{post.text}</span>
                      </p>
                      {post.hasPhoto && (
                        <span className="flex items-center gap-1 text-xs text-surface-400 mt-1">
                          <Camera className="w-3 h-3" /> Photo attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors",
                  task.status === "blocked" && "bg-red-50/50 dark:bg-red-950/10"
                )}
              >
                <div className="shrink-0">{taskStatusIcon[task.status]}</div>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    task.status === "complete"
                      ? "line-through text-surface-400"
                      : "text-surface-800 dark:text-surface-100"
                  )}
                >
                  {task.title}
                </span>
                <span className="text-xs text-surface-400">{task.assignee}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
