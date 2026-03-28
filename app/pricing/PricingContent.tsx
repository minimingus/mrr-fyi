"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/plausible";
import { BadgeCheck, ShieldCheck, Zap, ChevronDown, ChevronUp } from "lucide-react";

const FAQ = [
  {
    q: "What does Pro include?",
    a: "Pro gives you an analytics dashboard (profile views, link clicks, referrer sources), full MRR history chart, enhanced profile fields (bio, logo, tags, LinkedIn), and a Pro badge on the leaderboard and your profile.",
  },
  {
    q: "What's the analytics dashboard?",
    a: "You get a private dashboard showing how many founders viewed your profile, clicked your product link, and where they came from — by day, week, and month. Accessible via your update link.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel with one click from your billing email. Your Pro features stay active until the end of your billing period. No fees, no friction.",
  },
  {
    q: "What happens when I cancel?",
    a: "Your profile reverts to free (no Pro badge, no full history chart, no analytics). All your data stays safe. You can re-subscribe anytime.",
  },
  {
    q: "What's a 'free' profile?",
    a: "A public profile page and MRR milestone emails — all free, forever. Analytics, full history, enhanced profile, and the Pro badge are paid extras.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. If you're unsatisfied within 30 days of your first charge, email us and we'll refund it. No questions asked.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-sm text-[var(--text)] hover:text-[var(--amber)] transition-colors"
      >
        <span>{q}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 ml-3 text-[var(--text-dim)]" />
        ) : (
          <ChevronDown size={16} className="shrink-0 ml-3 text-[var(--text-dim)]" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-xs text-[var(--text-muted)] leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function PricingInner({ verifiedCount }: { verifiedCount: number }) {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState(searchParams.get("slug") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!slug.trim()) {
      setError("Enter your profile slug to continue (e.g. screenshotify)");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), plan: "PRO" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      trackEvent("Checkout Click", { plan: "PRO" });
      window.location.href = json.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to profiles
      </a>

      {/* Hero */}
      <div className="text-center mb-10">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Go Pro. Stand out.
        </h1>
        <p className="text-[var(--text-muted)] mb-4">
          Analytics, full MRR history, enhanced profile. Track what matters and show it off.
        </p>

        {/* Social proof counter */}
        {verifiedCount > 0 && (
          <p className="text-sm text-[var(--text-dim)]">
            <span className="text-[var(--amber)] font-semibold mono">{verifiedCount}</span>{" "}
            {verifiedCount === 1 ? "founder is" : "founders are"} already Pro.
          </p>
        )}
      </div>

      {/* Above-fold CTA */}
      <div className="max-w-sm mx-auto mb-10">
        <div className="rounded-xl border border-[var(--amber)] bg-[var(--amber-glow)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="self-start text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm bg-[var(--amber)] text-black">
                PRO
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="mono text-3xl font-bold text-[var(--text)]">$9</span>
                <span className="text-sm text-[var(--text-dim)]">/mo</span>
              </div>
            </div>
            <BadgeCheck size={40} style={{ color: "var(--amber)" }} />
          </div>

          <ul className="flex flex-col gap-2 mb-5">
            {[
              "Pro badge on your profile and leaderboard",
              "Analytics dashboard — views, clicks, referrer sources",
              "Full MRR history chart — track your growth trajectory",
              "Enhanced profile — logo, tags, LinkedIn, bio",
              "7-day free trial — no charge today",
              "Cancel anytime, instantly",
            ].map((f) => (
              <li key={f} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                <span className="text-[var(--amber)] shrink-0 mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Your profile slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="screenshotify"
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors mono"
            />
            <p className="text-xs text-[var(--text-dim)] mt-1">
              Found in your profile URL: mrr.fyi/<strong>your-slug</strong>
            </p>
            {error && <p className="text-xs text-[var(--red)] mt-2">{error}</p>}
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 text-sm font-semibold rounded-md transition-all bg-[var(--amber)] text-black hover:bg-amber-400 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? "Redirecting..." : "Start your free 7-day trial →"}
          </button>
        </div>
      </div>

      {/* Trust signals */}
      <div className="max-w-sm mx-auto grid grid-cols-3 gap-3 text-center mb-12">
        {[
          { icon: ShieldCheck, label: "30-day refund", sub: "no questions asked" },
          { icon: Zap, label: "7-day free trial", sub: "no card charge today" },
          { icon: BadgeCheck, label: "Cancel anytime", sub: "one click, instant" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <item.icon size={18} style={{ color: "var(--amber)" }} />
            <span className="text-xs font-medium text-[var(--text-muted)]">{item.label}</span>
            <span className="text-[10px] text-[var(--text-dim)]">{item.sub}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-[var(--text-dim)] mb-12">
        Payments processed securely by Stripe.
      </p>

      {/* Free vs Pro comparison */}
      <div className="mb-12 rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-3 bg-[var(--bg-card)]">
          <div className="py-3 px-4 text-xs text-[var(--text-dim)] font-medium uppercase tracking-widest mono" />
          <div className="py-3 px-4 text-center">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mono">Free</span>
          </div>
          <div className="py-3 px-4 text-center border-l border-[var(--amber)] bg-[var(--amber-glow)]">
            <span className="text-xs font-semibold text-[var(--amber)] uppercase tracking-widest mono">Pro</span>
          </div>
        </div>
        {[
          { feature: "Public profile page", free: true, paid: true },
          { feature: "Public profile listing", free: true, paid: true },
          { feature: "Milestone emails", free: true, paid: true },
          { feature: "Pro badge on profile + leaderboard", free: false, paid: true },
          { feature: "Analytics dashboard", free: false, paid: true },
          { feature: "Full MRR history chart", free: false, paid: true },
          { feature: "Enhanced profile (logo, tags, LinkedIn)", free: false, paid: true },
        ].map((row, i) => (
          <div
            key={row.feature}
            className={`grid grid-cols-3 border-t border-[var(--border)] ${i % 2 === 0 ? "" : "bg-[var(--bg-card)]"}`}
          >
            <div className="py-3 px-4 text-xs text-[var(--text-muted)]">{row.feature}</div>
            <div className="py-3 px-4 text-center text-xs">
              {row.free ? (
                <span className="text-[var(--emerald)]">✓</span>
              ) : (
                <span className="text-[var(--text-dim)]">—</span>
              )}
            </div>
            <div className="py-3 px-4 text-center text-xs border-l border-[var(--amber)] bg-[var(--amber-glow)]">
              {row.paid ? (
                <span className="text-[var(--amber)]">✓</span>
              ) : (
                <span className="text-[var(--text-dim)]">—</span>
              )}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 border-t border-[var(--border)]">
          <div className="py-3 px-4 text-xs text-[var(--text-muted)] font-semibold">Price</div>
          <div className="py-3 px-4 text-center text-xs font-semibold text-[var(--text-muted)] mono">Free</div>
          <div className="py-3 px-4 text-center border-l border-[var(--amber)] bg-[var(--amber-glow)]">
            <span className="mono text-sm font-bold text-[var(--amber)]">$9</span>
            <span className="text-xs text-[var(--text-dim)]">/mo</span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2
          className="text-xl mb-6 text-center"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Common questions
        </h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Still not sure? Start for free — no credit card required.
        </p>
        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] text-sm text-[var(--text-muted)] rounded-md hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors"
        >
          Create a free profile first →
        </a>
      </div>
    </div>
  );
}

export function PricingContent({ verifiedCount }: { verifiedCount: number }) {
  return (
    <Suspense>
      <PricingInner verifiedCount={verifiedCount} />
    </Suspense>
  );
}
