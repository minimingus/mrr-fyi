import { NextRequest, NextResponse } from "next/server";
import { constructStripeEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendChurnRecoveryEmail, sendTrialStartedEmail } from "@/lib/email";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.warn("[stripe/webhook] rejected: missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(body, signature);
  } catch (err) {
    console.warn("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const founderId = subscription.metadata?.founderId;
        const plan = subscription.metadata?.plan as "FEATURED" | "VERIFIED" | undefined;

        if (!founderId || !plan) break;

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null;

        await prisma.$transaction([
          prisma.payment.create({
            data: {
              founderId,
              type: plan,
              provider: "STRIPE",
              externalId: subscription.id,
              active: true,
              trialEndsAt: trialEnd,
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

        if (trialEnd) {
          try {
            const founder = await prisma.founder.findUnique({
              where: { id: founderId },
              select: { email: true, productName: true, slug: true },
            });
            if (founder?.email) {
              const planLabel = plan === "FEATURED" ? "Featured" : "Verified";
              await sendTrialStartedEmail(
                founder.email,
                founder.productName,
                planLabel,
                trialEnd,
                founder.slug
              );
            }
          } catch (err) {
            console.error("[stripe/webhook] failed to send trial-started email:", err);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const payment = await prisma.payment.findUnique({
          where: { externalId: subscription.id },
          include: { founder: { select: { email: true, productName: true, slug: true } } },
        });
        if (!payment) break;

        await prisma.$transaction([
          prisma.payment.update({
            where: { externalId: subscription.id },
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

        if (payment.founder.email) {
          try {
            await sendChurnRecoveryEmail(
              payment.founder.email,
              payment.founder.productName,
              payment.type,
              payment.founder.slug
            );
          } catch (err) {
            console.error("[stripe/webhook] failed to send churn recovery email:", err);
          }
        }
        break;
      }

      case "account.application.deauthorized": {
        // Fired when a founder revokes Stripe Connect access via their Stripe dashboard.
        // event.account is the connected account ID that deauthorized the app.
        const stripeAccountId = event.account;
        if (!stripeAccountId) break;

        await prisma.founder.updateMany({
          where: { stripeAccountId },
          data: { stripeAccountId: null, stripeMrr: null },
        });

        console.log(
          `[stripe/webhook] cleared stripeAccountId/stripeMrr for account ${stripeAccountId}`
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const isPastDue = subscription.status === "past_due" || subscription.status === "unpaid";

        const payment = await prisma.payment.findUnique({
          where: { externalId: subscription.id },
        });
        if (!payment) break;

        if (isPastDue && payment.active) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { externalId: subscription.id },
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
        } else if (isActive && !payment.active) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { externalId: subscription.id },
              data: { active: true },
            }),
            prisma.founder.update({
              where: { id: payment.founderId },
              data: {
                featured: payment.type === "FEATURED" ? true : undefined,
                verified: payment.type === "VERIFIED" ? true : undefined,
              },
            }),
          ]);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
