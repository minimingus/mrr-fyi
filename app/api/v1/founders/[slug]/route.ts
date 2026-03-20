import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = rateLimit(req, { key: "api-founder", limit: 60, windowSec: 60 });
  if (limited) return limited;

  const { slug } = await params;

  const founder = await prisma.founder.findUnique({
    where: { slug },
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
      },
    },
  });

  if (!founder || !founder.emailVerified) {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const rank = await prisma.founder.count({
    where: { emailVerified: true, mrr: { gt: founder.mrr } },
  });

  const milestones = computeMilestones(founder.snapshots);

  const data = {
    slug: founder.slug,
    name: founder.name,
    twitter: founder.twitter,
    productName: founder.productName,
    productUrl: founder.productUrl,
    description: founder.description,
    mrr: founder.mrr,
    currency: founder.currency,
    rank: rank + 1,
    verified: founder.verified,
    featured: founder.featured,
    milestones,
    snapshots: founder.snapshots.map((s) => ({
      mrr: s.mrr,
      recordedAt: s.recordedAt.toISOString(),
    })),
    createdAt: founder.createdAt.toISOString(),
    updatedAt: founder.updatedAt.toISOString(),
  };

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

const MRR_MILESTONES = [100, 500, 1_000, 5_000, 10_000, 50_000, 100_000];

function computeMilestones(
  snapshots: { mrr: number; recordedAt: Date }[]
): { amount: number; reachedAt: string }[] {
  const sorted = [...snapshots].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );

  const reached: { amount: number; reachedAt: string }[] = [];

  for (const threshold of MRR_MILESTONES) {
    const thresholdCents = threshold * 100;
    const snapshot = sorted.find((s) => s.mrr >= thresholdCents);
    if (snapshot) {
      reached.push({
        amount: threshold,
        reachedAt: snapshot.recordedAt.toISOString(),
      });
    }
  }

  return reached;
}
