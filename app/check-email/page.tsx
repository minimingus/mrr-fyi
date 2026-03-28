"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="mb-6 text-5xl">📧</div>
      <h1
        className="text-3xl mb-3"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        Check your inbox
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto leading-relaxed">
        {product ? (
          <>
            We sent a verification link for{" "}
            <strong className="text-[var(--text)]">{product}</strong>. Click it
            and your profile goes live.
          </>
        ) : (
          <>
            We sent a verification link to your email. Click it and your
            profile goes live.
          </>
        )}
      </p>

      {/* What happens next */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-left mb-5 space-y-4">
        <p className="text-xs mono uppercase tracking-widest text-[var(--text-dim)]">What happens next</p>
        {[
          { step: "1", label: "Click the link in your email", detail: "Usually arrives in under a minute." },
          { step: "2", label: "Your profile goes live", detail: "Your public profile is live, shareable URL ready." },
          { step: "3", label: "Upgrade to Verified (optional)", detail: "Add the Verified badge and MRR history chart — $9/mo, 7-day free trial." },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <span className="mono text-xs font-bold text-[var(--amber)] w-4 shrink-0 mt-0.5">{item.step}</span>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{item.label}</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-xs text-[var(--text-dim)] leading-relaxed mb-6">
        Didn&apos;t get it? Check your spam folder or{" "}
        <a href="/resend" className="text-[var(--amber)] hover:underline">
          request a new link
        </a>
        .
      </div>

      <a
        href="/"
        className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
      >
        ← Browse profiles while you wait
      </a>
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
