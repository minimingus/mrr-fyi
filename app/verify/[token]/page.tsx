"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(json.error ?? "Verification failed");
          return;
        }
        setStatus("success");
        setTimeout(() => {
          router.push(`/${json.slug}?submitted=1`);
        }, 2000);
      } catch {
        setStatus("error");
        setError("Network error. Please try again.");
      }
    }
    verify();
  }, [token, router]);

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      {status === "loading" && (
        <>
          <div className="mb-6 text-5xl animate-pulse">⏳</div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Verifying...
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Hang tight, we&apos;re confirming your email.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mb-6 text-5xl">✅</div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Email verified
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            You&apos;re live on the leaderboard. Redirecting to your profile...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mb-6 text-5xl">❌</div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Verification failed
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {error}
          </p>
          <a
            href="/resend"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
          >
            Request a new link →
          </a>
        </>
      )}
    </div>
  );
}
