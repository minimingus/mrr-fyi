"use client";

import { useState } from "react";
import { FounderRow } from "./FounderRow";
import type { Founder, MRRSnapshot } from "@prisma/client";

type FounderWithSnapshots = Founder & {
  snapshots: Pick<MRRSnapshot, "mrr" | "recordedAt">[];
};

interface LeaderboardListProps {
  founders: FounderWithSnapshots[];
}

export function LeaderboardList({ founders }: LeaderboardListProps) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? founders.filter((f) => {
        const q = query.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.productName.toLowerCase().includes(q)
        );
      })
    : founders;

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by founder or product name…"
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors mono"
        />
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-xs text-[var(--text-dim)] uppercase tracking-widest mono">
          Rank · Product
        </span>
        <span className="text-xs text-[var(--text-dim)] uppercase tracking-widest mono">
          MRR
        </span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] text-sm">
            No founders matching &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((founder, i) => (
            <FounderRow
              key={founder.id}
              founder={founder}
              rank={founders.indexOf(founder) + 1}
              style={{ animationDelay: `${0.05 * i}s`, opacity: 0 }}
            />
          ))}
        </div>
      )}
    </>
  );
}
