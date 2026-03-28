"use client";

import { useState } from "react";
import { ShareButton } from "./ShareButton";

interface ReferralSectionProps {
  referralCode: string;
  productName: string;
}

export function ReferralSection({ referralCode, productName }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `https://mrr.fyi/ref/${referralCode}`;
  const tweetText = `Join me on @mrr_fyi — get your verified MRR profile and build in public 🚀\n${referralUrl}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-up stagger-4">
      <h2 className="text-sm font-medium text-[var(--text-muted)] mono uppercase tracking-widest mb-3">
        Invite founders
      </h2>
      <p className="text-xs text-[var(--text-dim)] mb-4">
        Know another indie hacker building in public? Send them your referral link.
        You&apos;ll be notified when they join.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <code className="flex-1 text-xs mono bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-muted)] truncate">
          {referralUrl}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-2 text-xs font-semibold rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-dim)] transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <ShareButton
        text={`I'm making money building ${productName} in public — track my MRR and share yours too`}
        url={referralUrl}
      />
    </div>
  );
}
