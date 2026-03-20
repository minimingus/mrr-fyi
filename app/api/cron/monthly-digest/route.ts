import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMonthlyDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Get all founders with email
  const founders = await prisma.founder.findMany({
    where: { email: { not: null } },
    select: {
      id: true,
      email: true,
      productName: true,
      mrr: true,
      mrrGoal: true,
      currency: true,
      updateToken: true,
    },
    orderBy: { mrr: "desc" },
  });

  // Build rank map from all founders (including those without email)
  const allByMrr = await prisma.founder.findMany({
    select: { id: true, mrr: true },
    orderBy: { mrr: "desc" },
  });
  const rankMap = new Map<string, number>();
  allByMrr.forEach((f, i) => rankMap.set(f.id, i + 1));

  // Top 3 for the leaderboard section
  const top3 = await prisma.founder.findMany({
    select: { productName: true, mrr: true, currency: true },
    orderBy: { mrr: "desc" },
    take: 3,
  });

  // Get previous ranks from snapshots ~1 month ago
  const previousRanks = await getPreviousRanks(oneMonthAgo);

  let sent = 0;
  let failed = 0;

  for (const founder of founders) {
    if (!founder.email || !founder.updateToken) continue;

    const currentRank = rankMap.get(founder.id) ?? 1;
    const previousRank = previousRanks.get(founder.id) ?? null;

    try {
      await sendMonthlyDigest(
        founder.email,
        founder.productName,
        founder.mrr,
        founder.currency,
        currentRank,
        previousRank,
        top3,
        founder.updateToken,
        founder.mrrGoal
      );
      sent++;
    } catch (err) {
      console.error(`Failed to send digest to ${founder.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}

async function getPreviousRanks(
  aroundDate: Date
): Promise<Map<string, number>> {
  // Find the closest snapshot per founder near the target date
  // to reconstruct previous leaderboard positions
  const snapshots = await prisma.mRRSnapshot.findMany({
    where: { recordedAt: { lte: aroundDate } },
    orderBy: [{ founderId: "asc" }, { recordedAt: "desc" }],
    distinct: ["founderId"],
    select: { founderId: true, mrr: true },
  });

  // Sort by MRR descending to derive rank
  snapshots.sort((a, b) => b.mrr - a.mrr);

  const ranks = new Map<string, number>();
  snapshots.forEach((s, i) => ranks.set(s.founderId, i + 1));
  return ranks;
}
