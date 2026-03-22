"use client";

import { useState } from "react";

interface BadgeSectionProps {
  slug: string;
}

type Tab = "markdown" | "html";

export function BadgeSection({ slug }: BadgeSectionProps) {
  const [tab, setTab] = useState<Tab>("markdown");
  const [copied, setCopied] = useState(false);

  const badgeUrl = `https://mrr.fyi/api/badge/${slug}`;
  const profileUrl = `https://mrr.fyi/${slug}`;

  const snippets: Record<Tab, string> = {
    markdown: `[![MRR](${badgeUrl})](${profileUrl})`,
    html: `<a href="${profileUrl}"><img src="${badgeUrl}" alt="MRR badge" /></a>`,
  };

  function handleCopy() {
    navigator.clipboard.writeText(snippets[tab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {/* Badge preview */}
      <div className="mb-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badgeUrl}
          alt="MRR badge preview"
          className="h-7"
          style={{ imageRendering: "auto" }}
        />
        <span className="text-[10px] text-[var(--text-dim)]">Live — updates every hour</span>
      </div>

      {/* Tabs + copy */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {(["markdown", "html"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setCopied(false); }}
              className={`text-[10px] mono uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${
                tab === t
                  ? "bg-[var(--border)] text-[var(--text)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs font-semibold px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-dim)] transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre className="text-xs text-[var(--text-dim)] bg-[var(--bg)] rounded p-3 overflow-x-auto mono whitespace-pre-wrap break-all">
        {snippets[tab]}
      </pre>
    </div>
  );
}
