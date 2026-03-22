import Stripe from "stripe";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export const STRIPE_PLANS = {
  VERIFIED: { price: 9, trialDays: 7 },
  FEATURED: { price: 29, trialDays: 7 },
} as const;

export function getStripePriceId(plan: "FEATURED" | "VERIFIED"): string {
  const key = plan === "FEATURED" ? "STRIPE_FEATURED_PRICE_ID" : "STRIPE_VERIFIED_PRICE_ID";
  const id = process.env[key];
  if (!id) throw new Error(`${key} is not set`);
  return id;
}

export async function createStripeCheckoutSession(
  plan: "FEATURED" | "VERIFIED",
  founderId: string,
  redirectUrl: string
): Promise<string> {
  const stripe = getStripe();
  const priceId = getStripePriceId(plan);
  const { trialDays } = STRIPE_PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: trialDays,
      metadata: { founderId, plan },
    },
    metadata: { founderId, plan },
    success_url: redirectUrl,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return session.url!;
}

export async function createStripePortalSession(
  subscriptionId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

export function constructStripeEvent(payload: string, signature: string): Stripe.Event {
  const stripe = getStripe();
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
