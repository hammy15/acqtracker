import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const getColor = () => {
    if (percentage >= 70) return "from-emerald-400 to-emerald-600";
    if (percentage >= 30) return "from-primary-400 to-primary-600";
    return "from-accent-400 to-accent-600";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "neu-progress flex-1",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-smooth",
            getColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-surface-500 dark:text-surface-400 tabular-nums min-w-[3ch]">
          {percentage}%
        </span>
      )}
    </div>
  );
}
