import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { founderId, plan } = session.metadata ?? {};

        if (!founderId || !plan) break;

        await prisma.$transaction([
          prisma.payment.create({
            data: {
              founderId,
              type: plan as "FEATURED" | "VERIFIED",
              stripeId: session.subscription as string,
              active: true,
            },
          }),
          prisma.founder.update({
            where: { id: founderId },
            data: {
              featured: plan === "FEATURED" ? true : undefined,
              verified: plan === "VERIFIED" ? true : undefined,
            },
          }),
        ]);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const payment = await prisma.payment.findUnique({
          where: { stripeId: sub.id },
        });
        if (!payment) break;

        await prisma.$transaction([
          prisma.payment.update({
            where: { stripeId: sub.id },
            data: { active: false },
          }),
          prisma.founder.update({
            where: { id: payment.founderId },
            data: {
              featured: payment.type === "FEATURED" ? false : undefined,
              verified: payment.type === "VERIFIED" ? false : undefined,
            },
          }),
        ]);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
