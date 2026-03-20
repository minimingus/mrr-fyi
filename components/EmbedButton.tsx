"use client";

import { useState } from "react";

interface EmbedButtonProps {
  slug: string;
}

export function EmbedButton({ slug }: EmbedButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<iframe src="https://mrr.fyi/embed/${slug}" width="350" height="200" frameborder="0" style="border:none;border-radius:12px"></iframe>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
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
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
        Embed
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] mono uppercase tracking-widest">
              Embed code
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-dim)] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs text-[var(--text-dim)] bg-[var(--bg)] rounded p-3 overflow-x-auto mono">
            {snippet}
          </pre>
          <p className="text-[10px] text-[var(--text-dim)] mt-2">
            Add <code className="mono">?theme=light</code> for light mode.
          </p>
        </div>
      )}
    </>
  );
}
