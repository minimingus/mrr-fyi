import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { key: "api-leaderboard", limit: 60, windowSec: 60 });
  if (limited) return limited;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  const category = searchParams.get("category")?.toUpperCase() || undefined;

  const where = {
    emailVerified: true as const,
    ...(category ? { category: category as "SAAS" | "ECOMMERCE" | "AGENCY" | "CREATOR" | "MARKETPLACE" | "DEV_TOOLS" | "OTHER" } : {}),
  };

  const [total, founders] = await Promise.all([
    prisma.founder.count({ where }),
    prisma.founder.findMany({
      where,
      orderBy: [{ featured: "desc" }, { mrr: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        snapshots: {
          orderBy: { recordedAt: "desc" },
          take: 2,
        },
      },
    }),
  ]);

  const offset = (page - 1) * limit;

  const data = founders.map((f, i) => {
    const currentMrr = f.mrr;
    const previousMrr = f.snapshots[1]?.mrr ?? null;
    const growthPercent =
      previousMrr && previousMrr > 0
        ? Math.round(((currentMrr - previousMrr) / previousMrr) * 100)
        : null;

    return {
      rank: offset + i + 1,
      slug: f.slug,
      name: f.name,
      twitter: f.twitter,
      avatarUrl: f.avatarUrl,
      productName: f.productName,
      productUrl: f.productUrl,
      description: f.description,
      category: f.category,
      mrr: currentMrr,
      currency: f.currency,
      growthPercent,
      verified: f.verified,
      featured: f.featured,
      updatedAt: f.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(
    {
      data,
      meta: {
        total,
        page,
        limit,
        hasMore: offset + founders.length < total,
        generatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
