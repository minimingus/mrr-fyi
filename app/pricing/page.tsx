"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const plans = [
  {
    key: "VERIFIED",
    name: "Verified Badge",
    price: 9,
    period: "/month",
    tagline: "Prove your revenue is real",
    features: [
      "✓ Verified badge on your profile",
      "✓ Stand out in the leaderboard",
      "✓ Builds trust with visitors",
      "✓ Cancel anytime",
    ],
    cta: "Get Verified",
    highlight: false,
  },
  {
    key: "FEATURED",
    name: "Featured Listing",
    price: 29,
    period: "/month",
    tagline: "Pin yourself to the top",
    features: [
      "★ Pinned above all organic results",
      "★ Golden glow on leaderboard",
      "★ Verified badge included",
      "★ Maximum visibility",
      "★ Cancel anytime",
    ],
    cta: "Get Featured",
    highlight: true,
  },
];

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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), plan }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
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
        ← Back to leaderboard
      </a>

      <div className="text-center mb-12">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Stand out from the crowd.
        </h1>
        <p className="text-[var(--text-muted)]">
          Simple, transparent pricing. Cancel anytime.
        </p>
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
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-xl border p-6 flex flex-col ${
              plan.highlight
                ? "featured-glow border-[var(--amber)] bg-[var(--amber-glow)]"
                : "border-[var(--border)] bg-[var(--bg-card)]"
            }`}
          >
            {plan.highlight && (
              <span className="self-start text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm bg-[var(--amber)] text-black mb-3">
                MOST POPULAR
              </span>
            )}

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
                  <span className="text-[var(--amber)] shrink-0">{f[0]}</span>
                  <span>{f.slice(2)}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(plan.key)}
              disabled={loading === plan.key}
              className={`w-full py-2.5 text-sm font-semibold rounded-md transition-all ${
                plan.highlight
                  ? "bg-[var(--amber)] text-black hover:bg-amber-400 hover:scale-[1.02]"
                  : "border border-[var(--border)] text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)]"
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
            >
              {loading === plan.key ? "Redirecting..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-[var(--text-dim)] mt-8">
        Payments processed securely by Lemon Squeezy. Cancel anytime.
      </p>
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
