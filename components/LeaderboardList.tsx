"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { FounderRow } from "./FounderRow";
import type { FounderCategory, VerificationStatus } from "@prisma/client";

export type PublicFounder = {
  id: string;
  slug: string;
  name: string;
  twitter: string | null;
  avatarUrl: string | null;
  productName: string;
  productUrl: string;
  description: string | null;
  category: FounderCategory | null;
  mrr: number;
  currency: string;
  verified: boolean;
  featured: boolean;
  stripeVerified: boolean;
  stripeMrr: number | null;
  verificationStatus: VerificationStatus;
  mrrRangeMin: number | null;
  mrrRangeMax: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type FounderWithSnapshots = PublicFounder & {
  snapshots: { mrr: number; recordedAt: Date }[];
};

interface LeaderboardListProps {
  founders: FounderWithSnapshots[];
  totalCount: number;
  pageSize: number;
  lockedCategory?: string;
}

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "SaaS", value: "SAAS" },
  { label: "E-commerce", value: "ECOMMERCE" },
  { label: "Agency", value: "AGENCY" },
  { label: "Creator", value: "CREATOR" },
  { label: "Marketplace", value: "MARKETPLACE" },
  { label: "Dev Tools", value: "DEV_TOOLS" },
  { label: "Other", value: "OTHER" },
] as const;

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

export function LeaderboardList({ founders: initialFounders, totalCount, pageSize, lockedCategory }: LeaderboardListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = searchParams.get("q") ?? "";
  const range = searchParams.get("range") ?? "";
  const category = searchParams.get("category") ?? "";
  const tab = searchParams.get("tab") ?? "verified";

  const [allFounders, setAllFounders] = useState(initialFounders);
  const [isLoadingMore, startLoadMore] = useTransition();
  const hasMore = allFounders.length < totalCount;
  const isFiltering = Boolean(query || range || category);

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
    let result = allFounders;

    if (tab === "verified") {
      result = result.filter((f) => f.verificationStatus === "VERIFIED");
    }

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.productName.toLowerCase().includes(q),
      );
    }

    const activeCategory = lockedCategory || category;
    if (activeCategory) {
      result = result.filter((f) => f.category === activeCategory);
    }

    const mrrRange = parseMRRRange(range);
    if (mrrRange) {
      const [min, max] = mrrRange;
      result = result.filter((f) => f.mrr >= min && f.mrr < max);
    }

    return result;
  }, [allFounders, query, range, category, tab, lockedCategory]);

  const loadMore = useCallback(() => {
    const nextPage = Math.floor(allFounders.length / pageSize) + 1;
    startLoadMore(async () => {
      const categoryParam = lockedCategory ? `&category=${lockedCategory}` : "";
      const res = await fetch(`/api/v1/leaderboard?page=${nextPage}&limit=${pageSize}${categoryParam}`);
      if (!res.ok) return;
      const json = await res.json();
      const newFounders: FounderWithSnapshots[] = json.data.map((d: Record<string, unknown>) => ({
        id: d.slug as string,
        slug: d.slug as string,
        name: d.name as string,
        twitter: d.twitter as string | null,
        avatarUrl: (d.avatarUrl as string | null) ?? null,
        productName: d.productName as string,
        productUrl: (d.productUrl as string | null) ?? "",
        description: d.description as string | null,
        category: (d.category as FounderCategory) ?? null,
        mrr: d.mrr as number,
        currency: d.currency as string,
        verified: d.verified as boolean,
        featured: d.featured as boolean,
        stripeVerified: d.stripeVerified as boolean,
        stripeMrr: (d.stripeMrr as number | null) ?? null,
        verificationStatus: (d.verificationStatus as VerificationStatus) ?? "SELF_REPORTED",
        mrrRangeMin: (d.mrrRangeMin as number | null) ?? null,
        mrrRangeMax: (d.mrrRangeMax as number | null) ?? null,
        createdAt: new Date(),
        updatedAt: new Date(d.updatedAt as string),
        snapshots: d.growthPercent != null
          ? [
              { mrr: d.mrr as number, recordedAt: new Date() },
              { mrr: Math.round((d.mrr as number) / (1 + (d.growthPercent as number) / 100)), recordedAt: new Date() },
            ]
          : [{ mrr: d.mrr as number, recordedAt: new Date() }],
      }));
      setAllFounders((prev) => [...prev, ...newFounders]);
    });
  }, [allFounders.length, pageSize, lockedCategory]);

  return (
    <>
      {/* Tabs */}
      <div className="mb-4 flex gap-1">
        {[
          { label: "Verified", value: "verified" },
          { label: "All", value: "all" },
        ].map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => updateParams({ tab: t.value === "verified" ? "" : t.value })}
              className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
                active
                  ? "border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)] hover:border-[var(--border-accent)] hover:text-[var(--text-muted)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

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

      {/* Category filters */}
      <div className="mb-4 flex gap-1.5 flex-wrap items-center">
        {CATEGORIES.map((c) => {
          const active = category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => updateParams({ category: c.value })}
              className={`px-3 py-2 rounded-lg text-xs mono border transition-colors whitespace-nowrap ${
                active
                  ? "border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)] hover:border-[var(--border-accent)] hover:text-[var(--text-muted)]"
              }`}
            >
              {c.label}
            </button>
          );
        })}
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
            {tab === "verified" && !query && !range
              ? "No Stripe-verified founders yet — be the first"
              : <>
                  No founders found
                  {query && <> matching &ldquo;{query}&rdquo;</>}
                  {range && <> in this MRR range</>}
                </>
            }
          </p>
          {tab === "verified" && !query && !range && (
            <a
              href="/submit"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs border transition-colors"
              style={{ borderColor: "#6366f1", color: "#818cf8", background: "rgba(99,102,241,0.1)" }}
            >
              ⚡ Connect Stripe and get verified →
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((founder, i) => (
            <FounderRow
              key={founder.id}
              founder={founder}
              rank={allFounders.indexOf(founder) + 1}
              style={{ animationDelay: `${0.05 * Math.min(i, 19)}s`, opacity: 0 }}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !isFiltering && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] text-sm mono hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? "Loading..." : `Load more founders`}
          </button>
        </div>
      )}
    </>
  );
}
