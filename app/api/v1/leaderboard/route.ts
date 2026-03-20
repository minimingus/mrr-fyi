import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { key: "api-leaderboard", limit: 60, windowSec: 60 });
  if (limited) return limited;

  const founders = await prisma.founder.findMany({
    where: { emailVerified: true },
    orderBy: [{ featured: "desc" }, { mrr: "desc" }],
    take: 50,
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 2,
      },
    },
  });

  const data = founders.map((f, i) => {
    const currentMrr = f.mrr;
    const previousMrr = f.snapshots[1]?.mrr ?? null;
    const growthPercent =
      previousMrr && previousMrr > 0
        ? Math.round(((currentMrr - previousMrr) / previousMrr) * 100)
        : null;

    return {
      rank: i + 1,
      slug: f.slug,
      name: f.name,
      twitter: f.twitter,
      productName: f.productName,
      productUrl: f.productUrl,
      description: f.description,
      mrr: currentMrr,
      currency: f.currency,
      growthPercent,
      verified: f.verified,
      featured: f.featured,
      updatedAt: f.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(
    { data, meta: { count: data.length, generatedAt: new Date().toISOString() } },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
