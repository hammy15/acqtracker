"use client";

import { useParams } from "next/navigation";
import {
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileText,
  Building2,
  Users,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReqStatus = "complete" | "in_progress" | "not_started" | "blocked";

const statusStyle: Record<ReqStatus, { label: string; dot: string; text: string }> = {
  complete: { label: "Complete", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  in_progress: { label: "In Progress", dot: "bg-primary-500", text: "text-primary-600 dark:text-primary-400" },
  not_started: { label: "Not Started", dot: "bg-surface-300 dark:bg-surface-600", text: "text-surface-500" },
  blocked: { label: "Blocked", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

interface Requirement {
  id: string;
  title: string;
  description: string;
  status: ReqStatus;
  assignee: string;
  dueDate: string;
  notes: string;
}

const idahoRequirements: Requirement[] = [
  {
    id: "1",
    title: "CHOW Application (Form DHW-0015)",
    description: "Submit Change of Ownership application to Idaho Dept of Health & Welfare",
    status: "complete",
    assignee: "Steve Anderson",
    dueDate: "Feb 10, 2026",
    notes: "Filed and received acknowledgment",
  },
  {
    id: "2",
    title: "Background Check — All Owners",
    description: "Criminal background checks for all individuals with 5%+ ownership interest",
    status: "complete",
    assignee: "Owen Richardson",
    dueDate: "Feb 05, 2026",
    notes: "All cleared",
  },
  {
    id: "3",
    title: "Financial Viability Documentation",
    description: "Proof of financial ability to operate including bank statements, credit reports, and financial projections",
    status: "complete",
    assignee: "Sarah Chen",
    dueDate: "Feb 10, 2026",
    notes: "",
  },
  {
    id: "4",
    title: "Administrator Designation",
    description: "Identify licensed Nursing Home Administrator with valid Idaho NHA license",
    status: "in_progress",
    assignee: "Owen Richardson",
    dueDate: "Feb 25, 2026",
    notes: "Interviewing 2 candidates",
  },
  {
    id: "5",
    title: "Director of Nursing Designation",
    description: "Identify RN to serve as DNS with valid Idaho nursing license",
    status: "not_started",
    assignee: "Owen Richardson",
    dueDate: "Mar 01, 2026",
    notes: "",
  },
  {
    id: "6",
    title: "Medical Director Agreement",
    description: "Execute Medical Director agreement with licensed Idaho physician",
    status: "not_started",
    assignee: "Owen Richardson",
    dueDate: "Mar 01, 2026",
    notes: "",
  },
  {
    id: "7",
    title: "Facility Inspection",
    description: "DHW on-site inspection of facility prior to license transfer",
    status: "not_started",
    assignee: "Steve Anderson",
    dueDate: "Mar 05, 2026",
    notes: "Must be scheduled after CHOW approval",
  },
  {
    id: "8",
    title: "Medicare/Medicaid Provider Agreement",
    description: "New CMS-855A enrollment and Medicaid provider agreement for new operator",
    status: "in_progress",
    assignee: "Steve Anderson",
    dueDate: "Mar 01, 2026",
    notes: "CMS-855A submitted, awaiting processing",
  },
  {
    id: "9",
    title: "Surety Bond",
    description: "Idaho requires surety bond for SNF operators — minimum $25,000",
    status: "complete",
    assignee: "Owen Richardson",
    dueDate: "Feb 15, 2026",
    notes: "Bond issued by Travelers",
  },
  {
    id: "10",
    title: "Fire Safety Inspection Report",
    description: "Current fire marshal inspection within 12 months",
    status: "blocked",
    assignee: "James Peterson",
    dueDate: "Feb 28, 2026",
    notes: "Awaiting fire marshal scheduling — backed up 3 weeks",
  },
  {
    id: "11",
    title: "Resident Notification",
    description: "Written notice to all residents/families of ownership change at least 30 days prior",
    status: "not_started",
    assignee: "Doug Martinez",
    dueDate: "Feb 15, 2026",
    notes: "",
  },
  {
    id: "12",
    title: "Employee Notification",
    description: "Written notice to all employees per Idaho WARN Act requirements",
    status: "not_started",
    assignee: "Tim Brooks",
    dueDate: "Feb 15, 2026",
    notes: "",
  },
];

export default function StateReqsPage() {
  const params = useParams();

  const completed = idahoRequirements.filter((r) => r.status === "complete").length;
  const total = idahoRequirements.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary-500" />
          State Requirements
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Idaho SNF Change of Ownership (CHOW) Requirements
        </p>
      </div>

      {/* Summary Card */}
      <div className="neu-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-100">
                Idaho Department of Health &amp; Welfare
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Division of Licensing and Certification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{completed}/{total}</p>
              <p className="text-xs text-surface-400">Requirements Met</p>
            </div>
            <div className="w-32 h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {idahoRequirements.map((req) => {
          const st = statusStyle[req.status];
          return (
            <div key={req.id} className="neu-card">
              <div className="flex items-start gap-4">
                <div className={cn("w-3 h-3 rounded-full mt-1.5 shrink-0", st.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                        {req.title}
                      </h3>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                        {req.description}
                      </p>
                    </div>
                    <span className={cn("text-xs font-medium whitespace-nowrap", st.text)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-surface-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {req.assignee}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {req.dueDate}
                    </span>
                    {req.notes && (
                      <span className="text-surface-500 dark:text-surface-400 italic">
                        {req.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
