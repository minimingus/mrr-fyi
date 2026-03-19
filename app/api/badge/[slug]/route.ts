import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BADGE_HEIGHT = 20;
const LABEL = "MRR";
const FONT_FAMILY = "DejaVu Sans,Verdana,Geneva,sans-serif";
const FONT_SIZE = 11;
const CHAR_WIDTH = 6.8;
const PAD_X = 6;

function estimateTextWidth(text: string): number {
  return Math.ceil(text.length * CHAR_WIDTH) + PAD_X * 2;
}

function formatBadgeMRR(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${Math.round(amount)}`;
}

function renderBadgeSVG(label: string, value: string): string {
  const labelWidth = estimateTextWidth(label);
  const valueWidth = estimateTextWidth(value);
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${BADGE_HEIGHT}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${BADGE_HEIGHT}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${BADGE_HEIGHT}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${BADGE_HEIGHT}" fill="#4c1"/>
    <rect width="${totalWidth}" height="${BADGE_HEIGHT}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="${FONT_FAMILY}" text-rendering="geometricPrecision" font-size="${FONT_SIZE}">
    <text x="${labelWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="13">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="13">${value}</text>
  </g>
</svg>`;
}

function notFoundSVG(): string {
  return renderBadgeSVG("MRR", "not found");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const founder = await prisma.founder.findUnique({
      where: { slug },
      select: { mrr: true, currency: true },
    });

    if (!founder) {
      return new NextResponse(notFoundSVG(), {
        status: 404,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache, no-store",
        },
      });
    }

    const value = formatBadgeMRR(founder.mrr, founder.currency);
    const svg = renderBadgeSVG(LABEL, value);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[badge]", err);
    return new NextResponse(notFoundSVG(), {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store",
      },
    });
  }
}
