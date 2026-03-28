"use client";

import Link from "next/link";
import type { PublicFounder } from "./LeaderboardList";
import { MRRBadge } from "./MRRBadge";
import { GrowthBadge } from "./GrowthBadge";
import { formatMRR, growthPercent } from "@/lib/utils";

interface FounderRowProps {
  founder: PublicFounder & { snapshots: { mrr: number; recordedAt: Date }[] };
  rank: number;
  style?: React.CSSProperties;
}

function TrustBadge({ status }: { status: PublicFounder["verificationStatus"] }) {
  if (status === "VERIFIED") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm shrink-0"
        style={{ background: "rgba(251,191,36,0.15)", color: "var(--amber)" }}
      >
        ✦ Pro
      </span>
    );
  }
  if (status === "CONNECTED") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm shrink-0"
        style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#fbbf24" }} />
        Connected
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm shrink-0"
      style={{ background: "rgba(107,114,128,0.15)", color: "#9ca3af" }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#9ca3af" }} />
      Self-reported
    </span>
  );
}

function MRRDisplay({ founder }: { founder: PublicFounder }) {
  if (founder.verificationStatus === "VERIFIED") {
    const mrrValue = founder.stripeMrr ?? founder.mrr;
    const syncedDate = new Date(founder.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return (
      <div className="flex flex-col items-end gap-0.5">
        <MRRBadge mrr={mrrValue} currency={founder.currency} />
        <span className="text-[10px] text-[var(--text-dim)] mono">synced {syncedDate}</span>
      </div>
    );
  }

  if (founder.mrrRangeMin != null && founder.mrrRangeMax != null) {
    const minStr = formatMRR(founder.mrrRangeMin, founder.currency);
    const maxStr = formatMRR(founder.mrrRangeMax, founder.currency);
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="mono font-semibold text-[var(--amber)] tabular-nums text-base">
          {minStr}–{maxStr}
          <span className="text-[var(--text-dim)] text-xs ml-1 font-normal">/mo</span>
        </span>
        <span className="text-[10px] text-[var(--text-dim)] mono">self-reported</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <MRRBadge mrr={founder.mrr} currency={founder.currency} />
      <span className="text-[10px] text-[var(--text-dim)] mono">self-reported</span>
    </div>
  );
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
            <TrustBadge status={founder.verificationStatus} />
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
          <MRRDisplay founder={founder} />
        </div>

        <span className="text-[var(--text-dim)] group-hover:text-[var(--text-muted)] text-sm transition-colors shrink-0">
          →
        </span>
      </div>
    </Link>
  );
}
