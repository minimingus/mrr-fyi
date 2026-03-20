"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { FounderRow } from "./FounderRow";
import type { Founder, MRRSnapshot } from "@prisma/client";

type FounderWithSnapshots = Founder & {
  snapshots: Pick<MRRSnapshot, "mrr" | "recordedAt">[];
};

interface LeaderboardListProps {
  founders: FounderWithSnapshots[];
}

const MRR_RANGES = [
  { label: "All", value: "" },
  { label: "$0–1K", value: "0-1000" },
  { label: "$1K–10K", value: "1000-10000" },
  { label: "$10K–50K", value: "10000-50000" },
  { label: "$50K+", value: "50000-" },
] as const;

function parseMRRRange(range: string): [number, number] | null {
  if (!range) return null;
  const [minStr, maxStr] = range.split("-");
  const min = Number(minStr) || 0;
  const max = maxStr === "" ? Infinity : Number(maxStr) || 0;
  return [min, max];
}

export function LeaderboardList({ founders }: LeaderboardListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = searchParams.get("q") ?? "";
  const range = searchParams.get("range") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const filtered = useMemo(() => {
    let result = founders;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.productName.toLowerCase().includes(q),
      );
    }

    const mrrRange = parseMRRRange(range);
    if (mrrRange) {
      const [min, max] = mrrRange;
      result = result.filter((f) => f.mrr >= min && f.mrr < max);
    }

    return result;
  }, [founders, query, range]);

  return (
    <>
      {/* Search & Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => updateParams({ q: e.target.value })}
          placeholder="Search by founder or product name..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors mono"
        />
        <div className="flex gap-1.5 flex-wrap">
          {MRR_RANGES.map((r) => {
            const active = range === r.value;
            return (
              <button
                key={r.value}
                onClick={() => updateParams({ range: r.value })}
                className={`px-3 py-2 rounded-lg text-xs mono border transition-colors whitespace-nowrap ${
                  active
                    ? "border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)]"
                    : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)] hover:border-[var(--border-accent)] hover:text-[var(--text-muted)]"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
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
            No founders found
            {query && <> matching &ldquo;{query}&rdquo;</>}
            {range && <> in this MRR range</>}
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
