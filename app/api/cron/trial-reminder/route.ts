import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialEndingEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active payments with trials ending in the next 2 days that haven't been reminded
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const payments = await prisma.payment.findMany({
    where: {
      active: true,
      trialEndsAt: { lte: twoDaysFromNow, gt: new Date() },
      trialReminder: false,
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

    const daysLeft = Math.ceil(
      (payment.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const planLabel = payment.type === "FEATURED" ? "Featured" : "Verified";

    try {
      await sendTrialEndingEmail(
        payment.founder.email,
        payment.founder.productName,
        planLabel,
        daysLeft,
        payment.founder.slug
      );

      await prisma.payment.update({
        where: { id: payment.id },
        data: { trialReminder: true },
      });
      sent++;
    } catch (err) {
      console.error(`[trial-reminder] failed for payment ${payment.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: payments.length });
}
