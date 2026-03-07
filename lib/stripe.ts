import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PLANS = {
  FEATURED: {
    priceId: process.env.STRIPE_FEATURED_PRICE_ID!,
    name: "Featured Listing",
    price: 29,
    description: "Pinned to the top of the leaderboard",
  },
  VERIFIED: {
    priceId: process.env.STRIPE_VERIFIED_PRICE_ID!,
    name: "Verified Badge",
    price: 9,
    description: "Verified revenue badge on your profile",
  },
} as const;
