"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TaskCompletionTrendData {
  date: string;
  completed: number;
  total: number;
}

interface TaskCompletionTrendProps {
  data: TaskCompletionTrendData[];
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[260px] bg-surface-200 dark:bg-surface-700 rounded-lg" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 shadow-lg">
        <p className="text-xs text-surface-400 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p
            key={entry.dataKey}
            className="text-sm font-medium"
            style={{ color: entry.color }}
          >
            {entry.dataKey === "completed" ? "Completed" : "Cumulative"}:{" "}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TaskCompletionTrend({ data }: TaskCompletionTrendProps) {
  if (!data || data.length === 0) {
    return <ChartSkeleton />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, left: -10, bottom: 4 }}
      >
        <defs>
          <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(156, 163, 175, 0.15)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          tickFormatter={(value: string) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#9ca3af"
          strokeWidth={2}
          strokeDasharray="5 3"
          fill="url(#grayGradient)"
          fillOpacity={1}
        />
        <Area
          type="monotone"
          dataKey="completed"
          stroke="#14b8a6"
          strokeWidth={2}
          fill="url(#tealGradient)"
          fillOpacity={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TaskCompletionTrendSkeleton() {
  return <ChartSkeleton />;
}
