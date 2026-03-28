"use client";

import { useState } from "react";

export function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });

      if (res.ok || res.status === 409) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mb-8 p-4 rounded-lg border border-[var(--emerald)] bg-[rgba(16,185,129,0.08)] text-center animate-fade-up">
        <p className="text-sm text-[var(--emerald)] font-medium">
          You&rsquo;re on the list — we&rsquo;ll notify you when payments launch.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] animate-fade-up stagger-2">
      <p className="text-sm text-[var(--text-muted)] mb-3 text-center">
        mrr.fyi payments launching soon — enter your email to get notified.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={status === "loading"}
          className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors disabled:opacity-50 shrink-0"
        >
          {status === "loading" ? "..." : "Notify me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-400 text-center mt-2">{errorMsg}</p>
      )}
    </div>
  );
}
