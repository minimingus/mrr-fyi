"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface PlanData {
  slug: string;
  verified: boolean;
  featured: boolean;
  planType: "FEATURED" | "VERIFIED" | null;
  trialExpired: boolean;
  trialEndsAt: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/update-profile?token=${encodeURIComponent(params.token)}`
        );
        if (!res.ok) {
          setError("Invalid or expired link.");
          return;
        }
        const json = await res.json();
        setData({
          slug: json.slug,
          verified: json.verified,
          featured: json.featured,
          planType: json.planType ?? null,
          trialExpired: json.trialExpired ?? false,
          trialEndsAt: json.trialEndsAt ?? null,
        });
      } catch {
        setError("Failed to load billing info.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.token]);

  async function handleManageSubscription() {
    if (!data) return;
    setPortalLoading(true);
    try {
      const returnUrl = `${window.location.origin}/billing/${params.token}`;
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, returnUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not open billing portal.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const labelClass = "block text-xs text-[var(--text-muted)] mb-1 font-medium tracking-wide";

  const planLabel =
    data?.planType === "FEATURED"
      ? "Featured"
      : data?.planType === "VERIFIED"
      ? "Pro"
      : null;

  const isInTrial =
    data?.trialEndsAt &&
    !data.trialExpired &&
    new Date(data.trialEndsAt) > new Date();

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <a
        href={`/update/${params.token}`}
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-10 transition-colors"
      >
        ← Dashboard
      </a>

      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        Billing & plan.
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Manage your subscription and payment details.
      </p>

      {loading && (
        <p className="text-sm text-[var(--text-dim)]">Loading...</p>
      )}

      {error && (
        <div className="rounded-md border border-[var(--red)] bg-red-950/20 px-4 py-3 text-sm text-[var(--red)] mb-6">
          {error}
        </div>
      )}

      {!loading && data && (
        <div className="flex flex-col gap-6">
          {/* Current plan card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className={labelClass}>Current plan</p>
            {planLabel ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-lg font-semibold"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {planLabel} Badge
                  </span>
                  <span
                    className="text-[10px] font-semibold mono px-1.5 py-0.5 rounded-sm"
                    style={
                      data.planType === "FEATURED"
                        ? { background: "var(--amber)", color: "black" }
                        : { background: "rgba(251,191,36,0.15)", color: "var(--amber)" }
                    }
                  >
                    {data.planType === "FEATURED" ? "★ FEATURED" : "✦ PRO"}
                  </span>
                </div>

                {isInTrial && data.trialEndsAt && (
                  <p className="text-sm text-[var(--text-muted)] mb-1">
                    Free trial active — ends{" "}
                    <strong className="text-[var(--text)]">
                      {formatDate(data.trialEndsAt)}
                    </strong>
                  </p>
                )}

                {data.trialExpired && (
                  <p className="text-sm text-[var(--amber)] mb-1">
                    Trial ended. Subscription is now billed.
                  </p>
                )}

                {!isInTrial && !data.trialExpired && (
                  <p className="text-sm text-[var(--text-muted)] mb-1">
                    Active subscription
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No active plan
              </p>
            )}
          </div>

          {/* Actions */}
          {planLabel ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full py-3 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] font-semibold rounded-md hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-sm"
            >
              {portalLoading ? "Opening portal..." : "Manage subscription →"}
            </button>
          ) : (
            <a
              href={`/pricing?slug=${data.slug}`}
              className="w-full py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.01] text-sm text-center block"
            >
              Upgrade — try free for 7 days →
            </a>
          )}

          <p className="text-xs text-center text-[var(--text-dim)]">
            Payments processed securely by Stripe.
          </p>
        </div>
      )}
    </div>
  );
}
