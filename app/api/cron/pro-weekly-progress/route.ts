import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendProWeeklyProgress } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // All Pro founders with email who haven't unsubscribed
  const proFounders = await prisma.founder.findMany({
    where: {
      isPro: true,
      emailVerified: true,
      email: { not: null },
      updateToken: { not: null },
      digestUnsubscribedAt: null,
    },
    select: {
      id: true,
      email: true,
      updateToken: true,
      productName: true,
      mrr: true,
      currency: true,
    },
  });

  if (proFounders.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  // Total verified founders for rank computation
  const totalFounders = await prisma.founder.count({ where: { emailVerified: true } });

  // Compute current ranks (number of founders with higher MRR + 1)
  const allVerified = await prisma.founder.findMany({
    where: { emailVerified: true },
    select: { id: true, mrr: true },
    orderBy: { mrr: "desc" },
  });
  const rankMap = new Map<string, number>();
  allVerified.forEach((f, i) => rankMap.set(f.id, i + 1));

  // Last week snapshots per Pro founder for WoW comparison
  const founderIds = proFounders.map((f) => f.id);
  const lastWeekSnapshots = await prisma.mRRSnapshot.findMany({
    where: {
      founderId: { in: founderIds },
      recordedAt: { lte: oneWeekAgo },
    },
    orderBy: [{ founderId: "asc" }, { recordedAt: "desc" }],
    distinct: ["founderId"],
    select: { founderId: true, mrr: true },
  });
  const prevMrrMap = new Map<string, number>();
  for (const s of lastWeekSnapshots) {
    prevMrrMap.set(s.founderId, s.mrr);
  }

  // Compute community average WoW growth (all verified founders with a last-week snapshot)
  const allLastWeekSnapshots = await prisma.mRRSnapshot.findMany({
    where: { recordedAt: { lte: oneWeekAgo } },
    orderBy: [{ founderId: "asc" }, { recordedAt: "desc" }],
    distinct: ["founderId"],
    select: { founderId: true, mrr: true },
  });
  const allSnapshotMap = new Map<string, number>();
  for (const s of allLastWeekSnapshots) {
    allSnapshotMap.set(s.founderId, s.mrr);
  }

  const growthPcts = allVerified
    .map((f) => {
      const prev = allSnapshotMap.get(f.id);
      if (!prev || prev <= 0) return null;
      return ((f.mrr - prev) / prev) * 100;
    })
    .filter((v): v is number => v !== null && v > 0);

  const avgGrowthPct =
    growthPcts.length > 0
      ? growthPcts.reduce((a, b) => a + b, 0) / growthPcts.length
      : null;

  // Compute previous ranks using last-week MRR snapshot to approximate rank movement
  // Build a sorted list of (founderId, lastWeekMrr or currentMrr)
  const prevRankData = allVerified.map((f) => ({
    id: f.id,
    mrr: allSnapshotMap.get(f.id) ?? f.mrr,
  }));
  prevRankData.sort((a, b) => b.mrr - a.mrr);
  const prevRankMap = new Map<string, number>();
  prevRankData.forEach((f, i) => prevRankMap.set(f.id, i + 1));

  let sent = 0;
  let failed = 0;

  for (const founder of proFounders) {
    if (!founder.email || !founder.updateToken) continue;

    const currentRank = rankMap.get(founder.id) ?? totalFounders;
    const prevMrr = prevMrrMap.get(founder.id) ?? null;
    const prevRank = prevRankMap.get(founder.id) ?? null;

    try {
      await sendProWeeklyProgress(founder.email, founder.updateToken, {
        productName: founder.productName,
        currentMrr: founder.mrr,
        previousMrr: prevMrr,
        currency: founder.currency,
        currentRank,
        previousRank: prevRank !== currentRank ? prevRank : null,
        totalFounders,
        avgGrowthPct,
      });
      sent++;
    } catch (err) {
      console.error(`[pro-weekly-progress] failed for founder ${founder.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
