"use client";

import { formatMRR } from "@/lib/utils";

interface Milestone {
  amount: number;
  reachedAt: Date | string;
}

interface MilestoneBadgesProps {
  milestones: Milestone[];
  currency?: string;
}

export function MilestoneBadges({ milestones, currency = "USD" }: MilestoneBadgesProps) {
  if (milestones.length === 0) return null;

  const sorted = [...milestones].sort((a, b) => a.amount - b.amount);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {sorted.map((m) => (
        <span
          key={m.amount}
          className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm shrink-0"
          style={{ background: "rgba(245,158,11,0.15)", color: "var(--amber)" }}
          title={`Reached ${new Date(m.reachedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
        >
          🏆 {formatMRR(m.amount, currency)}
        </span>
      ))}
    </div>
  );
}
