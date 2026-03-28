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
} as const;

export function getStripePriceId(plan: "VERIFIED"): string {
  const id = process.env.STRIPE_VERIFIED_PRICE_ID;
  if (!id) throw new Error("STRIPE_VERIFIED_PRICE_ID is not set");
  return id;
}

export async function createStripeCheckoutSession(
  plan: "VERIFIED",
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

// ---------------------------------------------------------------------------
// Stripe Connect — MRR verification
// ---------------------------------------------------------------------------

export function buildStripeConnectUrl(state: string, redirectUri: string): string {
  if (!process.env.STRIPE_CLIENT_ID) {
    throw new Error("STRIPE_CLIENT_ID is not set");
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.STRIPE_CLIENT_ID,
    scope: "read_only",
    state,
    redirect_uri: redirectUri,
  });
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStripeConnectCode(
  code: string
): Promise<{ stripeUserId: string }> {
  const stripe = getStripe();
  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });
  if (!response.stripe_user_id) {
    throw new Error("No stripe_user_id in OAuth response");
  }
  return { stripeUserId: response.stripe_user_id };
}

export async function calculateMRRFromStripe(stripeAccountId: string): Promise<number> {
  const stripe = getStripe();
  let totalMrrCents = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list(
      {
        status: "active",
        limit: 100,
        expand: ["data.items.data.price"],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
      { stripeAccount: stripeAccountId }
    );

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const unitAmount = price.unit_amount ?? 0;
        const quantity = item.quantity ?? 1;
        const interval = price.recurring?.interval ?? "month";
        const intervalCount = price.recurring?.interval_count ?? 1;

        let monthlyAmount = unitAmount * quantity;
        if (interval === "year") {
          monthlyAmount = monthlyAmount / 12;
        } else if (interval === "week") {
          monthlyAmount = monthlyAmount * 4;
        } else if (interval === "day") {
          monthlyAmount = monthlyAmount * 30;
        }
        monthlyAmount = monthlyAmount / intervalCount;

        totalMrrCents += Math.round(monthlyAmount);
      }
    }

    hasMore = subscriptions.has_more;
    if (hasMore && subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return totalMrrCents;
}
