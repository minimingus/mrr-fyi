export function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero skeleton */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-12 rounded-sm bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-4 w-40 rounded bg-[var(--bg-hover)] animate-pulse" />
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-12 w-3/4 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-12 w-1/2 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-12 w-2/3 rounded bg-[var(--bg-hover)] animate-pulse" />
        </div>
        <div className="h-4 w-96 max-w-full rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>

      {/* Stats bar skeleton */}
      <div
        className="grid grid-cols-3 gap-px mb-8 rounded-lg overflow-hidden border border-[var(--border)]"
        style={{ background: "var(--border)" }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[var(--bg-card)] px-5 py-4 text-center">
            <div className="h-6 w-16 mx-auto rounded bg-[var(--bg-hover)] animate-pulse mb-1.5" />
            <div className="h-3 w-20 mx-auto rounded bg-[var(--bg-hover)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Leaderboard header skeleton */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="h-3 w-28 rounded bg-[var(--bg-hover)] animate-pulse" />
        <div className="h-3 w-8 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>

      {/* Leaderboard row skeletons */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] animate-pulse"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            {/* Rank */}
            <div className="w-8 h-5 rounded bg-[var(--bg-hover)] shrink-0" />

            {/* Product info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-4 w-40 rounded bg-[var(--bg-hover)]" />
              <div className="h-3 w-24 rounded bg-[var(--bg-hover)]" />
            </div>

            {/* MRR + growth */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-5 w-14 rounded bg-[var(--bg-hover)]" />
              <div className="h-6 w-20 rounded bg-[var(--bg-hover)]" />
            </div>

            {/* Arrow */}
            <div className="h-4 w-4 rounded bg-[var(--bg-hover)] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
