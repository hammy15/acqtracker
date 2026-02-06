"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DealComparisonRadarProps {
  data: { metric: string; [dealName: string]: number | string }[];
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-center">
      <div className="h-[280px] w-[280px] rounded-full bg-surface-200 dark:bg-surface-700" />
    </div>
  );
}

const DEAL_COLORS = [
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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
            {entry.dataKey}: {entry.value}
          </p>
        ))}
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
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-surface-500 dark:text-surface-400">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function DealComparisonRadar({ data }: DealComparisonRadarProps) {
  if (!data || data.length === 0) {
    return <ChartSkeleton />;
  }

  // Extract deal names from data keys (excluding "metric")
  const dealNames = Object.keys(data[0] ?? {}).filter((k) => k !== "metric");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid
          stroke="rgba(156, 163, 175, 0.25)"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
        />
        <PolarRadiusAxis
          angle={90}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {dealNames.map((name, i) => (
          <Radar
            key={name}
            name={name}
            dataKey={name}
            stroke={DEAL_COLORS[i % DEAL_COLORS.length]}
            fill={DEAL_COLORS[i % DEAL_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function DealComparisonRadarSkeleton() {
  return <ChartSkeleton />;
}
