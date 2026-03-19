# High-ROI Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship four high-leverage features — dynamic OG images, Twitter share button, sitemap.xml, and pre-filled slug on the pricing page.

**Architecture:** All four are self-contained additions to the Next.js App Router. No new dependencies needed — `next/og` for OG images, `app/sitemap.ts` for the sitemap, `searchParams` for slug pre-fill, and a plain anchor tag for the share button.

**Tech Stack:** Next.js App Router, `ImageResponse` from `next/og`, Prisma (sitemap query), Tailwind CSS.

---

### Task 1: OG Image per founder profile

**Files:**
- Create: `app/[slug]/opengraph-image.tsx`

**Step 1: Create the file**

```tsx
// app/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatMRR } from "@/lib/utils";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const founder = await prisma.founder.findUnique({
    where: { slug },
    select: { productName: true, name: true, mrr: true, currency: true, verified: true },
  });

  const productName = founder?.productName ?? "Unknown";
  const name = founder?.name ?? "";
  const mrr = founder ? formatMRR(founder.mrr, founder.currency) : "$0";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#f59e0b", fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em" }}>
            MRR.fyi
          </span>
          <span style={{ color: "#52525b", fontSize: "14px" }}>indie revenue leaderboard</span>
        </div>

        {/* Middle: main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#f59e0b", fontSize: "72px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mrr}
            <span style={{ color: "#71717a", fontSize: "32px", fontWeight: 400 }}>/mo</span>
          </div>
          <div style={{ color: "#fafafa", fontSize: "48px", fontWeight: 600 }}>
            {productName}
          </div>
          <div style={{ color: "#71717a", fontSize: "24px" }}>
            by {name}
          </div>
        </div>

        {/* Bottom: url */}
        <div style={{ color: "#52525b", fontSize: "18px" }}>
          mrr.fyi/{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
```

**Step 2: Verify locally**

Visit `http://localhost:3000/[any-slug]/opengraph-image` in the browser.
Expected: a 1200×630 dark card with the founder's MRR in amber, product name, and `mrr.fyi/slug` at the bottom.

**Step 3: Commit**

```bash
git add app/[slug]/opengraph-image.tsx
git commit -m "feat: add dynamic OG image per founder profile"
```

---

### Task 2: Twitter share button on profile page

**Files:**
- Modify: `app/[slug]/page.tsx`

**Goal:** When a founder lands on their profile with `?submitted=true` or `?updated=true`, show a "Share on X →" button alongside the success banner.

**Step 1: Add the share button to the success banner**

In `app/[slug]/page.tsx`, find the `(updated || submitted)` banner block and replace it:

```tsx
{(updated || submitted) && (
  <div
    className="mb-6 px-4 py-3 rounded-lg border border-[var(--emerald)] text-sm flex items-center justify-between gap-4 flex-wrap"
    style={{ background: "rgba(16,185,129,0.08)", color: "var(--emerald)" }}
  >
    <span>
      {submitted
        ? "You're on the leaderboard. Check your email for your private update link."
        : "MRR updated. New snapshot recorded."}
    </span>
    <a
      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `I'm making ${formatMRR(founder.mrr, founder.currency)}/mo with ${founder.productName} 🚀\nmrr.fyi/${founder.slug}`
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
      style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)" }}
    >
      Share on X →
    </a>
  </div>
)}
```

**Step 2: Verify locally**

Visit `http://localhost:3000/[slug]?submitted=true`.
Expected: green banner with the success message AND a "Share on X →" button on the right. Clicking it opens Twitter with the pre-filled tweet.

**Step 3: Commit**

```bash
git add "app/[slug]/page.tsx"
git commit -m "feat: add Twitter share button to post-submission success banner"
```

---

### Task 3: Sitemap

**Files:**
- Create: `app/sitemap.ts`

**Step 1: Create the file**

```ts
// app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const founders = await prisma.founder.findMany({
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://mrr.fyi", lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: "https://mrr.fyi/submit", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mrr.fyi/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const founderRoutes: MetadataRoute.Sitemap = founders.map((f) => ({
    url: `https://mrr.fyi/${f.slug}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...founderRoutes];
}
```

**Step 2: Verify locally**

Visit `http://localhost:3000/sitemap.xml`.
Expected: valid XML with entries for `/`, `/submit`, `/pricing`, and one entry per founder slug.

**Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: add sitemap.xml with static routes and all founder profiles"
```

---

### Task 4: Pre-fill slug on pricing page

Two parts: (a) pricing page reads `?slug` from the URL and pre-fills the input, (b) the profile page CTA links to `/pricing?slug=their-slug`.

**Files:**
- Modify: `app/pricing/page.tsx`
- Modify: `app/[slug]/page.tsx`

**Step 1: Update pricing page to accept searchParams**

`app/pricing/page.tsx` is a Client Component. Change its signature to accept `searchParams` as a prop and use it to seed the slug state:

At the top of `PricingPage`, change:

```tsx
// Before
export default function PricingPage() {
  const [slug, setSlug] = useState("");
```

```tsx
// After
interface Props {
  searchParams: Promise<{ slug?: string }>;
}

export default function PricingPage({ searchParams }: Props) {
```

Since this is a Client Component, `searchParams` as a prop doesn't work directly — convert the page to read from `useSearchParams()` instead:

```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ... keep all existing plans array and logic ...

function PricingContent() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState(searchParams.get("slug") ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ... rest of the component unchanged (handleCheckout, return JSX) ...
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
```

**Step 2: Update profile page CTA link**

In `app/[slug]/page.tsx`, find the "View Pricing →" link at the bottom and update it:

```tsx
// Before
<a href="/pricing" ...>View Pricing →</a>

// After
<a href={`/pricing?slug=${founder.slug}`} ...>View Pricing →</a>
```

**Step 3: Verify locally**

1. Visit any founder profile page, click "View Pricing →"
   Expected: pricing page loads with the slug field pre-filled.
2. Visit `http://localhost:3000/pricing?slug=test` directly
   Expected: slug field shows "test".

**Step 4: Commit**

```bash
git add app/pricing/page.tsx "app/[slug]/page.tsx"
git commit -m "feat: pre-fill slug on pricing page from profile link"
```

---

### Task 5: Push and verify deployment

```bash
git push
```

Watch `vercel ls mrr-fyi` — should show a new `● Building` → `● Ready` deployment within ~45s.

Spot-check on production:
- `https://mrr.fyi/[slug]/opengraph-image` — OG image renders
- `https://mrr.fyi/sitemap.xml` — sitemap shows all slugs
- Profile → "View Pricing →" — lands on pricing with slug pre-filled
- `https://mrr.fyi/[slug]?submitted=true` — share button visible
