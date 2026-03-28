export const PLANS = {
  VERIFIED: {
    variantId: process.env.LS_VERIFIED_VARIANT_ID!,
    name: "Verified Badge",
    price: 9,
    description: "Verified revenue badge on your profile",
  },
} as const;

export const TRIAL_DAYS = 7;

export async function createCheckoutUrl(
  variantId: string,
  founderId: string,
  plan: string,
  redirectUrl: string
): Promise<string> {
  const missingVars = [
    ["LEMONSQUEEZY_API_KEY", process.env.LEMONSQUEEZY_API_KEY],
    ["LS_STORE_ID", process.env.LS_STORE_ID],
    ["variantId", variantId],
  ]
    .filter(([, v]) => !v || v.includes("your_"))
    .map(([k]) => k);

  if (missingVars.length > 0) {
    throw new Error(`Lemon Squeezy not configured. Missing: ${missingVars.join(", ")}`);
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: { founderId, plan },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
          trial_ends_at: trialEndsAt.toISOString(),
        },
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LS_STORE_ID },
          },
          variant: {
            data: { type: "variants", id: variantId },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy checkout failed: ${err}`);
  }

  const json = await res.json();
  return json.data.attributes.url as string;
}
