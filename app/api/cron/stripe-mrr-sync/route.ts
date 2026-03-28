import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMRRFromStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Cron: re-sync stripeMrr for every founder with a connected Stripe account.
 * Runs daily. Updates the stored stripeMrr so the displayed MRR stays current
 * without requiring the founder to reconnect.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const founders = await prisma.founder.findMany({
    where: { stripeAccountId: { not: null } },
    select: { id: true, stripeAccountId: true },
  });

  let updated = 0;
  let failed = 0;

  for (const founder of founders) {
    try {
      const stripeMrr = await calculateMRRFromStripe(founder.stripeAccountId!);
      await prisma.founder.update({
        where: { id: founder.id },
        data: { stripeMrr },
      });
      updated++;
    } catch (err) {
      console.error(
        `[stripe-mrr-sync] failed for founder ${founder.id}:`,
        err
      );
      failed++;
    }
  }

  console.log(
    `[stripe-mrr-sync] done — updated: ${updated}, failed: ${failed}, total: ${founders.length}`
  );

  return NextResponse.json({ updated, failed, total: founders.length });
}
