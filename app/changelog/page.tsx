import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — MRR.fyi",
  description:
    "Recent product updates and new features on MRR.fyi, the public indie revenue leaderboard.",
};

const entries = [
  {
    date: "Mar 20, 2026",
    title: "Analytics & Social Sharing",
    description:
      "Added Plausible analytics for privacy-friendly usage tracking, plus Twitter/X share buttons and optimized OG cards so founders can show off their ranking.",
  },
  {
    date: "Mar 19, 2026",
    title: "Milestones & Celebrations",
    description:
      "Founders now earn milestone badges at $100, $500, $1K, $5K, $10K, $50K, and $100K MRR. Each milestone triggers a celebration email you can share with your audience.",
  },
  {
    date: "Mar 19, 2026",
    title: "Public API v1",
    description:
      "Free, read-only API for the leaderboard and individual founder data. No API key required — perfect for building integrations and dashboards.",
  },
  {
    date: "Mar 19, 2026",
    title: "Admin Dashboard",
    description:
      "Internal dashboard for managing founders, verifying revenue data, and monitoring platform health. Keeps the leaderboard accurate and trustworthy.",
  },
  {
    date: "Mar 19, 2026",
    title: "Monthly Email Digests",
    description:
      "Founders receive a monthly recap of their MRR changes, rank movement, and milestones hit. Stays top-of-mind without being noisy.",
  },
  {
    date: "Mar 19, 2026",
    title: "Embeddable MRR Badges",
    description:
      "Generate an SVG badge showing your live MRR that you can embed in your README, landing page, or blog. Updates automatically.",
  },
  {
    date: "Mar 19, 2026",
    title: "Branded Email Templates",
    description:
      "All transactional emails now use polished, on-brand templates — update confirmations, milestone celebrations, and monthly digests.",
  },
  {
    date: "Mar 19, 2026",
    title: "SEO & Rate Limiting",
    description:
      "Added structured data (JSON-LD), dynamic OG images, robots.txt, and sitemap generation. API endpoints are now rate-limited to 60 req/min per IP.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        &larr; Back to leaderboard
      </a>

      <div className="mb-12">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Changelog
        </h1>
        <p className="text-[var(--text-muted)] max-w-lg">
          What&apos;s new on MRR.fyi. We ship fast and share everything.
        </p>
      </div>

      <div className="space-y-0">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="relative pl-6 pb-10 border-l border-[var(--border)] last:pb-0"
          >
            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
            <p className="text-xs text-[var(--text-dim)] mb-1 mono">
              {entry.date}
            </p>
            <h2
              className="text-lg mb-1"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              {entry.title}
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {entry.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
