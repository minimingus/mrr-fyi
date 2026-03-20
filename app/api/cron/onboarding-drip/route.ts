import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendOnboardingEmail2Tips,
  sendOnboardingEmail3Recap,
} from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  // Don't send emails to founders older than 14 days (safety window)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let sentEmail2 = 0;
  let sentEmail3 = 0;

  // Email 2: Day 3 — tips for building in public
  const email2Founders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      email: { not: null },
      onboardingEmailsSent: 1,
      createdAt: { lte: threeDaysAgo, gte: fourteenDaysAgo },
    },
    select: {
      id: true,
      email: true,
      productName: true,
      slug: true,
    },
  });

  // Fetch top founder for spotlight (highest MRR, verified)
  const topFounder = await prisma.founder.findFirst({
    where: { emailVerified: true },
    orderBy: { mrr: "desc" },
    select: { productName: true, slug: true, mrr: true, currency: true },
  });

  for (const founder of email2Founders) {
    if (!founder.email) continue;
    try {
      await sendOnboardingEmail2Tips(
        founder.email,
        founder.productName,
        founder.slug,
        topFounder
      );
      await prisma.founder.update({
        where: { id: founder.id },
        data: { onboardingEmailsSent: 2 },
      });
      sentEmail2++;
    } catch (err) {
      console.error(
        `[onboarding-drip] email 2 failed for ${founder.id}:`,
        err
      );
    }
  }

  // Email 3: Day 7 — first week recap + upgrade CTA
  const email3Founders = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      email: { not: null },
      onboardingEmailsSent: 2,
      createdAt: { lte: sevenDaysAgo, gte: fourteenDaysAgo },
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

  for (const founder of email3Founders) {
    if (!founder.email) continue;

    // Calculate current rank
    let rank: number | null = null;
    try {
      const higherCount = await prisma.founder.count({
        where: { mrr: { gt: founder.mrr }, emailVerified: true },
      });
      rank = higherCount + 1;
    } catch {
      // rank stays null
    }

    try {
      await sendOnboardingEmail3Recap(
        founder.email,
        founder.productName,
        founder.slug,
        rank,
        founder.mrr,
        founder.currency
      );
      await prisma.founder.update({
        where: { id: founder.id },
        data: { onboardingEmailsSent: 3 },
      });
      sentEmail3++;
    } catch (err) {
      console.error(
        `[onboarding-drip] email 3 failed for ${founder.id}:`,
        err
      );
    }
  }

  return NextResponse.json({
    email2: { sent: sentEmail2, eligible: email2Founders.length },
    email3: { sent: sentEmail3, eligible: email3Founders.length },
  });
}
