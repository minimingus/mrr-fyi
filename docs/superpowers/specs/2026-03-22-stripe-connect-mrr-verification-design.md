# Stripe Connect MRR Verification — Design Spec

**Date:** 2026-03-22
**Task:** MRR-103
**Status:** Approved for implementation

---

## Overview

Add Stripe Connect OAuth so founders can link their Stripe account and get a "Stripe-verified MRR" badge. This is a stronger trust signal than self-reported MRR, differentiating mrr.fyi from TrustMRR.

---

## Architecture

### OAuth Flow

```
Founder dashboard → /api/stripe/connect/authorize?token={updateToken}
  → Stripe Connect OAuth (scope: read_only)
    → /api/stripe/connect/callback?code={code}&state={updateToken}
      → Exchange code → get stripe_user_id + access_token
      → Calculate MRR from Stripe subscriptions
      → Store stripeAccountId + stripeMrr on Founder
      → Redirect to /update/{token}?stripe=connected
```

### State / CSRF

The `state` param equals the founder's `updateToken`. On callback, we find the founder by that token — this ties the OAuth response to the exact founder who initiated it.

---

## Data Model Changes

Add two fields to `Founder`:

```prisma
stripeAccountId  String?  @unique
stripeMrr        Int?     // in cents, Stripe-calculated MRR
```

---

## New Files

| File | Purpose |
|------|---------|
| `app/api/stripe/connect/authorize/route.ts` | Starts OAuth — builds Stripe URL, redirects |
| `app/api/stripe/connect/callback/route.ts` | Handles redirect — exchanges code, stores account, refreshes MRR |

---

## Changed Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `stripeAccountId`, `stripeMrr` to Founder |
| `lib/stripe.ts` | Add `buildStripeConnectUrl()`, `exchangeStripeConnectCode()`, `calculateMRRFromStripe()` |
| `app/[slug]/page.tsx` | Show "Stripe Verified" badge when `stripeAccountId` set |
| `components/FounderRow.tsx` | Show Stripe badge on leaderboard row |
| `app/update/[token]/page.tsx` | Add "Connect Stripe" button with loading state |

---

## MRR Calculation

Fetch all `active` subscriptions from the connected account via `stripeAccount` header. Normalize each subscription item to monthly:

- `month` → amount × quantity
- `year` → amount × quantity / 12
- `week` → amount × quantity × 4
- `day` → amount × quantity × 30
- Divide by `interval_count`

Sum in cents. Store as `stripeMrr`. Display separately from self-reported `mrr`.

---

## Badge Display

- Profile page: show `⚡ STRIPE VERIFIED` badge in teal/blue next to product name when `stripeAccountId` is non-null
- FounderRow: show small `⚡` icon or badge
- MRR value on profile: show Stripe MRR when available, with a tooltip or note

---

## Environment Variables

| Var | Purpose |
|-----|---------|
| `STRIPE_CLIENT_ID` | Connect app client ID (from Stripe dashboard) |
| `STRIPE_SECRET_KEY` | Existing — used for platform API calls with `stripeAccount` header |
| `NEXT_PUBLIC_APP_URL` | Existing — callback URL base |

---

## Error Handling

- Bad state: redirect to `/` with `?error=stripe_connect_failed`
- Stripe code exchange failure: redirect back to dashboard with `?stripe=error`
- Subscriptions fetch fails: still store `stripeAccountId`, set `stripeMrr = null`

---

## Definition of Done

- [ ] Founder can click "Connect Stripe" on dashboard
- [ ] After OAuth, profile shows Stripe-verified MRR badge
- [ ] MRR auto-populated from Stripe subscriptions
- [ ] Badge visible on leaderboard and profile page
