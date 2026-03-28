import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MRRBadge } from "@/components/MRRBadge";
import { GrowthBadge } from "@/components/GrowthBadge";
import { MRRChart } from "@/components/MRRChart";
import { MilestoneBadges } from "@/components/MilestoneBadges";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { BadgeButton } from "@/components/BadgeButton";
import { BadgeSection } from "@/components/BadgeSection";
import { ReferralSection } from "@/components/ReferralSection";
import { formatMRR, growthPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ updated?: string; submitted?: string; payment?: string }>;
}

async function getFounder(slug: string) {
  const founder = await prisma.founder.findUnique({
    where: { slug },
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 12,
      },
      milestones: {
        orderBy: { amount: "asc" },
      },
      _count: {
        select: { referralsMade: true, snapshots: true },
      },
    },
  });

  if (!founder) return null;

  const referrer = founder.referredBy
    ? await prisma.founder.findUnique({
        where: { referralCode: founder.referredBy },
        select: { name: true, slug: true, productName: true },
      })
    : null;

  return { founder, referrer };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getFounder(slug);
  const founder = result?.founder;
  if (!founder || !founder.emailVerified) return {};

  const title = `${founder.productName} — ${formatMRR(founder.mrr, founder.currency)}/mo`;
  const description = `${founder.name} is making ${formatMRR(founder.mrr, founder.currency)}/mo with ${founder.productName}. Follow their journey on MRR.fyi.`;

  const ogImageUrl = `https://mrr.fyi/${founder.slug}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mrr.fyi/${founder.slug}`,
      type: "profile",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      ...(founder.twitter && { creator: `@${founder.twitter}` }),
    },
  };
}

