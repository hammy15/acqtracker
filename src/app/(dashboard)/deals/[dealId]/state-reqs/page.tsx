"use client";

import { useParams } from "next/navigation";
import {
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Shield,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

export default function StateReqsPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const { data: deal, isLoading: dealLoading } = trpc.deals.getById.useQuery(
    { id: dealId },
    { enabled: !!dealId }
  );

  const { data: stateReq, isLoading: reqLoading } = trpc.stateReqs.getByState.useQuery(
    {
      stateCode: deal?.state ?? "ID",
      facilityType: (deal?.facilityType ?? "SNF") as "SNF" | "ALF" | "ILF" | "HOSPICE" | "IN_HOME",
    },
    { enabled: !!deal?.state && !!deal?.facilityType }
  );

  // Fetch tasks filtered to administration workstream (regulatory tasks)
  const { data: regTasks } = trpc.tasks.listByDeal.useQuery(
    { dealId, workstream: "Administration" },
    { enabled: !!dealId }
  );

  const isLoading = dealLoading || reqLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const tasks = regTasks ?? [];
  const completed = tasks.filter((t: { status: string }) => t.status === "COMPLETE").length;
  const total = tasks.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary-500" />
          State Requirements
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          {deal?.state ?? "—"} {deal?.facilityType ?? ""} Change of Ownership (CHOW) Requirements
        </p>
      </div>

      {/* State Info Summary Card */}
      {stateReq && (
        <div className="neu-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-surface-100">
                  {stateReq.licensingBody ?? "State Licensing Body"}
                </h2>
                {stateReq.licensingBodyUrl && (
                  <a
                    href={stateReq.licensingBodyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">
                  {completed}/{total}
                </p>
                <p className="text-xs text-surface-400">Tasks Complete</p>
              </div>
              <div className="w-32 h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-surface-800">
            <div>
              <p className="text-xs text-surface-400">Processing Time</p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {stateReq.processingTimelineDays ? `${stateReq.processingTimelineDays} days` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-400">Surety Bond</p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {stateReq.suretyBondRequired
                  ? stateReq.suretyBondAmount
                    ? `$${Number(stateReq.suretyBondAmount).toLocaleString()}`
                    : "Required"
                  : "Not Required"}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-400">CON Required</p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {stateReq.conRequired ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-400">Background Check</p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {stateReq.backgroundCheckRequired ? "Required" : "Not Required"}
              </p>
            </div>
          </div>

          {stateReq.notes && (
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-4 italic">
              {stateReq.notes}
            </p>
          )}
        </div>
      )}

      {!stateReq && !reqLoading && (
        <div className="neu-card text-center py-8">
          <Shield className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400">
            No state requirements configured for {deal?.state ?? "this state"} / {deal?.facilityType ?? "this facility type"}.
          </p>
        </div>
      )}

      {/* Regulatory Tasks List */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500">
            Administration Tasks
          </h3>
          {tasks.map((task: any) => {
            const isComplete = task.status === "COMPLETE";
            const isBlocked = task.status === "BLOCKED";
            const isInProgress = task.status === "IN_PROGRESS";

            return (
              <div key={task.id} className="neu-card">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full mt-1.5 shrink-0",
                      isComplete && "bg-emerald-500",
                      isInProgress && "bg-primary-500",
                      isBlocked && "bg-red-500",
                      !isComplete && !isInProgress && !isBlocked && "bg-surface-300 dark:bg-surface-600"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium whitespace-nowrap",
                          isComplete && "text-emerald-600 dark:text-emerald-400",
                          isInProgress && "text-primary-600 dark:text-primary-400",
                          isBlocked && "text-red-600 dark:text-red-400",
                          !isComplete && !isInProgress && !isBlocked && "text-surface-500"
                        )}
                      >
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-surface-400">
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {task.assignedTo.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.flagReason && (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {task.flagReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
