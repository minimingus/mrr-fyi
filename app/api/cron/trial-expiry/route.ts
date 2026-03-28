import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialExpiredEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active payments with trials that have already expired and no notice sent yet
  const payments = await prisma.payment.findMany({
    where: {
      active: true,
      trialEndsAt: { not: null, lte: new Date() },
      trialExpiredNotice: false,
    },
    include: {
      founder: {
        select: { email: true, productName: true, slug: true },
      },
    },
  });

  let sent = 0;
  for (const payment of payments) {
    if (!payment.founder.email || !payment.trialEndsAt) continue;

    const planLabel = payment.type === "FEATURED" ? "Featured" : "Pro";

    try {
      await sendTrialExpiredEmail(
        payment.founder.email,
        payment.founder.productName,
        planLabel,
        payment.founder.slug
      );

      await prisma.payment.update({
        where: { id: payment.id },
        data: { trialExpiredNotice: true },
      });
      sent++;
    } catch (err) {
      console.error(`[trial-expiry] failed for payment ${payment.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: payments.length });
}
