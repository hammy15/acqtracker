"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PipelineFunnelData {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface PipelineFunnelProps {
  data: PipelineFunnelData[];
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded" />
          <div
            className="h-6 bg-surface-200 dark:bg-surface-700 rounded"
            style={{ width: `${100 - i * 10}%` }}
          />
        </div>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
          {label}
        </p>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {payload[0].value} {payload[0].value === 1 ? "deal" : "deals"}
        </p>
      </div>
    );
  }
  return null;
};

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  if (!data || data.length === 0) {
    return <ChartSkeleton />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          hide
        />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(20, 184, 166, 0.05)" }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PipelineFunnelSkeleton() {
  return <ChartSkeleton />;
}
