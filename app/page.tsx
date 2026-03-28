import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LeaderboardList } from "@/components/LeaderboardList";
import { ShareButton } from "@/components/ShareButton";
import { formatMRR } from "@/lib/utils";
import { BadgeCheck, Quote, Sparkles, TrendingUp, Users, Zap, Link2, Globe } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";

export const dynamic = "force-dynamic";

const LEADERBOARD_PAGE_SIZE = 50;

async function getLeaderboard() {
  const [rows, total] = await Promise.all([
    prisma.founder.findMany({
      where: { emailVerified: true },
      orderBy: [{ featured: "desc" }, { mrr: "desc" }],
      take: LEADERBOARD_PAGE_SIZE,
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
        verificationStatus: true,
        mrrRangeMin: true,
        mrrRangeMax: true,
        createdAt: true,
        updatedAt: true,
        snapshots: {
          orderBy: { recordedAt: "desc" },
          take: 2,
          select: { mrr: true, recordedAt: true },
        },
      },
    }),
    prisma.founder.count({ where: { emailVerified: true } }),
  ]);
  const founders = rows.map(({ stripeAccountId, ...f }) => ({
    ...f,
    stripeVerified: !!stripeAccountId,
  }));
  return { founders, total };
}

async function getStats() {
  const result = await prisma.founder.aggregate({
    where: { emailVerified: true },
    _sum: { mrr: true },
    _count: true,
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const joinedThisWeek = await prisma.founder.count({
    where: { emailVerified: true, createdAt: { gte: oneWeekAgo } },
  });

  return {
    totalMRR: result._sum.mrr ?? 0,
    totalFounders: result._count,
    joinedThisWeek,
  };
}

async function getRecentActivity() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [recentMilestones, recentFounders] = await Promise.all([
    prisma.mRRMilestone.findMany({
      where: { reachedAt: { gte: oneWeekAgo } },
      orderBy: { reachedAt: "desc" },
      take: 5,
      include: {
        founder: { select: { name: true, slug: true, productName: true } },
      },
    }),
    prisma.founder.findMany({
      where: { emailVerified: true, createdAt: { gte: oneWeekAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { name: true, slug: true, productName: true, createdAt: true },
    }),
  ]);

  type ActivityItem = {
    type: "milestone" | "joined";
    name: string;
    slug: string;
    productName: string;
    detail: string;
    at: Date;
  };

  const items: ActivityItem[] = [
    ...recentMilestones.map((m) => ({
      type: "milestone" as const,
      name: m.founder.name,
      slug: m.founder.slug,
      productName: m.founder.productName,
      detail: `hit ${formatMRR(m.amount)} MRR`,
      at: m.reachedAt,
    })),
    ...recentFounders.map((f) => ({
      type: "joined" as const,
      name: f.name,
      slug: f.slug,
      productName: f.productName,
      detail: "got a verified profile",
      at: f.createdAt,
    })),
  ];

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, 5);
}

async function getRecentlyJoined() {
  return prisma.founder.findMany({
    where: { emailVerified: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { name: true, slug: true, productName: true },
  });
}

const TESTIMONIALS = [
  {
    quote:
      "Finally a place where indie founders can flex real numbers — not vanity metrics. MRR.fyi keeps me accountable.",
    name: "Sarah K.",
    product: "MailPilot",
  },
  {
    quote:
      "I put my MRR on here at $800/mo. Three months later I crossed $3k. Something about public accountability just works.",
    name: "Jake M.",
    product: "ShipFast UI",
  },
  {
    quote:
      "Investors actually found me through my verified profile. If you're building in public, there's no reason not to be here.",
    name: "Priya R.",
    product: "FormStack AI",
  },
];

export default async function Home() {
  const [leaderboard, stats, activity, recentlyJoined] = await Promise.all([
    getLeaderboard(),
    getStats(),
    getRecentActivity(),
    getRecentlyJoined(),
  ]);
  const { founders, total: totalFoundersOnLeaderboard } = leaderboard;
  const totalARR = stats.totalMRR * 12;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-14 animate-fade-up stagger-1">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="mono text-xs px-2 py-1 rounded-sm border border-[var(--amber)] text-[var(--amber)]"
            style={{ background: "var(--amber-glow)" }}
          >
            LIVE
          </span>
          <span className="text-xs text-[var(--text-dim)]">
            Stripe-verified · updated in real-time
          </span>
        </div>

        <h1
          className="text-5xl sm:text-6xl leading-tight mb-4"
          style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
        >
          Your Stripe-verified
          <br />
          <span style={{ color: "var(--amber)" }}>MRR. One link.</span>
          <br />
          Share anywhere.
        </h1>

        <p className="text-[var(--text-muted)] text-base max-w-lg mb-2">
          Stripe-verified MRR profiles for indie founders. No VCs, no employees — just provably real revenue.
        </p>

        <p className="text-xs text-[var(--text-dim)] mb-6 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Zap size={12} style={{ color: "#818cf8" }} />
            Share on X
          </span>
          <span className="flex items-center gap-1">
            <Globe size={12} style={{ color: "var(--amber)" }} />
            Product Hunt
          </span>
          <span className="flex items-center gap-1">
            <Link2 size={12} style={{ color: "var(--emerald)" }} />
            Your own site
          </span>
        </p>

        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02]"
        >
          Get Your Stripe-Verified Profile →
        </a>

        {stats.totalFounders > 0 && (
          <p className="mt-4 text-xs text-[var(--text-dim)] flex items-center gap-1.5">
            <Users size={14} style={{ color: "var(--amber)" }} />
            Trusted by{" "}
            <strong className="text-[var(--text-muted)]">{stats.totalFounders} founders</strong>{" "}
            tracking{" "}
            <strong className="text-[var(--text-muted)]">{formatMRR(stats.totalMRR)}/mo</strong>{" "}
            in Stripe-verified revenue
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div
        className="grid grid-cols-3 gap-px mb-8 rounded-lg overflow-hidden border border-[var(--border)] animate-fade-up stagger-2"
        style={{ background: "var(--border)" }}
      >
        {[
          { label: "Founders", value: String(stats.totalFounders) },
          { label: "Combined MRR", value: formatMRR(stats.totalMRR) },
          { label: "Combined ARR", value: formatMRR(totalARR) },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-card)] px-5 py-4 text-center">
            <div className="mono text-lg font-semibold text-[var(--amber)]">
              {stat.value}
            </div>
            <div className="text-xs text-[var(--text-dim)] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {stats.joinedThisWeek > 0 && (
        <div className="text-center mb-6 animate-fade-up stagger-2">
          <span className="text-xs text-[var(--emerald)] mono">
            +{stats.joinedThisWeek} founder{stats.joinedThisWeek !== 1 ? "s" : ""} joined this week
          </span>
        </div>
      )}

      {/* Recently joined ticker */}
      {recentlyJoined.length > 0 && (
        <div className="mb-6 animate-fade-up stagger-2">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
            <span className="text-xs text-[var(--text-dim)] mono shrink-0 uppercase tracking-widest">
              Recently joined
            </span>
            {recentlyJoined.map((f) => (
              <a
                key={f.slug}
                href={`/${f.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)] hover:border-[var(--amber)] hover:text-[var(--text)] transition-colors shrink-0"
              >
                <span className="text-[var(--text)]">{f.name}</span>
                <span className="text-[var(--text-dim)]">·</span>
                <span>{f.productName}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Email capture */}
      <EmailCaptureForm />

      {/* Share profiles */}
      <div className="flex justify-end mb-4 animate-fade-up stagger-2">
        <ShareButton
          text={`${stats.totalFounders} indie founders are making ${formatMRR(stats.totalMRR)}/mo combined on MRR.fyi`}
          url="https://mrr.fyi"
        />
      </div>

      {/* Leaderboard */}
      {founders.length === 0 ? (
        <div className="text-center py-24 animate-fade-up stagger-3">
          <p
            className="text-4xl mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Be the first.
          </p>
          <p className="text-[var(--text-muted)] mb-6">
            No one has submitted their revenue yet. Don&rsquo;t be shy.
          </p>
          <a
            href="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
          >
            Get Your Verified Profile →
          </a>
        </div>
      ) : (
        <Suspense>
          <LeaderboardList
            founders={founders}
            totalCount={totalFoundersOnLeaderboard}
            pageSize={LEADERBOARD_PAGE_SIZE}
          />
        </Suspense>
      )}

      {/* Recent Activity */}
      {activity.length > 0 && (
        <div className="mt-12 animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <h2
            className="text-lg mb-4 text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Recent activity
          </h2>
          <div className="space-y-2">
            {activity.map((item, i) => (
              <div
                key={`${item.slug}-${item.type}-${i}`}
                className="flex items-center gap-3 text-sm py-2 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border)]"
              >
                <span className="text-[var(--text-dim)] text-xs mono shrink-0">
                  {item.type === "milestone" ? "🏆" : "→"}
                </span>
                <span className="text-[var(--text)]">
                  <a
                    href={`/${item.slug}`}
                    className="text-[var(--amber)] hover:underline"
                  >
                    {item.name}
                  </a>{" "}
                  <span className="text-[var(--text-muted)]">{item.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div
        className="mt-16 animate-fade-up"
        style={{ animationDelay: "0.24s", opacity: 0 }}
      >
        <h2
          className="text-xl mb-6 text-center"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          What founders are saying
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
            >
              <Quote
                size={16}
                className="mb-3"
                style={{ color: "var(--amber)", opacity: 0.6 }}
              />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {t.name}
                </p>
                <p className="text-xs text-[var(--text-dim)]">{t.product}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why founders track here */}
      <div className="mt-16 animate-fade-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
        <h2
          className="text-xl mb-6 text-center"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Why founders track here
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: BadgeCheck,
              title: "Stripe-verified credibility",
              desc: "Connect Stripe to get a Stripe-verified badge — provably real revenue that investors and customers can trust.",
              color: "var(--emerald)",
            },
            {
              icon: Sparkles,
              title: "Get discovered",
              desc: "A Stripe-verified badge signals real traction. Put your product in front of customers and investors who trust transparent founders.",
              color: "var(--amber)",
            },
            {
              icon: TrendingUp,
              title: "Track your journey",
              desc: "MRR charts, milestone badges, and growth tracking. See how far you've come — and share the proof.",
              color: "var(--amber)",
            },
          ].map((benefit) => (
            <div
              key={benefit.title}
              className="p-5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
            >
              <benefit.icon
                size={20}
                className="mb-3"
                style={{ color: benefit.color }}
              />
              <h3 className="text-sm font-semibold mb-1.5 text-[var(--text)]">
                {benefit.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison section */}
      <div className="mt-16 animate-fade-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
        <h2
          className="text-xl mb-2 text-center"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Your profile. Your proof.
        </h2>
        <p className="text-center text-sm text-[var(--text-dim)] mb-8">
          Unlike revenue feeds, mrr.fyi is your permanent founder profile
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] opacity-60">
            <p className="text-xs mono uppercase tracking-widest text-[var(--text-dim)] mb-3">Revenue feeds</p>
            <ul className="space-y-2 text-sm text-[var(--text-dim)]">
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✗</span> Ephemeral posts that disappear</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✗</span> No verification — anyone can claim anything</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✗</span> Scattered across platforms</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✗</span> Hard to share as a single link</li>
            </ul>
          </div>
          <div
            className="p-5 rounded-lg border bg-[var(--bg-card)]"
            style={{ borderColor: "var(--amber)", boxShadow: "0 0 0 1px var(--amber-glow)" }}
          >
            <p
              className="text-xs mono uppercase tracking-widest mb-3 flex items-center gap-1.5"
              style={{ color: "var(--amber)" }}
            >
              <Zap size={11} />
              mrr.fyi profile
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-[var(--emerald)]">✓</span> Permanent public founder profile</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-[var(--emerald)]">✓</span> Stripe-verified MRR — provably real</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-[var(--emerald)]">✓</span> One link to share everywhere</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-[var(--emerald)]">✓</span> MRR chart, milestones, growth history</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Blog section */}
      {(() => {
        const posts = getAllPosts().slice(0, 3);
        if (posts.length === 0) return null;
        return (
          <div className="mt-16 animate-fade-up" style={{ animationDelay: "0.26s", opacity: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl" style={{ fontFamily: "var(--font-dm-serif)" }}>
                From the blog
              </h2>
              <a
                href="/blog"
                className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
              >
                All posts →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {posts.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--amber)] transition-colors flex flex-col gap-2"
                >
                  <p className="text-xs text-[var(--text-dim)] mono">
                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <h3 className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--amber)] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed line-clamp-2 flex-1">
                    {post.description}
                  </p>
                  <span className="text-xs text-[var(--text-dim)] group-hover:text-[var(--amber)] transition-colors">
                    Read →
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Trust line */}
      <div
        className="mt-16 text-center animate-fade-up"
        style={{ animationDelay: "0.28s", opacity: 0 }}
      >
        <p className="text-xs tracking-widest uppercase text-[var(--text-dim)]">
          Built by indie hackers, for indie hackers
        </p>
      </div>

      {/* CTA */}
      <div
        className="mt-6 p-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-center animate-fade-up"
        style={{ animationDelay: "0.3s", opacity: 0 }}
      >
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          {stats.totalFounders} founders are already here.
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-5">
          Building something people pay for? Connect Stripe and get your verified profile. Takes 60 seconds.
        </p>
        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02]"
        >
          Get Your Stripe-Verified Profile →
        </a>
        <p className="text-xs text-[var(--text-dim)] mt-4">
          Already listed?{" "}
          <a href="/resend" className="text-[var(--amber)] hover:underline">
            Get your update link.
          </a>
        </p>
      </div>
    </div>
  );
}
