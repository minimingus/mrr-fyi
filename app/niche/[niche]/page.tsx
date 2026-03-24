import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LeaderboardList } from "@/components/LeaderboardList";
import type { FounderCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type NicheConfig = {
  label: string;
  category: FounderCategory;
  h1: string;
  description: string;
};

const NICHES: Record<string, NicheConfig> = {
  saas: {
    label: "SaaS",
    category: "SAAS",
    h1: "SaaS MRR Leaderboard",
    description:
      "See real revenue from SaaS founders sharing their MRR publicly on mrr.fyi. Track who's building profitable software businesses in public.",
  },
  newsletter: {
    label: "Newsletter",
    category: "CREATOR",
    h1: "Newsletter Revenue Leaderboard",
    description:
      "See real revenue from newsletter founders sharing their MRR publicly on mrr.fyi. Discover which indie newsletters are actually making money.",
  },
  "ai-tools": {
    label: "AI Tools",
    category: "DEV_TOOLS",
    h1: "AI Tools MRR Leaderboard",
    description:
      "See real revenue from AI tools founders sharing their MRR publicly on mrr.fyi. Track who's monetizing AI in the indie hacker space.",
  },
  "mobile-app": {
    label: "Mobile App",
    category: "SAAS",
    h1: "Mobile App Revenue Leaderboard",
    description:
      "See real revenue from mobile app founders sharing their MRR publicly on mrr.fyi. Discover profitable indie mobile apps built by solo founders.",
  },
  "chrome-extension": {
    label: "Chrome Extension",
    category: "DEV_TOOLS",
    h1: "Chrome Extension Revenue Leaderboard",
    description:
      "See real revenue from Chrome extension founders sharing their MRR publicly on mrr.fyi. Track who's building profitable browser extensions in public.",
  },
};

export const NICHE_SLUGS = Object.keys(NICHES);

interface Props {
  params: Promise<{ niche: string }>;
}

async function getLeaderboard(category: FounderCategory) {
  const where = { emailVerified: true, category };
  const [rows, total] = await Promise.all([
    prisma.founder.findMany({
      where,
      orderBy: [{ featured: "desc" }, { mrr: "desc" }],
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        twitter: true,
        avatarUrl: true,
        productName: true,
        productUrl: true,
        description: true,
        category: true,
        mrr: true,
        currency: true,
        verified: true,
        featured: true,
        stripeAccountId: true,
        stripeMrr: true,
        createdAt: true,
        updatedAt: true,
        snapshots: {
          orderBy: { recordedAt: "desc" },
          take: 2,
          select: { mrr: true, recordedAt: true },
        },
      },
    }),
    prisma.founder.count({ where }),
  ]);
  const founders = rows.map(({ stripeAccountId, ...f }) => ({
    ...f,
    stripeVerified: !!stripeAccountId,
  }));
  return { founders, total };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche } = await params;
  const config = NICHES[niche];
  if (!config) return {};

  const title = `${config.h1} — Indie Hackers Building in Public`;
  return {
    title,
    description: config.description,
    openGraph: {
      title,
      description: config.description,
      url: `https://mrr.fyi/niche/${niche}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: config.description,
    },
  };
}

export default async function NichePage({ params }: Props) {
  const { niche } = await params;
  const config = NICHES[niche];
  if (!config) notFound();

  const { founders, total } = await getLeaderboard(config.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${config.h1} — Indie Hackers Building in Public`,
    description: config.description,
    url: `https://mrr.fyi/niche/${niche}`,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to leaderboard
      </a>

      <div className="mb-10 animate-fade-up stagger-1">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="mono text-xs px-2 py-1 rounded-sm border border-[var(--amber)] text-[var(--amber)]"
            style={{ background: "var(--amber-glow)" }}
          >
            {config.label.toUpperCase()}
          </span>
          <span className="text-xs text-[var(--text-dim)]">
            self-reported · updated in real-time
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl leading-tight mb-4"
          style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
        >
          {config.label}{" "}
          <span style={{ color: "var(--amber)" }}>MRR Leaderboard</span>
        </h1>

        <p className="text-[var(--text-muted)] text-base max-w-lg mb-6">
          {config.description}
        </p>

        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02]"
        >
          Join the Leaderboard →
        </a>
      </div>

      {total > 0 && (
        <div
          className="grid grid-cols-2 gap-px mb-8 rounded-lg overflow-hidden border border-[var(--border)] animate-fade-up stagger-2"
          style={{ background: "var(--border)" }}
        >
          {[
            { label: `${config.label} Founders`, value: String(total) },
            { label: "Niche", value: config.label },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-card)] px-5 py-4 text-center">
              <div className="mono text-lg font-semibold text-[var(--amber)]">
                {stat.value}
              </div>
              <div className="text-xs text-[var(--text-dim)] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {founders.length === 0 ? (
        <div className="text-center py-24 animate-fade-up stagger-3">
          <p
            className="text-4xl mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Be the first.
          </p>
          <p className="text-[var(--text-muted)] mb-6">
            No {config.label} founders yet. Don&rsquo;t be shy.
          </p>
          <a
            href="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
          >
            Join the Leaderboard →
          </a>
        </div>
      ) : (
        <Suspense>
          <LeaderboardList
            founders={founders}
            totalCount={total}
            pageSize={PAGE_SIZE}
            lockedCategory={config.category}
          />
        </Suspense>
      )}

      <div
        className="mt-12 p-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-center animate-fade-up"
        style={{ animationDelay: "0.3s", opacity: 0 }}
      >
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Building a {config.label} product?
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-5">
          Add your MRR to the {config.label} leaderboard. Takes 60 seconds.
        </p>
        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02]"
        >
          Join the Leaderboard →
        </a>
      </div>
    </div>
  );
}
