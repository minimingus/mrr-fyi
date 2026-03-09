"use client";

import { useState } from "react";

export default function ResendPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors";

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
        Get your update link.
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Enter the email you used when submitting. We'll re-send your private
        link(s) to update MRR.
      </p>

      {done ? (
        <div
          className="rounded-lg border border-[var(--emerald)] px-4 py-4 text-sm"
          style={{ background: "rgba(16,185,129,0.08)", color: "var(--emerald)" }}
        >
          If that email is in our system, you'll receive your update link(s)
          shortly. Check your inbox (and spam folder).
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium tracking-wide">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClass}
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
            {isSubmitting ? "Sending..." : "Send my link →"}
          </button>
        </form>
      )}
    </div>
  );
}
