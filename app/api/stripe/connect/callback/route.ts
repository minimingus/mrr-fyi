import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeStripeConnectCode, calculateMRRFromStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // equals the founder's updateToken
  const error = searchParams.get("error");

  if (error) {
    console.warn("[stripe/connect/callback] Stripe OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=stripe_connect_denied", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=stripe_connect_failed", req.url));
  }

  const founder = await prisma.founder.findUnique({ where: { updateToken: state } });
  if (!founder) {
    return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dashboardUrl = `${appUrl}/update/${state}`;

  let stripeUserId: string;
  try {
    ({ stripeUserId } = await exchangeStripeConnectCode(code));
  } catch (err) {
    console.error("[stripe/connect/callback] code exchange failed:", err);
    return NextResponse.redirect(`${dashboardUrl}?stripe=error`);
  }

  // Calculate MRR from Stripe. Best-effort — don't fail the connect if this errors.
  let stripeMrr: number | null = null;
  try {
    stripeMrr = await calculateMRRFromStripe(stripeUserId);
  } catch (err) {
    console.error("[stripe/connect/callback] MRR calculation failed:", err);
  }

  await prisma.founder.update({
    where: { id: founder.id },
    data: {
      stripeAccountId: stripeUserId,
      ...(stripeMrr !== null ? { stripeMrr } : {}),
    },
  });

  return NextResponse.redirect(`${dashboardUrl}?stripe=connected`);
}
