import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MRRBadge } from "@/components/MRRBadge";
import { GrowthBadge } from "@/components/GrowthBadge";
import { MRRChart } from "@/components/MRRChart";
import { MilestoneBadges } from "@/components/MilestoneBadges";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { formatMRR, growthPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ updated?: string; submitted?: string }>;
}

async function getFounder(slug: string) {
  return prisma.founder.findUnique({
    where: { slug },
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 24,
      },
      milestones: {
        orderBy: { amount: "asc" },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const founder = await getFounder(slug);
  if (!founder) return {};

  const title = `${founder.productName} — ${formatMRR(founder.mrr, founder.currency)}/mo`;
  const description = `${founder.name} is making ${formatMRR(founder.mrr, founder.currency)}/mo with ${founder.productName}. Follow their journey on MRR.fyi.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mrr.fyi/${founder.slug}`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(founder.twitter && { creator: `@${founder.twitter}` }),
    },
  };
}

export default async function FounderProfile({ params, searchParams }: Props) {
  const { slug } = await params;
  const founder = await getFounder(slug);

  if (!founder) notFound();

  const { updated, submitted } = await searchParams;

  const previousMRR = founder.snapshots[1]?.mrr ?? null;
  const growth = previousMRR !== null ? growthPercent(founder.mrr, previousMRR) : null;
  const rank = await prisma.founder.count({ where: { mrr: { gt: founder.mrr } } }) + 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: founder.name,
    url: `https://mrr.fyi/${founder.slug}`,
    ...(founder.twitter && {
      sameAs: [`https://x.com/${founder.twitter}`],
    }),
    worksFor: {
      "@type": "Organization",
      name: founder.productName,
      url: founder.productUrl,
    },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {(updated || submitted) && (
        <div
          className="mb-6 px-4 py-3 rounded-lg border border-[var(--emerald)] text-sm flex items-center justify-between gap-4 flex-wrap"
          style={{ background: "rgba(16,185,129,0.08)", color: "var(--emerald)" }}
        >
          <span>
            {submitted
              ? "You're on the leaderboard. Check your email for your private update link."
              : "MRR updated. New snapshot recorded."}
          </span>
          <ShareButton
            text={`I'm making ${formatMRR(founder.mrr, founder.currency)}/mo with ${founder.productName} 🚀`}
            url={`https://mrr.fyi/${founder.slug}`}
            variant="success"
          />
        </div>
      )}
      {(updated || submitted) && !founder.verified && !founder.featured && (
        <a
          href={`/pricing?slug=${founder.slug}`}
          className="block mb-6 px-4 py-3 rounded-lg border border-dashed border-[var(--border-accent)] text-sm text-[var(--text-muted)] hover:border-[var(--amber)] hover:text-[var(--text)] transition-colors text-center"
        >
          Stand out — get a <span className="text-[var(--emerald)] font-semibold">verified badge</span> from $9/mo →
        </a>
      )}
      {/* Back */}
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to leaderboard
      </a>

      {/* Header card */}
      <div
        className={`rounded-xl border p-6 mb-6 animate-fade-up stagger-1 ${
          founder.featured
            ? "featured-glow border-[var(--amber)] bg-[var(--amber-glow)]"
            : "border-[var(--border)] bg-[var(--bg-card)]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1
                className="text-2xl"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {founder.productName}
              </h1>
              {founder.featured && (
                <span className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm bg-[var(--amber)] text-black">
                  FEATURED
                </span>
              )}
              {founder.verified && (
                <span
                  className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm"
                  style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)" }}
                >
                  ✓ VERIFIED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span>{founder.name}</span>
              {founder.twitter && (
                <>
                  <span className="text-[var(--text-dim)]">·</span>
                  <a
                    href={`https://x.com/${founder.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--amber)] transition-colors"
                  >
                    @{founder.twitter}
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <MRRBadge mrr={founder.mrr} currency={founder.currency} size="lg" />
            <div className="mt-1 flex items-center justify-end gap-2">
              <GrowthBadge percent={growth} />
            </div>
          </div>
        </div>

        {founder.description && (
          <p className="mt-4 text-sm text-[var(--text-muted)] border-t border-[var(--border)] pt-4">
            {founder.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4">
          <a
            href={founder.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--amber)] hover:underline flex items-center gap-1"
          >
            Visit {founder.productName} →
          </a>
          <span className="text-xs text-[var(--text-dim)]">
            Rank #{rank} on leaderboard
          </span>
          <div className="ml-auto flex items-center gap-2">
            <EmbedButton slug={founder.slug} />
            <ShareButton
              text={`${founder.productName} is making ${formatMRR(founder.mrr, founder.currency)}/mo — ranked #${rank} on MRR.fyi 🚀`}
              url={`https://mrr.fyi/${founder.slug}`}
            />
          </div>
        </div>
      </div>

      {/* Upgrade banner for free profiles */}
      {!founder.featured && !founder.verified && (
        <a
          href={`/pricing?slug=${founder.slug}`}
          className="block mb-6 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-accent)] transition-colors animate-fade-up stagger-2 group"
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--text-muted)]">
              <span
                className="inline-block text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm mr-2"
                style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)" }}
              >
                ✓
              </span>
              Get verified for $9/mo or{" "}
              <span className="text-[var(--amber)]">featured for $29/mo</span>
            </span>
            <span className="text-xs text-[var(--text-dim)] group-hover:text-[var(--text-muted)] transition-colors">
              Learn more →
            </span>
          </div>
        </a>
      )}

      {/* MRR Chart */}
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-up stagger-2"
      >
        <h2
          className="text-sm font-medium text-[var(--text-muted)] mb-4 mono uppercase tracking-widest"
        >
          MRR over time
        </h2>
        <MRRChart snapshots={founder.snapshots} currency={founder.currency} />
      </div>

      {/* Milestones */}
      {founder.milestones.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--text-muted)] mono uppercase tracking-widest">
              Milestones
            </h2>
            <ShareButton
              text={`I just hit ${formatMRR(founder.milestones[founder.milestones.length - 1].amount, founder.currency)} MRR with ${founder.productName}! 🏆`}
              url={`https://mrr.fyi/${founder.slug}`}
              variant="amber"
            />
          </div>
          <MilestoneBadges milestones={founder.milestones} currency={founder.currency} />
        </div>
      )}

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-3 mb-8 animate-fade-up stagger-3"
      >
        {[
          {
            label: "Current MRR",
            value: formatMRR(founder.mrr, founder.currency),
          },
          {
            label: "Annual Run Rate",
            value: formatMRR(founder.mrr * 12, founder.currency),
          },
          {
            label: "Snapshots",
            value: String(founder.snapshots.length),
          },
          {
            label: "On board since",
            value: new Date(founder.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
          >
            <div className="mono text-base font-semibold text-[var(--text)]">
              {stat.value}
            </div>
            <div className="text-xs text-[var(--text-dim)] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Promotion CTA */}
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center animate-fade-up stagger-4"
      >
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Is this your product? Get a verified badge or featured placement.
        </p>
        <a
          href={`/pricing?slug=${founder.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
        >
          View Pricing →
        </a>
      </div>
    </div>
  );
}
