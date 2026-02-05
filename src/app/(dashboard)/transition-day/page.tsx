"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Users, AlertTriangle, Check, MessageCircle, Camera } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";

const mockBuildings = [
  { id: "1", name: "Cedar Ridge SNF", city: "Boise", state: "ID", progress: 72, blocked: 0, team: 6, status: "green" },
  { id: "2", name: "Mountain View ALF", city: "Helena", state: "MT", progress: 45, blocked: 2, team: 4, status: "yellow" },
  { id: "3", name: "Riverside Care", city: "Portland", state: "OR", progress: 51, blocked: 1, team: 5, status: "yellow" },
  { id: "4", name: "Valley Health SNF", city: "Spokane", state: "WA", progress: 23, blocked: 4, team: 3, status: "red" },
];

const mockBlockedItems = [
  { id: "1", building: "Valley Health", task: "Phone system forwarding to seller", time: "12:42am", assignee: "Sarah" },
  { id: "2", building: "Valley Health", task: "Safe combo doesn't match", time: "12:35am", assignee: "Tim" },
  { id: "3", building: "Mountain View", task: "Fire panel showing fault zone 3", time: "1:05am", assignee: "James" },
  { id: "4", building: "Mountain View", task: "Missing key — med room B wing", time: "12:50am", assignee: "James" },
  { id: "5", building: "Riverside", task: "EHR login credentials rejected", time: "1:12am", assignee: "Doug" },
];

const mockFeed = [
  { id: "1", type: "complete", building: "Cedar Ridge", user: "Owen", text: 'Completed "Collect all keys"', time: "1:15 AM", hasPhoto: true },
  { id: "2", type: "message", building: "Valley Health", user: "Steve", text: "Safe combo doesn't match what seller gave us. Calling now.", time: "1:08 AM", hasPhoto: false },
  { id: "3", type: "complete", building: "Cedar Ridge", user: "Tim", text: 'Completed "Verify narcotics count"', time: "1:02 AM", hasPhoto: true },
  { id: "4", type: "flagged", building: "Mountain View", user: "James", text: 'Flagged "Fire panel" as BLOCKED', time: "1:05 AM", hasPhoto: false },
  { id: "5", type: "complete", building: "Cedar Ridge", user: "Owen", text: 'Completed "Photograph lobby"', time: "12:45 AM", hasPhoto: true },
  { id: "6", type: "system", building: "ALL", user: "System", text: "TRANSITION DAY STARTED", time: "12:01 AM", hasPhoto: false },
];

const statusDot: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

export default function TransitionDayPage() {
  const totalTasks = 127;
  const completedTasks = 68;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Transition Day
          </h1>
        </div>
        <p className="text-surface-500 dark:text-surface-400">
          February 15, 2026 &middot; {mockBuildings.length} Buildings Live &middot; {totalTasks} Tasks &middot; {completedTasks} Complete ({Math.round((completedTasks / totalTasks) * 100)}%)
        </p>
      </div>

      {/* Building Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {mockBuildings.map((b) => (
          <Link
            key={b.id}
            href={`/transition-day/${b.id}`}
            className="neu-card group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", statusDot[b.status])} />
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors">
                  {b.name}
                </h3>
              </div>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              {b.city}, {b.state}
            </p>
            <ProgressBar value={b.progress} showLabel />
            <div className="flex items-center gap-4 mt-3 text-sm text-surface-500 dark:text-surface-400">
              <span className="flex items-center gap-1">
                {b.blocked > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                {b.blocked} blocked
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {b.team} on site
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Blocked Items */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Blocked Items ({mockBlockedItems.length})
        </h2>
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-surface-200 dark:divide-surface-800">
            {mockBlockedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {item.building}:
                  </span>{" "}
                  <span className="text-sm text-surface-600 dark:text-surface-300">
                    {item.task}
                  </span>
                </div>
                <span className="text-xs text-surface-400 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Combined Feed */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Live Feed — All Buildings
        </h2>
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-surface-200 dark:divide-surface-800">
            {mockFeed.map((post) => (
              <div key={post.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {post.type === "complete" && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {post.type === "message" && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <MessageCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {post.type === "flagged" && (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {post.type === "system" && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                        {post.building}
                      </span>
                      <span className="text-xs text-surface-400">{post.time}</span>
                    </div>
                    <p className="text-sm text-surface-800 dark:text-surface-100">
                      <span className="font-medium">{post.user}</span>{" "}
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
