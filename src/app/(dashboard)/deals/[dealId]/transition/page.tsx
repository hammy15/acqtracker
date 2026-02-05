"use client";

import { useParams } from "next/navigation";
import {
  Zap,
  Users,
  UserPlus,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Mail,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const arrivalSchedule = [
  { time: "11:00 PM (night before)", tasks: "Team Lead arrives, meets night shift supervisor, walkthrough" },
  { time: "12:01 AM", tasks: "Ownership effective, begin transition checklist" },
  { time: "12:15 AM", tasks: "Collect keys, safe combos, alarm codes from seller" },
  { time: "12:30 AM", tasks: "Verify narcotics count with outgoing DNS" },
  { time: "1:00 AM", tasks: "IT team begins EHR/phone/network switchover" },
  { time: "5:00 AM", tasks: "Day shift team arrives, orientation prep" },
  { time: "6:00 AM", tasks: "Day shift orientation begins" },
  { time: "8:00 AM", tasks: "Normal business hours — all team members on site" },
];

export default function TransitionPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const { data: assignments, isLoading } = trpc.buildings.listByDeal.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  const teamMembers = assignments ?? [];
  const activeMembers = teamMembers.filter((m: { isActive: boolean }) => m.isActive);
  const leads = activeMembers.filter((m: { onSiteRole: string }) => m.onSiteRole === "BUILDING_LEAD");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary-500" />
            Transition Day Setup
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Plan team assignments and arrival schedule for closing night
          </p>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neu-card text-center">
          <Users className="w-5 h-5 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{activeMembers.length}</p>
          <p className="text-xs text-surface-400">Team Members</p>
        </div>
        <div className="neu-card text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{leads.length}</p>
          <p className="text-xs text-surface-400">Building Leads</p>
        </div>
        <div className="neu-card text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {activeMembers.length - leads.length}
          </p>
          <p className="text-xs text-surface-400">Team Members</p>
        </div>
        <div className="neu-card text-center">
          <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {activeMembers.length > 0 ? Math.min(activeMembers.length, 6) : 0}
          </p>
          <p className="text-xs text-surface-400">Areas Covered</p>
        </div>
      </div>

      {/* Team Assignments */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Team Assignments
        </h2>
        {activeMembers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeMembers.map((member: { id: string; userId: string; onSiteRole: string; isActive: boolean; user: { name: string; email: string; role: string } }) => (
              <div key={member.id} className="neu-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                      {member.user.name}
                    </h3>
                    <p className="text-sm text-primary-500">
                      {member.onSiteRole === "BUILDING_LEAD" ? "Building Lead" : "Team Member"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      member.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-surface-500 dark:text-surface-400">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3 h-3" /> {member.user.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-3 h-3" /> {member.user.role.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="neu-card text-center py-12">
            <Users className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">
              No Team Assigned Yet
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Add team members to begin planning the transition day.
            </p>
          </div>
        )}
      </div>

      {/* Arrival Schedule */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Arrival Schedule
        </h2>
        <div className="neu-card p-0 overflow-hidden">
          <div className="divide-y divide-surface-200 dark:divide-surface-800">
            {arrivalSchedule.map((slot, i) => (
              <div
                key={i}
                className="flex gap-4 px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors"
              >
                <span className="text-sm font-mono font-medium text-primary-500 shrink-0 w-40">
                  {slot.time}
                </span>
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {slot.tasks}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
