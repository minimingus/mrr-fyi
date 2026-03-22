"use client";

import Link from "next/link";
import { Founder } from "@prisma/client";
import { MRRBadge } from "./MRRBadge";
import { GrowthBadge } from "./GrowthBadge";
import { growthPercent } from "@/lib/utils";

interface FounderRowProps {
  founder: Founder & { snapshots: { mrr: number; recordedAt: Date }[] };
  rank: number;
  style?: React.CSSProperties;
}

export function FounderRow({ founder, rank, style }: FounderRowProps) {
  const previousMRR = founder.snapshots[1]?.mrr ?? null;
  const growth = previousMRR !== null ? growthPercent(founder.mrr, previousMRR) : null;

  const rankDisplay = rank <= 3
    ? ["🥇", "🥈", "🥉"][rank - 1]
    : String(rank).padStart(2, "0");

  return (
    <Link href={`/${founder.slug}`}>
      <div
        className="group flex items-center gap-4 px-5 py-4 rounded-lg border transition-all duration-200 cursor-pointer border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-accent)] animate-fade-up"
        style={style}
      >
        {/* Rank */}
        <span
          className="mono text-sm w-8 shrink-0 text-center"
          style={{ color: rank <= 3 ? "var(--amber)" : "var(--text-dim)" }}
        >
          {rankDisplay}
        </span>

        {/* Avatar */}
        {founder.avatarUrl ? (
          <img
            src={founder.avatarUrl}
            alt={founder.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--border)]"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold border border-[var(--border)] bg-[var(--bg)]"
            style={{ color: "var(--amber)" }}
          >
            {founder.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
        )}

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[var(--text)] group-hover:text-[var(--amber)] transition-colors truncate">
              {founder.productName}
            </span>
            {founder.featured && (
              <span className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm bg-[var(--amber)] text-black shrink-0">
                FEATURED
              </span>
            )}
            {founder.verified && (
              <span
                className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm shrink-0"
                style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)" }}
              >
                ✓ VERIFIED
              </span>
            )}
            {founder.stripeAccountId && (
              <span
                className="text-[10px] font-semibold mono px-2 py-0.5 rounded-sm shrink-0 border"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  borderColor: "rgba(99,102,241,0.4)",
                }}
                title="MRR verified via Stripe Connect"
              >
                ⚡ STRIPE VERIFIED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[var(--text-dim)] truncate">{founder.name}</span>
            {founder.twitter && (
              <span className="text-xs text-[var(--text-dim)]">
                ·{" "}
                <span
                  className="hover:text-[var(--text-muted)]"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`https://x.com/${founder.twitter}`, "_blank");
                  }}
                >
                  @{founder.twitter}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* MRR + growth */}
        <div className="flex items-center gap-3 shrink-0">
          <GrowthBadge percent={growth} />
          <MRRBadge mrr={founder.mrr} currency={founder.currency} />
        </div>

        <span className="text-[var(--text-dim)] group-hover:text-[var(--text-muted)] text-sm transition-colors shrink-0">
          →
        </span>
      </div>
    </Link>
  );
}
