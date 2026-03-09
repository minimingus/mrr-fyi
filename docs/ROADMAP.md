# MRR.fyi Roadmap

Internal planning doc. Dump ideas here, move them through stages.

---

## Status: Where we are

- [x] Leaderboard with MRR ranking
- [x] Founder submission form
- [x] Individual profile pages with MRR growth chart
- [x] Magic link MRR updates (email via Resend)
- [x] Pricing page (Featured $29/mo, Verified $9/mo)
- [x] LemonSqueezy checkout + webhook
- [ ] Webhook fully wired (payment activates featured/verified on founder row)
- [ ] Production deployment live

---

## Now (next to ship)

- [ ] Verify webhook handler correctly sets `featured`/`verified` on `Founder` after payment
- [ ] Test full LemonSqueezy checkout → webhook → badge flow end-to-end
- [ ] Update README to reflect LemonSqueezy (remove Stripe references)
- [x] Set up GitHub remote + push
- [x] Deploy to Vercel, connected to GitHub auto-deploy
- [ ] Register LemonSqueezy webhook endpoint in production

---

## Soon (next meaningful features)

- [ ] **OG images** — dynamic `ImageResponse` per founder profile showing MRR; makes every Twitter share a free ad
- [ ] **Share moment after submission** — "Share your MRR →" button with pre-filled tweet (`I'm making $X/mo with [product] 🚀 mrr.fyi/slug`)
- [ ] **Sitemap.xml** — `app/sitemap.ts`, one file, instant SEO win for all profile pages
- [ ] **Pre-fill slug on pricing page** — link from profile as `/pricing?slug=your-slug` so founders don't have to type it
- [ ] "Fastest growing this week" sort tab — surfaces smaller founders, incentivizes regular MRR updates
- [ ] Let founders update more than MRR via magic link (Twitter handle, description, product URL)
- [ ] Admin page — manually verify/feature a founder, edit entries
- [ ] Soft-delete / hide entries (spam, fake MRR)
- [ ] "Claim your listing" flow for founders submitted by others
- [ ] Currency normalization — display all MRR in USD equivalent on leaderboard

---

## Backlog (good ideas, not urgent)

- [ ] Weekly email digest to founders — "your MRR vs last week"
- [ ] Milestone badges (first $1k, $10k, $100k MRR)
- [ ] Founder can add their tools/stack (affiliate potential)
- [ ] Filter/sort leaderboard by category, growth %, age
- [ ] "New this week" section on homepage
- [ ] Embeddable MRR badge for founders to put on their site
- [ ] API endpoint — public JSON feed of leaderboard data
- [ ] Webhook: notify founder via email when they move up N spots

---

## Maybe / Explore

- [ ] Anonymous submissions (no email required)
- [ ] Team/company profiles (multiple founders, one product)
- [ ] Comments or reactions on profiles
- [ ] Sponsor slot (non-subscription, one-off payment)
- [ ] MRR verification via Stripe/Lemon read-only API key
- [ ] Mobile app (stretch)

---

## Dropped / Won't do

- Stripe (replaced with LemonSqueezy — simpler global payments)
