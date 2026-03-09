"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UpdatePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [mrr, setMrr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
        Enter your current monthly recurring revenue. A new snapshot will be recorded and your position on the leaderboard will update immediately.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium tracking-wide">
            New MRR (in full dollars)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={mrr}
            onChange={(e) => setMrr(e.target.value)}
            placeholder="e.g. 4200"
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors mono"
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
    </div>
  );
}
