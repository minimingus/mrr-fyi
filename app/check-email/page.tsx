"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="mb-6 text-5xl">📧</div>
      <h1
        className="text-3xl mb-3"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        Check your email
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto leading-relaxed">
        {product ? (
          <>
            We sent a verification link for{" "}
            <strong className="text-[var(--text)]">{product}</strong>. Click it
            to go live on the leaderboard.
          </>
        ) : (
          <>
            We sent a verification link to your email. Click it to go live on
            the leaderboard.
          </>
        )}
      </p>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-xs text-[var(--text-dim)] leading-relaxed">
        Didn&apos;t get it? Check your spam folder or{" "}
        <a href="/resend" className="text-[var(--amber)] hover:underline">
          request a new link
        </a>
        .
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
