"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/plausible";
import { BadgeCheck, ShieldCheck, Zap, ChevronDown, ChevronUp } from "lucide-react";

const plans = [
  {
    key: "VERIFIED",
    name: "Verified Badge",
    price: 9,
    period: "/month",
    tagline: "Prove your revenue is real",
    features: [
      "Verified badge on your profile",
      "MRR history chart (show off your growth)",
      "Stand out with a verified profile",
      "Builds trust with visitors and investors",
      "7-day free trial — no charge today",
      "Cancel anytime, instantly",
    ],
    cta: "Start 7-day free trial",
    highlight: true,
  },
];

const FAQ = [
  {
    q: "What does the 7-day free trial mean?",
    a: "You get full Verified access for 7 days. No charge until the trial ends. Cancel before day 7 and you pay nothing — ever.",
  },
  {
    q: "What happens when I cancel?",
    a: "Your profile reverts to free (no Verified badge, no history chart). All your data stays safe. You can re-subscribe anytime.",
  },
  {
    q: "How does Stripe verify my MRR?",
    a: "It doesn't — yet. Right now MRR is self-reported, and the Verified badge signals you've committed your public number to the community. Stripe-based auto-sync is on our roadmap.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. If you're unsatisfied within 30 days of your first charge, email us and we'll refund it. No questions asked.",
  },
  {
    q: "Can I use Lemon Squeezy instead of Stripe?",
    a: "We're transitioning to Stripe as our primary payment provider. Stripe is the default checkout for new subscribers.",
  },
  {
    q: "What's a 'free' profile?",
    a: "Listing on the leaderboard, a public profile page, and MRR milestone emails — all free, forever. The Verified badge and MRR history chart are paid extras.",
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

function PricingContent() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState(searchParams.get("slug") ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    if (!slug.trim()) {
      setError("Enter your profile slug to continue (e.g. screenshotify)");
      return;
    }
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), plan }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      trackEvent("Checkout Click", { plan });
      window.location.href = json.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
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

      <div className="text-center mb-12">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Prove your revenue is real.
        </h1>
        <p className="text-[var(--text-muted)]">
          Get a Verified badge — free for 7 days, then $9/mo. Cancel anytime.
        </p>
      </div>

      {/* Free vs Verified comparison */}
      <div className="mb-10 rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-3 bg-[var(--bg-card)]">
          <div className="py-3 px-4 text-xs text-[var(--text-dim)] font-medium uppercase tracking-widest mono" />
          <div className="py-3 px-4 text-center">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mono">Free</span>
          </div>
          <div className="py-3 px-4 text-center border-l border-[var(--amber)] bg-[var(--amber-glow)]">
            <span className="text-xs font-semibold text-[var(--amber)] uppercase tracking-widest mono">Verified</span>
          </div>
        </div>
        {[
          { feature: "Public profile page", free: true, paid: true },
          { feature: "Leaderboard listing", free: true, paid: true },
          { feature: "Milestone emails", free: true, paid: true },
          { feature: "Verified badge", free: false, paid: true },
          { feature: "MRR history chart", free: false, paid: true },
          { feature: "Referral invite section", free: false, paid: true },
          { feature: "Priority listing position", free: false, paid: true },
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

      {/* Slug input */}
      <div className="mb-8 max-w-sm mx-auto">
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

      {/* Plans */}
      <div className="max-w-sm mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="rounded-xl border p-6 flex flex-col border-[var(--amber)] bg-[var(--amber-glow)]"
          >
            <span className="self-start text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm bg-[var(--amber)] text-black mb-3">
              VERIFIED
            </span>

            <h2
              className="text-xl mb-1"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              {plan.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">{plan.tagline}</p>

            <div className="flex items-baseline gap-1 mb-5">
              <span className="mono text-3xl font-bold text-[var(--text)]">
                ${plan.price}
              </span>
              <span className="text-sm text-[var(--text-dim)]">{plan.period}</span>
            </div>

            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                  <span className="text-[var(--amber)] shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(plan.key)}
              disabled={loading === plan.key}
              className="w-full py-2.5 text-sm font-semibold rounded-md transition-all bg-[var(--amber)] text-black hover:bg-amber-400 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading === plan.key ? "Redirecting..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Trust signals */}
      <div className="mt-8 max-w-sm mx-auto grid grid-cols-3 gap-3 text-center">
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

      <p className="text-xs text-center text-[var(--text-dim)] mt-6">
        Payments processed securely by Stripe.
      </p>

      {/* FAQ */}
      <div className="mt-14">
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
      <div className="mt-12 text-center">
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

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
