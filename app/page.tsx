import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LeaderboardList } from "@/components/LeaderboardList";
import { formatMRR } from "@/lib/utils";
import { Users, Zap, Link2, Globe } from "lucide-react";
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
        isPro: true,
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

export default async function Home() {
  const [leaderboard, stats] = await Promise.all([
    getLeaderboard(),
    getStats(),
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
            Self-reported · updated in real-time
          </span>
        </div>

        <h1
          className="text-5xl sm:text-6xl leading-tight mb-4"
          style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
        >
          Your MRR.
          <br />
          <span style={{ color: "var(--amber)" }}>One link.</span>
          <br />
          Share anywhere.
        </h1>

        <p className="text-[var(--text-muted)] text-base max-w-lg mb-2">
          Public MRR profiles for indie founders. No VCs, no employees — just real revenue, tracked in public.
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
          Get Your Pro Profile →
        </a>

        {stats.totalFounders > 0 && (
          <p className="mt-4 text-xs text-[var(--text-dim)] flex items-center gap-1.5">
            <Users size={14} style={{ color: "var(--amber)" }} />
            Trusted by{" "}
            <strong className="text-[var(--text-muted)]">{stats.totalFounders} founders</strong>{" "}
            tracking{" "}
            <strong className="text-[var(--text-muted)]">{formatMRR(stats.totalMRR)}/mo</strong>{" "}
            in combined revenue
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
            Get Your Pro Profile →
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

      {/* Email capture — above CTA */}
      <div className="mt-8">
        <EmailCaptureForm />
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
          Building something people pay for? Submit your MRR and track your progress in public. Takes 60 seconds.
        </p>
        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02]"
        >
          Get Your Pro Profile →
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
