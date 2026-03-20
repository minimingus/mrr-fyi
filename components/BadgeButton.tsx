"use client";

import { useState } from "react";

interface BadgeButtonProps {
  slug: string;
}

type Tab = "markdown" | "html";

export function BadgeButton({ slug }: BadgeButtonProps) {
  const [open, setOpen] = useState(false);
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
    <>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-dim)] transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
          <path d="M7 7h.01" />
        </svg>
        Badge
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-muted)] mono uppercase tracking-widest">
              Share badge
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-dim)] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Badge preview */}
          <div className="mb-3 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl}
              alt="MRR badge preview"
              className="h-7"
              style={{ imageRendering: "auto" }}
            />
            <span className="text-[10px] text-[var(--text-dim)]">Preview</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-2">
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

          <pre className="text-xs text-[var(--text-dim)] bg-[var(--bg)] rounded p-3 overflow-x-auto mono whitespace-pre-wrap break-all">
            {snippets[tab]}
          </pre>
        </div>
      )}
    </>
  );
}
