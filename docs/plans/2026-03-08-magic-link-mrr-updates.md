# Magic Link MRR Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let founders update their MRR over time via a magic link sent to their email on submission — no accounts, no passwords.

**Architecture:** On submission, generate a random secret token, store it on the Founder row alongside their email, and email them a link to `/update/[token]`. That page lets them submit a new MRR value, which updates `Founder.mrr` and appends a new `MRRSnapshot`. Email is sent via Resend (3k free emails/month, one-line API).

**Tech Stack:** Resend (email), `crypto.randomUUID()` (token), Prisma migration (schema), Next.js server actions / API route (update handler).

---

### Task 1: Add `email` and `updateToken` to the Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add the two fields to the `Founder` model**

In `prisma/schema.prisma`, add inside the `Founder` model (after `description`):

```prisma
email       String?
updateToken String?  @unique
```

**Step 2: Create and apply migration locally**

```bash
npx prisma migrate dev --name add-email-and-update-token
```

Expected output: `Your database is now in sync with your schema.`

**Step 3: Apply migration to production DB**

```bash
npx prisma migrate deploy
```

Expected output: `1 migration applied.`

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add email and updateToken fields to Founder"
```

---

### Task 2: Install and configure Resend

**Files:**
- Create: `lib/email.ts`
- Modify: `.env` (add `RESEND_API_KEY`)

**Step 1: Install Resend**

```bash
npm install resend
```

**Step 2: Add env var**

Add to `.env`:

```env
RESEND_API_KEY="re_..."
```

Get a free API key at resend.com → API Keys → Create. No domain needed for now — Resend lets you send from `onboarding@resend.dev` on the free tier.

**Step 3: Create `lib/email.ts`**

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUpdateLink(
  email: string,
  productName: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const updateUrl = `${appUrl}/update/${token}`;

  await resend.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `Update your MRR — ${productName}`,
    html: `
      <p>Hey 👋</p>
      <p>Here's your personal link to update the MRR for <strong>${productName}</strong> on MRR.fyi:</p>
      <p><a href="${updateUrl}" style="font-size:18px;font-weight:bold;">${updateUrl}</a></p>
      <p>Bookmark this link — it's the only way to update your revenue. It never expires.</p>
      <p>— MRR.fyi</p>
    `,
  });
}
```

**Step 4: Commit**

```bash
git add lib/email.ts .env
git commit -m "feat: add Resend email helper"
```

---

### Task 3: Add `email` field to submission form + validation

**Files:**
- Modify: `lib/validations.ts`
- Modify: `app/submit/page.tsx`

**Step 1: Add email to the Zod schema in `lib/validations.ts`**

Add after the `name` field:

```typescript
email: z.string().email("Must be a valid email"),
```

**Step 2: Add email input to the form in `app/submit/page.tsx`**

Inside the "About You" card, after the name field and before twitter, add:

```tsx
<div>
  <label className={labelClass}>Email *</label>
  <input
    {...register("email")}
    type="email"
    placeholder="you@example.com"
    className={inputClass}
  />
  <p className="text-xs text-[var(--text-dim)] mt-1">
    We'll send you a private link to update your MRR. Never shared.
  </p>
  {errors.email && (
    <p className={errorClass}>{errors.email.message}</p>
  )}
</div>
```

**Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add lib/validations.ts app/submit/page.tsx
git commit -m "feat: add email field to submission form"
```

---

### Task 4: Update the submit API to generate token + send email

**Files:**
- Modify: `app/api/submit/route.ts`

**Step 1: Update the route to generate a token, store it, and email the founder**

Replace the entire file content:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { sendUpdateLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, twitter, productName, productUrl, description, mrr, currency } =
      parsed.data;

    // Generate unique slug
    const baseSlug = slugify(productName);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.founder.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const mrrCents = Math.round(mrr * 100);
    const updateToken = crypto.randomUUID();

    const founder = await prisma.founder.create({
      data: {
        slug,
        name,
        email,
        twitter: twitter || null,
        productName,
        productUrl,
        description: description || null,
        mrr: mrrCents,
        currency,
        updateToken,
        snapshots: {
          create: { mrr: mrrCents },
        },
      },
    });

    // Send magic link email (non-blocking — don't fail submission if email fails)
    sendUpdateLink(email, productName, updateToken).catch((err) =>
      console.error("[email] failed to send update link:", err)
    );

    return NextResponse.json({ slug: founder.slug }, { status: 201 });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/api/submit/route.ts
git commit -m "feat: generate update token and send magic link email on submission"
```

