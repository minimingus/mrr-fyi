import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Analytics Dashboard — MRR.fyi" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

async function getAnalytics(token: string) {
  const founder = await prisma.founder.findUnique({
    where: { updateToken: token },
    select: {
      id: true,
      name: true,
      productName: true,
      slug: true,
      isPro: true,
      emailVerified: true,
    },
  });

  if (!founder || !founder.emailVerified || !founder.isPro) return null;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const events = await prisma.profileEvent.findMany({
    where: {
      founderId: founder.id,
      createdAt: { gte: since },
      // Exclude dedup sentinels
      NOT: { referrer: { startsWith: "dedup:" } },
    },
    select: { type: true, referrer: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const views = events.filter((e) => e.type === "VIEW");
  const clicks = events.filter((e) => e.type === "LINK_CLICK");

  // Referrer breakdown for views
  const viewReferrers = views.reduce<Record<string, number>>((acc, e) => {
    const key = e.referrer ?? "Direct / Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topViewReferrers = Object.entries(viewReferrers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Referrer breakdown for clicks
  const clickReferrers = clicks.reduce<Record<string, number>>((acc, e) => {
    const key = e.referrer ?? "Direct / Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topClickReferrers = Object.entries(clickReferrers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Daily view counts for the past 30 days
  const dailyViews = views.reduce<Record<string, number>>((acc, e) => {
    const day = e.createdAt.toISOString().slice(0, 10);
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});

  return {
    founder,
    totalViews: views.length,
    totalClicks: clicks.length,
    topViewReferrers,
    topClickReferrers,
    dailyViews,
  };
}

export default async function DashboardPage({ params }: Props) {
  const { token } = await params;
  const data = await getAnalytics(token);

  if (!data) notFound();

  const { founder, totalViews, totalClicks, topViewReferrers, topClickReferrers } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href={`/${founder.slug}`}
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to profile
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-dm-serif)" }}>
            Analytics
          </h1>
          <span
            className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm"
            style={{ background: "rgba(251,191,36,0.15)", color: "var(--amber)" }}
          >
            ✦ PRO
          </span>
        </div>
        <p className="text-sm text-[var(--text-dim)]">
          {founder.productName} · last 30 days
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
          <div className="mono text-3xl font-semibold text-[var(--text)]">{totalViews}</div>
          <div className="text-xs text-[var(--text-dim)] mt-1">Profile views</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
          <div className="mono text-3xl font-semibold text-[var(--text)]">{totalClicks}</div>
          <div className="text-xs text-[var(--text-dim)] mt-1">Product link clicks</div>
        </div>
      </div>

      {/* View referrers */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-6">
        <h2 className="text-sm font-medium text-[var(--text-muted)] mono uppercase tracking-widest mb-4">
          Views by referrer
        </h2>
        {topViewReferrers.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No view data yet.</p>
        ) : (
          <div className="space-y-2">
            {topViewReferrers.map(([referrer, count]) => (
              <ReferrerRow
                key={referrer}
                referrer={referrer}
                count={count}
                total={totalViews}
              />
            ))}
          </div>
        )}
      </div>

      {/* Click referrers */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
        <h2 className="text-sm font-medium text-[var(--text-muted)] mono uppercase tracking-widest mb-4">
          Clicks by referrer
        </h2>
        {topClickReferrers.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No click data yet.</p>
        ) : (
          <div className="space-y-2">
            {topClickReferrers.map(([referrer, count]) => (
              <ReferrerRow
                key={referrer}
                referrer={referrer}
                count={count}
                total={totalClicks}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <Link
          href={`/update/${token}`}
          className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
        >
          ← Back to edit profile
        </Link>
      </div>
    </div>
  );
}

function ReferrerRow({
  referrer,
  count,
  total,
}: {
  referrer: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[var(--text)] truncate max-w-[240px]">{referrer}</span>
          <span className="mono text-sm text-[var(--text-muted)] shrink-0 ml-2">
            {count} <span className="text-[var(--text-dim)] text-xs">({pct}%)</span>
          </span>
        </div>
        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "var(--amber)",
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </div>
  );
}
