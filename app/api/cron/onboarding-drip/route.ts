import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOnboardingTips, sendOnboardingRecap } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let tipsSent = 0;
  let recapSent = 0;

  // Day 3 emails: founders with onboardingStep=1 who signed up >= 3 days ago
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const day3Founders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      onboardingStep: 1,
      createdAt: { lte: threeDaysAgo },
    },
    select: { id: true, email: true, productName: true, slug: true },
  });

  for (const founder of day3Founders) {
    if (!founder.email) continue;
    try {
      await sendOnboardingTips(founder.email, founder.productName, founder.slug);
      await prisma.founder.update({
        where: { id: founder.id },
        data: { onboardingStep: 2 },
      });
      tipsSent++;
    } catch (err) {
      console.error(`[onboarding-drip] tips failed for ${founder.id}:`, err);
    }
  }

  // Day 7 emails: founders with onboardingStep=2 who signed up >= 7 days ago
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const day7Founders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      onboardingStep: 2,
      createdAt: { lte: sevenDaysAgo },
    },
    select: {
      id: true,
      email: true,
      productName: true,
      slug: true,
      mrr: true,
      currency: true,
    },
  });

  for (const founder of day7Founders) {
    if (!founder.email) continue;
    try {
      const rank =
        (await prisma.founder.count({
          where: { emailVerified: true, mrr: { gt: founder.mrr } },
        })) + 1;

      await sendOnboardingRecap(
        founder.email,
        founder.productName,
        founder.slug,
        founder.mrr,
        founder.currency,
        rank
      );
      await prisma.founder.update({
        where: { id: founder.id },
        data: { onboardingStep: 3 },
      });
      recapSent++;
    } catch (err) {
      console.error(`[onboarding-drip] recap failed for ${founder.id}:`, err);
    }
  }

  return NextResponse.json({
    tipsSent,
    tipsEligible: day3Founders.length,
    recapSent,
    recapEligible: day7Founders.length,
  });
}