---

### Task 5: Build the `/update/[token]` page + API route

**Files:**
- Create: `app/update/[token]/page.tsx`
- Create: `app/api/update/route.ts`

**Step 1: Create the API route `app/api/update/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  mrr: z.number().min(0, "MRR cannot be negative"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token, mrr } = parsed.data;

    const founder = await prisma.founder.findUnique({
      where: { updateToken: token },
    });

    if (!founder) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    const mrrCents = Math.round(mrr * 100);

    await prisma.$transaction([
      prisma.founder.update({
        where: { id: founder.id },
        data: { mrr: mrrCents },
      }),
      prisma.mRRSnapshot.create({
        data: { founderId: founder.id, mrr: mrrCents },
      }),
    ]);

    return NextResponse.json({ slug: founder.slug });
  } catch (err) {
    console.error("[update]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Create the update page `app/update/[token]/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UpdatePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [mrr, setMrr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(mrr);
    if (isNaN(value) || value < 0) {
      setError("Enter a valid MRR amount");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, mrr: value }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      router.push(`/${json.slug}?updated=1`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-10 transition-colors"
      >
        ← Leaderboard
      </a>

      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        Update your MRR.
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Enter your current monthly recurring revenue. A new snapshot will be recorded and your position on the leaderboard will update immediately.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium tracking-wide">
            New MRR (in full dollars)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={mrr}
            onChange={(e) => setMrr(e.target.value)}
            placeholder="e.g. 4200"
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors mono"
            required
          />
        </div>

        {error && (
          <div className="rounded-md border border-[var(--red)] bg-red-950/20 px-4 py-3 text-sm text-[var(--red)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isSubmitting ? "Saving..." : "Update MRR →"}
        </button>

        <p className="text-xs text-center text-[var(--text-dim)]">
          This link is private and never expires. Bookmark it.
        </p>
      </form>
    </div>
  );
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add app/update/ app/api/update/
git commit -m "feat: add /update/[token] page and POST /api/update route"
```

---

### Task 6: Show success banner on profile page after update

**Files:**
- Modify: `app/[slug]/page.tsx`

**Step 1: Read the `updated` search param and show a banner**

Add this import at the top (it's already a server component so use `searchParams`):

Update the `Props` interface and function signature to accept `searchParams`:

```typescript
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ updated?: string; submitted?: string }>;
}
```

Add at the top of the JSX (before the back link):

```tsx
const { updated, submitted } = await searchParams;

{(updated || submitted) && (
  <div
    className="mb-6 px-4 py-3 rounded-lg border border-[var(--emerald)] text-sm"
    style={{ background: "rgba(16,185,129,0.08)", color: "var(--emerald)" }}
  >
    {submitted
      ? "You're on the leaderboard. Check your email for your private update link."
      : "MRR updated. New snapshot recorded."}
  </div>
)}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/[slug]/page.tsx
git commit -m "feat: show success banner after submission or MRR update"
```

---

### Task 7: Add RESEND_API_KEY to Vercel and deploy

**Step 1: Add env var to Vercel**

```bash
printf '%s\n' "re_YOUR_KEY_HERE" | vercel env add RESEND_API_KEY production
printf '%s\n' "re_YOUR_KEY_HERE" | vercel env add RESEND_API_KEY preview
```

**Step 2: Apply migration to production DB**

```bash
npx prisma migrate deploy
```

**Step 3: Build and verify locally**

```bash
npm run build
```

Expected: clean build, no errors.

**Step 4: Deploy**

```bash
script -q /dev/null vercel --prod --yes --scope tomerabr-2304s-projects
```

**Step 5: Smoke test**

- Submit a new entry at `/submit` with a real email
- Check email arrives with update link
- Click link → update MRR → confirm redirect to profile with "MRR updated" banner
- Confirm new snapshot appears in chart

**Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete magic link MRR update flow"
```
