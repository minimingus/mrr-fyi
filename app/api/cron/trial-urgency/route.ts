import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialUrgencyEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find payments with trials ending in 20–28h that haven't received the urgency email
  const in20h = new Date(Date.now() + 20 * 60 * 60 * 1000);
  const in28h = new Date(Date.now() + 28 * 60 * 60 * 1000);

  const [payments, founderCount] = await Promise.all([
    prisma.payment.findMany({
      where: {
        active: true,
        trialEndsAt: { gte: in20h, lte: in28h },
        trialUrgencyReminder: false,
      },
      include: {
        founder: {
          select: { email: true, productName: true, slug: true },
        },
      },
    }),
    prisma.founder.count(),
  ]);

  let sent = 0;
  for (const payment of payments) {
    if (!payment.founder.email || !payment.trialEndsAt) continue;

    const planLabel = payment.type === "FEATURED" ? "Featured" : "Pro";

    try {
      await sendTrialUrgencyEmail(
        payment.founder.email,
        payment.founder.productName,
        planLabel,
        payment.founder.slug,
        founderCount
      );

      await prisma.payment.update({
        where: { id: payment.id },
        data: { trialUrgencyReminder: true },
      });
      sent++;
    } catch (err) {
      console.error(`[trial-urgency] failed for payment ${payment.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: payments.length });
}
