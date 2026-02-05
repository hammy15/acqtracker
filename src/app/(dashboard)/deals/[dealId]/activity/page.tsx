"use client";

import { useParams } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Upload,
  MessageCircle,
  UserPlus,
  AlertTriangle,
  FileText,
  Settings,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "task_complete" | "file_upload" | "comment" | "user_added" | "status_change" | "blocked" | "document" | "setting";

const activityIcon: Record<ActivityType, { icon: React.ReactNode; bg: string }> = {
  task_complete: { icon: <CheckCircle2 className="w-4 h-4 text-white" />, bg: "bg-emerald-500" },
  file_upload: { icon: <Upload className="w-4 h-4 text-white" />, bg: "bg-blue-500" },
  comment: { icon: <MessageCircle className="w-4 h-4 text-white" />, bg: "bg-primary-500" },
  user_added: { icon: <UserPlus className="w-4 h-4 text-white" />, bg: "bg-purple-500" },
  status_change: { icon: <Eye className="w-4 h-4 text-white" />, bg: "bg-amber-500" },
  blocked: { icon: <AlertTriangle className="w-4 h-4 text-white" />, bg: "bg-red-500" },
  document: { icon: <FileText className="w-4 h-4 text-white" />, bg: "bg-indigo-500" },
  setting: { icon: <Settings className="w-4 h-4 text-white" />, bg: "bg-surface-500" },
};

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: string;
  action: string;
  detail: string;
  time: string;
  date: string;
}

const mockActivities: ActivityItem[] = [
  { id: "1", type: "task_complete", user: "Owen Richardson", action: "completed task", detail: "Surety Bond — add new facility", time: "11:45 AM", date: "Today" },
  { id: "2", type: "file_upload", user: "Sarah Chen", action: "uploaded file", detail: "Accounts_Receivable_Aging.xlsx", time: "11:02 AM", date: "Today" },
  { id: "3", type: "comment", user: "Steve Anderson", action: "commented on", detail: "Complete Medicaid License Application", time: "10:45 AM", date: "Today" },
  { id: "4", type: "blocked", user: "Tim Brooks", action: "flagged as blocked", detail: "Order new hire packets — waiting on printer vendor", time: "10:20 AM", date: "Today" },
  { id: "5", type: "status_change", user: "Owen Richardson", action: "changed deal status to", detail: "CHOW Filed", time: "9:30 AM", date: "Today" },
  { id: "6", type: "document", user: "Steve Anderson", action: "marked as received", detail: "Medicare License Application", time: "4:15 PM", date: "Yesterday" },
  { id: "7", type: "task_complete", user: "Owen Richardson", action: "completed task", detail: "Liability / Property — obtain building specifics", time: "3:45 PM", date: "Yesterday" },
  { id: "8", type: "file_upload", user: "James Peterson", action: "uploaded file", detail: "Phase1_Environmental_Report.pdf", time: "2:30 PM", date: "Yesterday" },
  { id: "9", type: "user_added", user: "Owen Richardson", action: "added team member", detail: "Sarah Chen as Accounting Lead", time: "11:00 AM", date: "Yesterday" },
  { id: "10", type: "comment", user: "Doug Martinez", action: "commented on", detail: "Evaluate facility rate structure", time: "10:15 AM", date: "Yesterday" },
  { id: "11", type: "task_complete", user: "Steve Anderson", action: "completed task", detail: "Complete Medicare License Application", time: "5:00 PM", date: "Feb 1, 2026" },
  { id: "12", type: "setting", user: "Owen Richardson", action: "updated deal setting", detail: "Target close date changed to Mar 15, 2026", time: "9:00 AM", date: "Feb 1, 2026" },
  { id: "13", type: "file_upload", user: "Tim Brooks", action: "uploaded file", detail: "Current_Employee_Handbook.pdf", time: "3:30 PM", date: "Jan 30, 2026" },
  { id: "14", type: "task_complete", user: "Owen Richardson", action: "completed task", detail: "Articles of Incorporation", time: "2:00 PM", date: "Jan 28, 2026" },
];

export default function ActivityPage() {
  const params = useParams();

  const groupedByDate: Record<string, ActivityItem[]> = {};
  mockActivities.forEach((a) => {
    if (!groupedByDate[a.date]) groupedByDate[a.date] = [];
    groupedByDate[a.date].push(a);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary-500" />
          Activity Log
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Recent activity across all workstreams
        </p>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedByDate).map(([date, activities]) => (
          <div key={date}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
              {date}
            </h3>
            <div className="space-y-0">
              {activities.map((activity, i) => {
                const ai = activityIcon[activity.type];
                const isLast = i === activities.length - 1;
                return (
                  <div key={activity.id} className="flex gap-4">
                    {/* Timeline line + icon */}
                    <div className="flex flex-col items-center">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", ai.bg)}>
                        {ai.icon}
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-surface-200 dark:bg-surface-700 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 min-w-0">
                      <p className="text-sm text-surface-800 dark:text-surface-100">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        <span className="text-surface-500 dark:text-surface-400">{activity.action}</span>{" "}
                        <span className="font-medium text-surface-700 dark:text-surface-200">{activity.detail}</span>
                      </p>
                      <p className="text-xs text-surface-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
