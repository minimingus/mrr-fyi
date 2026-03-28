import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation — MRR.fyi",
  description:
    "Public API for accessing MRR.fyi verified founder profiles. Get founder data, rankings, and milestones.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/leaderboard",
    description: "Returns the top 50 founders sorted by featured status and MRR.",
    rateLimit: "60 requests/min per IP",
    params: null,
    exampleResponse: `{
  "data": [
    {
      "rank": 1,
      "slug": "screenshotify",
      "name": "Jane Doe",
      "twitter": "janedoe",
      "productName": "Screenshotify",
      "productUrl": "https://screenshotify.io",
      "description": "Screenshot API for developers",
      "mrr": 250000,
      "currency": "USD",
      "growthPercent": 12,
      "verified": true,
      "featured": false,
      "updatedAt": "2026-03-19T12:00:00.000Z"
    }
  ],
  "meta": {
    "count": 50,
    "generatedAt": "2026-03-19T12:00:00.000Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/founders/:slug",
    description:
      "Returns public data for a single founder including MRR snapshots and milestones.",
    rateLimit: "60 requests/min per IP",
    params: [{ name: "slug", location: "path", description: "The founder's URL slug" }],
    exampleResponse: `{
  "data": {
    "slug": "screenshotify",
    "name": "Jane Doe",
    "twitter": "janedoe",
    "productName": "Screenshotify",
    "productUrl": "https://screenshotify.io",
    "description": "Screenshot API for developers",
    "mrr": 250000,
    "currency": "USD",
    "rank": 1,
    "verified": true,
    "featured": false,
    "milestones": [
      { "amount": 100, "reachedAt": "2025-06-01T00:00:00.000Z" },
      { "amount": 500, "reachedAt": "2025-09-15T00:00:00.000Z" },
      { "amount": 1000, "reachedAt": "2025-12-01T00:00:00.000Z" }
    ],
    "snapshots": [
      { "mrr": 250000, "recordedAt": "2026-03-19T12:00:00.000Z" },
      { "mrr": 223000, "recordedAt": "2026-02-15T12:00:00.000Z" }
    ],
    "createdAt": "2025-05-01T00:00:00.000Z",
    "updatedAt": "2026-03-19T12:00:00.000Z"
  }
}`,
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto text-xs leading-relaxed text-[var(--text-muted)] mono">
      {children}
    </pre>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        &larr; Back to profiles
      </a>

      <div className="mb-12">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Public API
        </h1>
        <p className="text-[var(--text-muted)] max-w-lg">
          Free, read-only access to MRR.fyi verified founder profiles. No API key required.
          All monetary values are in <strong className="text-[var(--text)]">cents</strong>.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-10 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        <p className="text-xs text-[var(--text-dim)] mb-1 font-medium">Base URL</p>
        <code className="mono text-sm text-[var(--amber)]">https://mrr.fyi</code>
      </div>

      {/* Rate Limiting */}
      <div className="mb-10">
        <h2
          className="text-xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Rate Limiting
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          All endpoints are rate limited to <strong className="text-[var(--text)]">60 requests per minute</strong> per
          IP address. When exceeded, you&apos;ll receive a <code className="mono text-xs px-1 py-0.5 bg-[var(--bg)] rounded border border-[var(--border)]">429</code> response
          with a <code className="mono text-xs px-1 py-0.5 bg-[var(--bg)] rounded border border-[var(--border)]">Retry-After</code> header.
        </p>
      </div>

      {/* Endpoints */}
      <div className="space-y-12">
        {endpoints.map((ep) => (
          <div key={ep.path}>
            <div className="flex items-center gap-3 mb-3">
              <span className="mono text-[10px] font-bold px-2 py-1 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {ep.method}
              </span>
              <code className="mono text-sm text-[var(--text)]">{ep.path}</code>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-3">{ep.description}</p>

            <p className="text-xs text-[var(--text-dim)] mb-4">
              Rate limit: {ep.rateLimit}
            </p>

            {ep.params && (
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--text-dim)] mb-2">Parameters</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs text-[var(--text-dim)] pb-2 font-medium">Name</th>
                      <th className="text-left text-xs text-[var(--text-dim)] pb-2 font-medium">Location</th>
                      <th className="text-left text-xs text-[var(--text-dim)] pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p) => (
                      <tr key={p.name} className="border-b border-[var(--border)]">
                        <td className="py-2 mono text-xs text-[var(--amber)]">{p.name}</td>
                        <td className="py-2 text-xs text-[var(--text-muted)]">{p.location}</td>
                        <td className="py-2 text-xs text-[var(--text-muted)]">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-[var(--text-dim)] mb-2">Example response</p>
              <CodeBlock>{ep.exampleResponse}</CodeBlock>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="mt-12 p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <h3
          className="text-lg mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Notes
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li>All monetary values (<code className="mono text-xs px-1 py-0.5 bg-[var(--bg)] rounded border border-[var(--border)]">mrr</code>) are in cents. Divide by 100 to get dollars.</li>
          <li>Milestone amounts are in dollars (e.g. <code className="mono text-xs px-1 py-0.5 bg-[var(--bg)] rounded border border-[var(--border)]">1000</code> = $1,000 MRR).</li>
          <li>Responses include <code className="mono text-xs px-1 py-0.5 bg-[var(--bg)] rounded border border-[var(--border)]">Cache-Control</code> headers. Please respect them.</li>
          <li>This API is free for personal and non-commercial use.</li>
        </ul>
      </div>
    </div>
  );
}
