"use client";

import { useParams } from "next/navigation";
import { Calendar, Clock, BarChart3 } from "lucide-react";

export default function TimelinePage() {
  const params = useParams();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary-500" />
          Timeline
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Visualize the acquisition timeline and milestones
        </p>
      </div>

      {/* Coming Soon */}
      <div className="neu-card text-center py-20">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <BarChart3 className="w-16 h-16 text-surface-300 dark:text-surface-600" />
            <Clock className="w-8 h-8 text-primary-500 absolute -bottom-1 -right-1" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
          Gantt Chart Coming Soon
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-md mx-auto">
          The interactive timeline view with Gantt chart visualization, milestone tracking,
          and dependency mapping is currently under development. Check back soon.
        </p>
        <div className="mt-8 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-500">38</p>
            <p className="text-xs text-surface-400 mt-1">Days to Close</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">12</p>
            <p className="text-xs text-surface-400 mt-1">Milestones Set</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">3</p>
            <p className="text-xs text-surface-400 mt-1">Critical Path Items</p>
          </div>
        </div>
      </div>

      {/* Milestones Preview */}
      <div className="neu-card">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Key Milestones
        </h3>
        <div className="space-y-3">
          {[
            { name: "LOI Signed", date: "Jan 5, 2026", done: true },
            { name: "Due Diligence Complete", date: "Feb 15, 2026", done: true },
            { name: "CHOW Application Filed", date: "Feb 20, 2026", done: true },
            { name: "CHOW Approval", date: "Mar 1, 2026", done: false },
            { name: "Financing Finalized", date: "Mar 5, 2026", done: false },
            { name: "Closing Day", date: "Mar 15, 2026", done: false },
            { name: "Transition Day", date: "Mar 15, 2026", done: false },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  m.done ? "bg-emerald-500" : "bg-surface-300 dark:bg-surface-600"
                }`}
              />
              <span
                className={`text-sm flex-1 ${
                  m.done
                    ? "text-surface-400 line-through"
                    : "text-surface-800 dark:text-surface-100 font-medium"
                }`}
              >
                {m.name}
              </span>
              <span className="text-xs text-surface-400">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
