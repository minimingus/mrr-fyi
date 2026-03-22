import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Top 5 by current MRR
  const top5 = await prisma.founder.findMany({
    where: { emailVerified: true },
    select: { productName: true, mrr: true, currency: true },
    orderBy: { mrr: "desc" },
    take: 5,
  });

  // Compute biggest gainers (% WoW growth) using MRRSnapshot
  // Get last known snapshot per founder from ~1 week ago
  const lastWeekSnapshots = await prisma.mRRSnapshot.findMany({
    where: { recordedAt: { lte: oneWeekAgo } },
    orderBy: [{ founderId: "asc" }, { recordedAt: "desc" }],
    distinct: ["founderId"],
    select: { founderId: true, mrr: true },
  });

  const snapshotMap = new Map<string, number>();
  for (const s of lastWeekSnapshots) {
    snapshotMap.set(s.founderId, s.mrr);
  }

  // All verified founders with email for gain computation
  const allFounders = await prisma.founder.findMany({
    where: { emailVerified: true },
    select: { id: true, productName: true, mrr: true },
  });

  const gainers = allFounders
    .filter((f) => {
      const prev = snapshotMap.get(f.id);
      return prev !== undefined && prev > 0 && f.mrr > prev;
    })
    .map((f) => {
      const prev = snapshotMap.get(f.id)!;
      return {
        productName: f.productName,
        mrrChangePct: ((f.mrr - prev) / prev) * 100,
      };
    })
    .sort((a, b) => b.mrrChangePct - a.mrrChangePct)
    .slice(0, 3);

  // All recipients: verified founders with email who haven't unsubscribed
  const recipients = await prisma.founder.findMany({
    where: {
      emailVerified: true,
      email: { not: null },
      updateToken: { not: null },
      digestUnsubscribedAt: null,
    },
    select: {
      id: true,
      email: true,
      updateToken: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const founder of recipients) {
    if (!founder.email || !founder.updateToken) continue;

    try {
      await sendWeeklyDigest(founder.email, founder.updateToken, top5, gainers);
      sent++;
    } catch (err) {
      console.error(`[weekly-digest] failed for founder ${founder.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
