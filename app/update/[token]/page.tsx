"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface ProfileData {
  name: string;
  productName: string;
  productUrl: string;
  description: string;
  twitter: string;
}

export default function UpdatePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [mrr, setMrr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    productName: "",
    productUrl: "",
    description: "",
    twitter: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

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
            twitter: data.twitter ?? "",
          });
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
      router.push(`/${json.slug}?updated=1`);
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
    </div>
  );
}
