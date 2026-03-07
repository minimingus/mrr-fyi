import { prisma } from "@/lib/prisma";
import { FounderRow } from "@/components/FounderRow";
import { formatMRR } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getLeaderboard() {
  const founders = await prisma.founder.findMany({
    orderBy: [{ featured: "desc" }, { mrr: "desc" }],
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 2,
      },
    },
  });
  return founders;
}

async function getStats() {
  const result = await prisma.founder.aggregate({
    _sum: { mrr: true },
    _count: true,
  });
  return {
    totalMRR: result._sum.mrr ?? 0,
    totalFounders: result._count,
  };
}

export default async function Home() {
  const [founders, stats] = await Promise.all([getLeaderboard(), getStats()]);
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
            self-reported · updated in real-time
          </span>
        </div>

        <h1
          className="text-5xl sm:text-6xl leading-tight mb-4"
          style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
        >
          Who&rsquo;s actually
          <br />
          <span style={{ color: "var(--amber)" }}>making money</span>
          <br />
          building in public?
        </h1>

        <p className="text-[var(--text-muted)] text-base max-w-lg">
          Real MRR from real indie founders. No VCs, no employees, no bullshit.
          Submit your revenue and get on the board.
        </p>
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
            Submit Your Revenue →
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-xs text-[var(--text-dim)] uppercase tracking-widest mono">
              Rank · Product
            </span>
            <span className="text-xs text-[var(--text-dim)] uppercase tracking-widest mono">
              MRR
            </span>
          </div>

          {founders.map((founder, i) => (
            <FounderRow
              key={founder.id}
              founder={founder}
              rank={i + 1}
              style={{ animationDelay: `${0.05 * i}s`, opacity: 0 }}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      <div
        className="mt-16 p-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-center animate-fade-up"
        style={{ animationDelay: "0.3s", opacity: 0 }}
      >
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Your revenue belongs here.
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-5">
          Building something people pay for? Show the world. Add your MRR in 60 seconds.
        </p>
        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02]"
        >
          Submit Revenue →
        </a>
      </div>
    </div>
  );
}