export default async function FounderProfile({ params, searchParams }: Props) {
  const { slug } = await params;
  const result = await getFounder(slug);
  const founder = result?.founder;
  const referrer = result?.referrer ?? null;

  if (!founder || !founder.emailVerified) notFound();

  const { updated, submitted, payment } = await searchParams;

  const previousMRR = founder.snapshots[1]?.mrr ?? null;
  const growth = previousMRR !== null ? growthPercent(founder.mrr, previousMRR) : null;
  const rank = await prisma.founder.count({ where: { emailVerified: true, mrr: { gt: founder.mrr } } }) + 1;

  const mrrDollars = founder.mrr / 100;
  const mrrShortText = mrrDollars >= 1000
    ? `$${Math.round(mrrDollars / 1000)}k`
    : `$${Math.round(mrrDollars)}`;
  const shareMRRText = `Crossed ${mrrShortText} MRR with ${founder.productName} 🚀 Tracking progress publicly at mrr.fyi/${founder.slug}`;
  const tweetMRRText = founder.mrr === 0
    ? `Building ${founder.productName} in public — tracking MRR at mrr.fyi/${founder.slug} #buildinpublic`
    : `I make ${formatMRR(founder.mrr, founder.currency)}/mo with ${founder.productName} — tracking it publicly at mrr.fyi/${founder.slug} #buildinpublic #indiehacker`;
  const rankMedal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const shareRankText = `${rankMedal ? `${rankMedal} ` : ""}${founder.productName} is making ${formatMRR(founder.mrr, founder.currency)}/mo — MRR profile on mrr.fyi 🚀`;

  const jsonLd = [
    {
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
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: founder.productName,
      url: founder.productUrl,
      ...(founder.description && { description: founder.description }),
      offers: {
        "@type": "Offer",
        priceCurrency: founder.currency,
        availability: "https://schema.org/InStock",
      },
      creator: {
        "@type": "Person",
        name: founder.name,
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {payment === "success" && (
        <div
          className="mb-6 px-4 py-3 rounded-lg border border-[var(--emerald)] text-sm"
          style={{ background: "rgba(16,185,129,0.08)", color: "var(--emerald)" }}
        >
          Payment successful! Your badge is now active and your listing has been upgraded.
        </div>
      )}
      {(updated || submitted) && (
        <div
          className="mb-6 px-4 py-3 rounded-lg border border-[var(--emerald)] text-sm flex items-center justify-between gap-4 flex-wrap"
          style={{ background: "rgba(16,185,129,0.08)", color: "var(--emerald)" }}
        >
          <span>
            {submitted
              ? "Your profile is live. Check your email for your private update link."
              : "MRR updated. New snapshot recorded."}
          </span>
          <ShareButton
            text={`I'm making ${formatMRR(founder.mrr, founder.currency)}/mo with ${founder.productName} 🚀`}
            url={`https://mrr.fyi/${founder.slug}`}
            variant="success"
            source={submitted ? "verify" : "update"}
          />
        </div>
      )}
      {(updated || submitted) && !founder.isPro && !founder.featured && (
        <a
          href={`/pricing?slug=${founder.slug}`}
          className="block mb-6 px-4 py-3 rounded-lg border border-dashed border-[var(--border-accent)] text-sm text-[var(--text-muted)] hover:border-[var(--amber)] hover:text-[var(--text)] transition-colors text-center"
        >
          Stand out — try <span className="text-[var(--amber)] font-semibold">Pro</span> free for 7 days →
        </a>
      )}
      {/* Back */}
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to profiles
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
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {founder.avatarUrl ? (
              <img
                src={founder.avatarUrl}
                alt={founder.name}
                className="w-14 h-14 rounded-full object-cover shrink-0 border border-[var(--border)]"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-lg font-semibold border border-[var(--border)] bg-[var(--bg)]"
                style={{ color: "var(--amber)" }}
              >
                {founder.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            )}
            <div>
              {founder.logoUrl && (
                <img
                  src={founder.logoUrl}
                  alt={`${founder.productName} logo`}
                  className="h-8 mb-2 object-contain"
                />
              )}
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
                {founder.isPro && (
                  <span
                    className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm"
                    style={{ background: "rgba(251,191,36,0.15)", color: "var(--amber)" }}
                  >
                    ✦ PRO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] flex-wrap">
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
                {founder.websiteUrl && (
                  <>
                    <span className="text-[var(--text-dim)]">·</span>
                    <a
                      href={founder.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--amber)] transition-colors truncate max-w-[180px]"
                    >
                      {founder.websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
                {founder.linkedinUrl && (
                  <>
                    <span className="text-[var(--text-dim)]">·</span>
                    <a
                      href={founder.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--amber)] transition-colors text-xs"
                    >
                      LinkedIn
                    </a>
                  </>
                )}
              </div>
              {founder.bio && (
                <p className="mt-2 text-sm text-[var(--text-muted)]">{founder.bio}</p>
              )}
              {founder.tags && founder.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {founder.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[10px] mono px-1.5 py-0.5 rounded-sm border border-[var(--border)] text-[var(--text-dim)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div>
              <MRRBadge mrr={founder.stripeMrr ?? founder.mrr} currency={founder.currency} size="lg" />
            </div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <GrowthBadge percent={growth} />
            </div>
            <div className="mt-2 flex justify-end">
              <ShareButton
                text={tweetMRRText}
                url={`https://mrr.fyi/${founder.slug}`}
                source="profile_mrr_display"
              />
            </div>
          </div>
        </div>

        {founder.description && (
          <p className="mt-4 text-sm text-[var(--text-muted)] border-t border-[var(--border)] pt-4">
            {founder.description}
          </p>
        )}

        {founder._count.snapshots >= 1 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-dim)]">
              Share your journey — let your followers discover mrr.fyi
            </p>
            <ShareButton
              text={shareMRRText}
              url={`https://mrr.fyi/${founder.slug}`}
              variant="amber"
              label="Share my MRR"
              source="profile_share_mrr"
            />
          </div>
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
            Rank #{rank} on MRR.fyi
          </span>
          <div className="ml-auto flex items-center gap-2">
            <BadgeButton slug={founder.slug} />
            <EmbedButton slug={founder.slug} />
            <ShareButton
              text={`${founder.productName} is making ${formatMRR(founder.mrr, founder.currency)}/mo — ranked #${rank} on MRR.fyi 🚀`}
              url={`https://mrr.fyi/${founder.slug}`}
            />
          </div>
        </div>
      </div>

      {/* Share my rank card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 mb-6 animate-fade-up stagger-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0 font-bold text-xl"
              style={{ background: "rgba(245,158,11,0.12)", color: "var(--amber)" }}
            >
              {rankMedal ?? `#${rank}`}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {rankMedal ? `${rankMedal} Ranked #${rank} on MRR.fyi` : `Ranked #${rank} on MRR.fyi`}
              </p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Share your rank and let the world know
              </p>
            </div>
          </div>
          <ShareButton
            text={shareRankText}
            url={`https://mrr.fyi/${founder.slug}`}
            variant="amber"
            label="Share my rank"
            source="profile_share_rank"
          />
        </div>
      </div>

      {/* Upgrade banner for free profiles */}
      {!founder.featured && !founder.isPro && (
        <a
          href={`/pricing?slug=${founder.slug}`}
          className="block mb-6 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-accent)] transition-colors animate-fade-up stagger-2 group"
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--text-muted)]">
              <span
                className="inline-block text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm mr-2"
                style={{ background: "rgba(251,191,36,0.15)", color: "var(--amber)" }}
              >
                ✦
              </span>
              Go{" "}
              <span className="text-[var(--amber)]">Pro or Featured free for 7 days</span>
            </span>
            <span className="text-xs text-[var(--text-dim)] group-hover:text-[var(--text-muted)] transition-colors">
              Learn more →
            </span>
          </div>
        </a>
      )}

      {/* MRR Chart */}
      {founder.isPro && founder.snapshots.length >= 2 && (
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
      )}
      {!founder.isPro && founder.snapshots.length >= 2 && (
        <a
          href={`/pricing?slug=${founder.slug}`}
          className="block rounded-xl border border-dashed border-[var(--border-accent)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-up stagger-2 hover:border-[var(--amber)] transition-colors group"
        >
          <h2 className="text-sm font-medium text-[var(--text-muted)] mb-2 mono uppercase tracking-widest">
            MRR over time
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Full MRR history is a{" "}
            <span className="text-[var(--amber)] font-semibold">Pro</span> feature.
          </p>
          <span className="text-xs text-[var(--amber)] group-hover:underline">
            Unlock full history →
          </span>
        </a>
      )}

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
            value: String(founder._count.snapshots),
          },
          {
            label: "On board since",
            value: new Date(founder.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
          },
          ...(founder._count.referralsMade > 0
            ? [
                {
                  label: "Founders referred",
                  value: String(founder._count.referralsMade),
                },
              ]
            : []),
          ...(referrer
            ? [
                {
                  label: "Referred by",
                  value: referrer.productName,
                  href: `/${referrer.slug}`,
                },
              ]
            : []),
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
          >
            <div className="mono text-base font-semibold text-[var(--text)]">
              {"href" in stat && stat.href ? (
                <a href={stat.href} className="hover:text-[var(--amber)] transition-colors">
                  {stat.value}
                </a>
              ) : (
                stat.value
              )}
            </div>
            <div className="text-xs text-[var(--text-dim)] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Share Badge */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8 animate-fade-up stagger-4">
        <h2 className="text-sm font-medium text-[var(--text-muted)] mono uppercase tracking-widest mb-4">
          Share badge
        </h2>
        <p className="text-xs text-[var(--text-dim)] mb-4">
          Add a live MRR badge to your README or website. It updates automatically.
        </p>
        <BadgeSection slug={founder.slug} />
      </div>

      {/* Referral invite */}
      {founder.referralCode && (
        <ReferralSection
          referralCode={founder.referralCode}
          productName={founder.productName}
        />
      )}

      {/* Promotion CTA */}
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center animate-fade-up stagger-4"
      >
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Is this your product? Go Pro or get Featured placement.
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
