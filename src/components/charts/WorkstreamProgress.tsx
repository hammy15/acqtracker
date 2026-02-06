"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WorkstreamProgressData {
  workstream: string;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
}

interface WorkstreamProgressProps {
  data: WorkstreamProgressData[];
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-28 bg-surface-200 dark:bg-surface-700 rounded" />
          <div className="flex-1 h-5 bg-surface-200 dark:bg-surface-700 rounded" />
        </div>
      ))}
    </div>
  );
}

const COLORS = {
  completed: "#14b8a6",
  inProgress: "#f59e0b",
  blocked: "#ef4444",
  notStarted: "#9ca3af",
};

const LABELS: Record<string, string> = {
  completed: "Completed",
  inProgress: "In Progress",
  blocked: "Blocked",
  notStarted: "Not Started",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, p: any) => sum + (p.value ?? 0), 0);
    return (
      <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-1">
          {label}
        </p>
        {payload.map((entry: any) => (
          <p
            key={entry.dataKey}
            className="text-xs"
            style={{ color: entry.color }}
          >
            {LABELS[entry.dataKey] ?? entry.dataKey}: {entry.value}
          </p>
        ))}
        <p className="text-xs text-surface-400 mt-1 pt-1 border-t border-surface-200 dark:border-surface-700">
          Total: {total}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-surface-500 dark:text-surface-400">
            {LABELS[entry.value] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Format long workstream names for the Y axis
function formatWorkstream(name: string): string {
  if (name.length <= 16) return name;
  // Truncate with ellipsis
  return name.substring(0, 14) + "...";
}

export function WorkstreamProgress({ data }: WorkstreamProgressProps) {
  if (!data || data.length === 0) {
    return <ChartSkeleton />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="workstream"
          width={120}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatWorkstream}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(20, 184, 166, 0.05)" }} />
        <Legend content={<CustomLegend />} />
        <Bar
          dataKey="completed"
          stackId="stack"
          fill={COLORS.completed}
          radius={[0, 0, 0, 0]}
          barSize={20}
        />
        <Bar
          dataKey="inProgress"
          stackId="stack"
          fill={COLORS.inProgress}
          barSize={20}
        />
        <Bar
          dataKey="blocked"
          stackId="stack"
          fill={COLORS.blocked}
          barSize={20}
        />
        <Bar
          dataKey="notStarted"
          stackId="stack"
          fill={COLORS.notStarted}
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WorkstreamProgressSkeleton() {
  return <ChartSkeleton />;
}
