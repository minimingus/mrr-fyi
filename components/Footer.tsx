export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-24 py-10">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
        <span className="mono">MRR.fyi</span>
        <div className="flex gap-6">
          <a href="/submit" className="hover:text-[var(--text-muted)] transition-colors">
            Submit Revenue
          </a>
          <a href="/pricing" className="hover:text-[var(--text-muted)] transition-colors">
            Pricing
          </a>
          <a
            href="https://github.com/minimingus/mrr-fyi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-muted)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://x.com/mrr_fyi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-muted)] transition-colors"
          >
            Twitter
          </a>
        </div>
        <span>self-reported · build in public</span>
      </div>
    </footer>
  );
}
