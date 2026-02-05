"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  area: string;
  confirmed: boolean;
}

const mockTeam: TeamMember[] = [
  { id: "1", name: "Owen Richardson", role: "Team Lead / Admin", phone: "(208) 555-0101", email: "owen@company.com", area: "Front Office / Administration", confirmed: true },
  { id: "2", name: "Steve Anderson", role: "Licensing & Compliance", phone: "(208) 555-0102", email: "steve@company.com", area: "Business Office", confirmed: true },
  { id: "3", name: "Tim Brooks", role: "HR / Employee Transition", phone: "(208) 555-0103", email: "tim@company.com", area: "Break Room / HR Office", confirmed: true },
  { id: "4", name: "Doug Martinez", role: "Operations & Clinical", phone: "(208) 555-0104", email: "doug@company.com", area: "Nursing Station / Clinical", confirmed: false },
  { id: "5", name: "Sarah Chen", role: "Accounting & Finance", phone: "(208) 555-0105", email: "sarah@company.com", area: "Business Office", confirmed: true },
  { id: "6", name: "James Peterson", role: "Facilities & Maintenance", phone: "(208) 555-0106", email: "james@company.com", area: "Maintenance / Physical Plant", confirmed: false },
];

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

  const confirmed = mockTeam.filter((m) => m.confirmed).length;

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
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{mockTeam.length}</p>
          <p className="text-xs text-surface-400">Team Members</p>
        </div>
        <div className="neu-card text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{confirmed}</p>
          <p className="text-xs text-surface-400">Confirmed</p>
        </div>
        <div className="neu-card text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{mockTeam.length - confirmed}</p>
          <p className="text-xs text-surface-400">Pending</p>
        </div>
        <div className="neu-card text-center">
          <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">6</p>
          <p className="text-xs text-surface-400">Areas Covered</p>
        </div>
      </div>

      {/* Team Assignments */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">
          Team Assignments
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {mockTeam.map((member) => (
            <div key={member.id} className="neu-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    {member.name}
                  </h3>
                  <p className="text-sm text-primary-500">{member.role}</p>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    member.confirmed
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {member.confirmed ? "Confirmed" : "Pending"}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-surface-500 dark:text-surface-400">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> {member.area}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {member.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3 h-3" /> {member.email}
                </p>
              </div>
            </div>
          ))}
        </div>
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
