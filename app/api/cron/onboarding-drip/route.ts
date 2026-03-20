import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendOnboardingWelcome,
  sendOnboardingTips,
  sendOnboardingRecap,
} from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { welcome: 0, tips: 0, recap: 0, errors: 0 };

  // Step 0 → 1: Welcome email (immediately after verification, for verified founders with step 0)
  const welcomeFounders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      onboardingStep: 0,
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      productName: true,
      slug: true,
      updateToken: true,
      referralCode: true,
    },
    take: 50,
  });

  for (const f of welcomeFounders) {
    if (!f.email || !f.updateToken) continue;
    try {
      await sendOnboardingWelcome(f.email, f.productName, f.slug, f.updateToken, f.referralCode);
      await prisma.founder.update({ where: { id: f.id }, data: { onboardingStep: 1 } });
      results.welcome++;
    } catch (err) {
      console.error(`[onboarding-drip] welcome failed for ${f.id}:`, err);
      results.errors++;
    }
  }

  // Step 1 → 2: Tips email (3+ days after creation)
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const tipsFounders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      onboardingStep: 1,
      email: { not: null },
      createdAt: { lte: threeDaysAgo },
    },
    select: { id: true, email: true, productName: true, slug: true },
    take: 50,
  });

  for (const f of tipsFounders) {
    if (!f.email) continue;
    try {
      await sendOnboardingTips(f.email, f.productName, f.slug);
      await prisma.founder.update({ where: { id: f.id }, data: { onboardingStep: 2 } });
      results.tips++;
    } catch (err) {
      console.error(`[onboarding-drip] tips failed for ${f.id}:`, err);
      results.errors++;
    }
  }

  // Step 2 → 3: Recap email (7+ days after creation)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recapFounders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      onboardingStep: 2,
      email: { not: null },
      createdAt: { lte: sevenDaysAgo },
    },
    select: { id: true, email: true, productName: true, slug: true, mrr: true, currency: true },
    take: 50,
  });

  for (const f of recapFounders) {
    if (!f.email) continue;
    try {
      const rank = await prisma.founder.count({
        where: { emailVerified: true, mrr: { gt: f.mrr } },
      }) + 1;
      await sendOnboardingRecap(f.email, f.productName, f.slug, f.mrr, f.currency, rank);
      await prisma.founder.update({ where: { id: f.id }, data: { onboardingStep: 3 } });
      results.recap++;
    } catch (err) {
      console.error(`[onboarding-drip] recap failed for ${f.id}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
