# MRR.fyi

[![CI](https://github.com/minimingus/mrr-fyi/actions/workflows/ci.yml/badge.svg)](https://github.com/minimingus/mrr-fyi/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/status-active-brightgreen)

Public indie revenue leaderboard. Real MRR from real founders, building in public.

## What it is

- Founders submit their MRR + product link
- Public leaderboard ranked by revenue
- Individual profile pages with MRR growth charts (SEO goldmine)
- Monetized via Featured listings ($29/mo) and Verified badges ($9/mo)
- Payments via LemonSqueezy

## Stack

- **Next.js 14** (App Router, server components)
- **Prisma** + **PostgreSQL**
- **Stripe** (subscriptions)
- **Tailwind CSS**
- **Recharts** (MRR chart)
- **Zod** + **React Hook Form** (validation)
- **Vercel** (deployment)

---

## Local Development

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or use Supabase/Neon for free)
- Stripe account (test mode is fine)

### 2. Install

```bash
cd /Users/tomerab/dev/levels/mrr-fyi
npm install
```

### 3. Configure environment variables

Fill in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mrr_fyi"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_FEATURED_PRICE_ID="price_..."
STRIPE_VERIFIED_PRICE_ID="price_..."

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Create Stripe products

In Stripe dashboard (test mode):

1. **Featured Listing** — recurring $29/month → copy Price ID to `STRIPE_FEATURED_PRICE_ID`
2. **Verified Badge** — recurring $9/month → copy Price ID to `STRIPE_VERIFIED_PRICE_ID`

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start dev server

```bash
npm run dev
```

### 7. Run Stripe webhook locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret printed to terminal into `STRIPE_WEBHOOK_SECRET`.

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/mrr-fyi
git push -u origin main
```

### 2. Deploy on Vercel

1. Import the repo at vercel.com/new
2. Add all environment variables
3. Set `NEXT_PUBLIC_APP_URL` to your production URL

### 3. Production Stripe webhook

Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`

---

## Revenue Model

| Product | Price | What it does |
|---|---|---|
| Featured Listing | $29/mo | Pinned to top of leaderboard, amber glow |
| Verified Badge | $9/mo | Green check badge on profile |

## Launch Checklist

- [ ] Database provisioned (Supabase or Neon recommended)
- [ ] Stripe products created (Featured + Verified)
- [ ] All env vars set in Vercel
- [ ] Webhook endpoint registered in Stripe
- [ ] Custom domain pointed
- [ ] Submit your own revenue first (be the example)
- [ ] Post on Indie Hackers, X/Twitter, Product Hunt
- [ ] Show HN

## Routes

| Route | Description |
|---|---|
| `/` | Leaderboard ranked by MRR |
| `/submit` | Submission form |
| `/pricing` | Featured + Verified plans |
| `/[slug]` | Founder profile with MRR chart |
| `POST /api/submit` | Create new founder entry |
| `POST /api/stripe/checkout` | Create Stripe checkout session |
| `POST /api/stripe/webhook` | Handle Stripe events |
