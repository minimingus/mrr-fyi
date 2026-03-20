import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendChurnRecoveryEmail } from "@/lib/email";
import crypto from "crypto";

interface WebhookEvent {
  meta: {
    event_name: string;
    custom_data?: { founderId?: string; plan?: string };
  };
  data: { id?: string | number };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const hmac = crypto
    .createHmac("sha256", process.env.LS_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  const hmacBuf = Buffer.from(hmac);
  const sigBuf = Buffer.from(signature);
  if (hmacBuf.length !== sigBuf.length || !crypto.timingSafeEqual(hmacBuf, sigBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta.event_name;
  const customData = event.meta.custom_data ?? {};
  const { founderId, plan } = customData;
  const subscriptionId = String(event.data.id ?? "");

  try {
    switch (eventName) {
      case "subscription_created": {
        if (!founderId || !plan || !subscriptionId) break;

        await prisma.$transaction([
          prisma.payment.create({
            data: {
              founderId,
              type: plan as "FEATURED" | "VERIFIED",
              externalId: subscriptionId,
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

      case "subscription_resumed": {
        const resumedPayment = await prisma.payment.findUnique({
          where: { externalId: subscriptionId },
        });
        if (!resumedPayment) break;

        await prisma.$transaction([
          prisma.payment.update({
            where: { externalId: subscriptionId },
            data: { active: true },
          }),
          prisma.founder.update({
            where: { id: resumedPayment.founderId },
            data: {
              featured: resumedPayment.type === "FEATURED" ? true : undefined,
              verified: resumedPayment.type === "VERIFIED" ? true : undefined,
            },
          }),
        ]);
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const payment = await prisma.payment.findUnique({
          where: { externalId: subscriptionId },
          include: { founder: { select: { email: true, productName: true, slug: true } } },
        });
        if (!payment) break;

        await prisma.$transaction([
          prisma.payment.update({
            where: { externalId: subscriptionId },
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

        if (eventName === "subscription_cancelled" && payment.founder.email) {
          try {
            await sendChurnRecoveryEmail(
              payment.founder.email,
              payment.founder.productName,
              payment.type,
              payment.founder.slug,
            );
          } catch (err) {
            console.error("[webhook] failed to send churn recovery email:", err);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
