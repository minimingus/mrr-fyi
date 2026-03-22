"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatMRR } from "@/lib/utils";

interface Snapshot {
  recordedAt: Date | string;
  mrr: number;
}

interface MRRChartProps {
  snapshots: Snapshot[];
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2">
      <p className="mono text-sm text-[var(--amber)] font-semibold">
        {formatMRR(payload[0].value, currency)}
      </p>
    </div>
  );
}

export function MRRChart({ snapshots, currency }: MRRChartProps) {
  const data = [...snapshots]
    .reverse()
    .map((s) => ({
      date: new Date(s.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      mrr: s.mrr,
    }));

  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[var(--text-dim)]">
        Not enough data for chart yet
      </div>
    );
  }

  const maxMRR = Math.max(...data.map((d) => d.mrr));
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-dim)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatMRR(v, currency)}
            tick={{ fill: "var(--text-dim)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <ReferenceLine
            y={maxMRR}
            stroke="var(--amber)"
            strokeDasharray="4 4"
            strokeOpacity={0.3}
          />
          <Line
            type="monotone"
            dataKey="mrr"
            stroke="var(--amber)"
            strokeWidth={2}
            dot={{ fill: "var(--amber)", r: 3, strokeWidth: 0 }}
            activeDot={{ fill: "var(--amber)", r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="text-xs text-[var(--text-dim)]">
          <span className="mono">{first.date}</span>
          <span className="ml-1 text-[var(--text-muted)]">{formatMRR(first.mrr, currency)}</span>
        </div>
        <div className="text-xs text-[var(--text-dim)] text-right">
          <span className="mr-1 text-[var(--text-muted)]">{formatMRR(last.mrr, currency)}</span>
          <span className="mono">{last.date}</span>
        </div>
      </div>
    </div>
  );
}
