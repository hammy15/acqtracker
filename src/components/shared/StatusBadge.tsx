import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PIPELINE: { label: "Pipeline", className: "bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-300" },
  LOI: { label: "LOI", className: "bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300" },
  DUE_DILIGENCE: { label: "Due Diligence", className: "bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300" },
  CHOW_FILED: { label: "CHOW Filed", className: "bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300" },
  CLOSING: { label: "Closing", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  TRANSITION_DAY: { label: "Transition Day", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  WEEK_1: { label: "Week 1", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  WEEK_2: { label: "Week 2", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  POST_CLOSE: { label: "Post Close", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  ARCHIVED: { label: "Archived", className: "bg-surface-200 text-surface-500 dark:bg-surface-800 dark:text-surface-400" },
  NOT_STARTED: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
  IN_PROGRESS: { label: "Working", className: "bg-teal-100 text-teal-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-violet-100 text-violet-700" },
  WAITING: { label: "Waiting", className: "bg-amber-100 text-amber-700" },
  BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700" },
  COMPLETE: { label: "Done", className: "bg-emerald-100 text-emerald-700" },
  NA: { label: "N/A", className: "bg-gray-100 text-gray-400" },
  LOW: { label: "Low", className: "bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-300" },
  MEDIUM: { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  HIGH: { label: "High", className: "bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300" },
  CRITICAL: { label: "Critical", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  SNF: { label: "SNF", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  ALF: { label: "ALF", className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  ILF: { label: "ILF", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  HOSPICE: { label: "Hospice", className: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
  IN_HOME: { label: "In-Home", className: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-surface-200 text-surface-600",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-medium border-none",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
