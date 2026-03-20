"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { trackEvent } from "@/lib/plausible";

function buildTwitterIntentUrl(text: string, url: string) {
  const params = new URLSearchParams({ text: `${text}\n${url}` });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

interface ProfileData {
  name: string;
  productName: string;
  productUrl: string;
  description: string;
  category: string;
  twitter: string;
  referralCode: string | null;
  referralCount: number;
}

export default function UpdatePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [mrr, setMrr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mrrSuccess, setMrrSuccess] = useState<{ slug: string; mrr: number } | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    productName: "",
    productUrl: "",
    description: "",
    category: "",
    twitter: "",
    referralCode: null,
    referralCount: 0,
  });
  const [copied, setCopied] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [founderSlug, setFounderSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(
          `/api/update-profile?token=${encodeURIComponent(params.token)}`
        );
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name ?? "",
            productName: data.productName ?? "",
            productUrl: data.productUrl ?? "",
            description: data.description ?? "",
            category: data.category ?? "",
            twitter: data.twitter ?? "",
            referralCode: data.referralCode ?? null,
            referralCount: data.referralCount ?? 0,
          });
          if (data.trialExpired) setTrialExpired(true);
          if (data.slug) setFounderSlug(data.slug);
        }
      } catch {
        // Non-critical — form will just start empty
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [params.token]);

  async function handleMrrSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(mrr);
    if (isNaN(value) || value < 0) {
      setError("Enter a valid MRR amount");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, mrr: value }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      setMrrSuccess({ slug: json.slug, mrr: value });
      setTimeout(() => {
        router.push(`/${json.slug}?updated=1`);
      }, 8000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          name: profile.name,
          productName: profile.productName,
          productUrl: profile.productUrl,
          description: profile.description || undefined,
          category: profile.category || undefined,
          twitter: profile.twitter || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProfileError(json.error ?? "Something went wrong");
        return;
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setProfileSubmitting(false);
    }
  }

  function updateProfile(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass =
    "w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors mono";
  const labelClass =
    "block text-xs text-[var(--text-muted)] mb-1.5 font-medium tracking-wide";

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-10 transition-colors"
      >
        ← Leaderboard
      </a>

      {trialExpired && (
        <div className="mb-8 px-5 py-4 rounded-xl border border-[var(--amber)] bg-[var(--amber-glow)]">
          <p className="text-sm font-semibold text-[var(--text)] mb-1">
            Your free trial has ended
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Upgrade now to keep your verified badge and stay visible on the leaderboard.
          </p>
          <a
            href={founderSlug ? `/pricing?slug=${founderSlug}` : "/pricing"}
            onClick={() => trackEvent("Trial Expired Upgrade Click")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
          >
            Upgrade now →
          </a>
        </div>
      )}

      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        Update your MRR.
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Enter your current monthly recurring revenue. A new snapshot will be
        recorded and your position on the leaderboard will update immediately.
      </p>

      {mrrSuccess ? (
        <div className="text-center">
          <div className="rounded-xl border border-[var(--emerald)] p-6 mb-6" style={{ background: "rgba(16,185,129,0.08)" }}>
            <div className="mb-4 text-4xl">&#10003;</div>
            <h2
              className="text-xl mb-2"
              style={{ fontFamily: "var(--font-dm-serif)", color: "var(--emerald)" }}
            >
              MRR updated!
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              New snapshot recorded. Let the world know you&apos;re building in public.
            </p>

            <a
              href={buildTwitterIntentUrl(
                `Just updated my MRR on the @mrrfyi leaderboard — building in public. Check it out: #buildinpublic`,
                `https://mrr.fyi/${mrrSuccess.slug}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("Share Click", { platform: "twitter", source: "update" })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
          </div>

          <p className="text-xs text-[var(--text-dim)]">
            Redirecting to your profile...{" "}
            <a
              href={`/${mrrSuccess.slug}?updated=1`}
              className="text-[var(--amber)] hover:underline"
            >
              Go now &rarr;
            </a>
          </p>
        </div>
      ) : (
        <form onSubmit={handleMrrSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>New MRR (in full dollars)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={mrr}
              onChange={(e) => setMrr(e.target.value)}
              placeholder="e.g. 4200"
              className={inputClass}
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-[var(--red)] bg-red-950/20 px-4 py-3 text-sm text-[var(--red)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isSubmitting ? "Saving..." : "Update MRR →"}
          </button>

          <p className="text-xs text-center text-[var(--text-dim)]">
            This link is private and never expires. Bookmark it.
          </p>
          <p className="text-xs text-center text-[var(--text-dim)]">
            Lost your link?{" "}
            <a href="/resend" className="text-[var(--amber)] hover:underline">
              Re-send it to your email.
            </a>
          </p>
        </form>
      )}

      {/* Profile Edit Section */}
      <div className="mt-16 pt-10 border-t border-[var(--border)]">
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Edit your profile.
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Fix a typo, update your product URL, or refresh your description.
        </p>

        {profileLoading ? (
          <p className="text-sm text-[var(--text-dim)]">Loading profile...</p>
        ) : (
          <form
            onSubmit={handleProfileSubmit}
            className="flex flex-col gap-4"
          >
            <div>
              <label className={labelClass}>Your name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile("name", e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Product name</label>
              <input
                type="text"
                value={profile.productName}
                onChange={(e) => updateProfile("productName", e.target.value)}
                placeholder="Acme SaaS"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Product URL</label>
              <input
                type="url"
                value={profile.productUrl}
                onChange={(e) => updateProfile("productUrl", e.target.value)}
                placeholder="https://acme.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                Description{" "}
                <span className="text-[var(--text-dim)] font-normal">
                  (optional, max 280 chars)
                </span>
              </label>
              <textarea
                value={profile.description}
                onChange={(e) => updateProfile("description", e.target.value)}
                placeholder="What does your product do?"
                maxLength={280}
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>

            <div>
              <label className={labelClass}>
                Category{" "}
                <span className="text-[var(--text-dim)] font-normal">
                  (optional)
                </span>
              </label>
              <select
                value={profile.category}
                onChange={(e) => updateProfile("category", e.target.value)}
                className={inputClass}
              >
                <option value="">Select a category</option>
                <option value="SAAS">SaaS</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="AGENCY">Agency</option>
                <option value="CREATOR">Creator</option>
                <option value="MARKETPLACE">Marketplace</option>
                <option value="DEV_TOOLS">Developer Tools</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Twitter/X handle{" "}
                <span className="text-[var(--text-dim)] font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={profile.twitter}
                onChange={(e) => updateProfile("twitter", e.target.value)}
                placeholder="janedoe"
                className={inputClass}
              />
            </div>

            {profileError && (
              <div className="rounded-md border border-[var(--red)] bg-red-950/20 px-4 py-3 text-sm text-[var(--red)]">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="rounded-md border border-green-700 bg-green-950/20 px-4 py-3 text-sm text-green-400">
                Profile updated successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={profileSubmitting}
              className="w-full py-3 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] font-semibold rounded-md hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {profileSubmitting ? "Saving..." : "Save profile →"}
            </button>
          </form>
        )}
      </div>
      {/* Referral Section */}
      {profile.referralCode && (
        <div className="mt-16 pt-10 border-t border-[var(--border)]">
          <h2
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Invite founders.
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Share your referral link. When someone joins through it, you get
            credit on your profile.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/ref/${profile.referralCode}`}
              className={inputClass + " flex-1 text-xs"}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/ref/${profile.referralCode}`
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          {profile.referralCount > 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-4">
              You&apos;ve referred{" "}
              <strong className="text-[var(--text)]">
                {profile.referralCount}
              </strong>{" "}
              founder{profile.referralCount !== 1 ? "s" : ""} so far.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
