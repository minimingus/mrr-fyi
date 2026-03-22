import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatMRR } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ~7.2px per char at font-size 12 monospace
const CHAR_WIDTH = 7.2;
const PADDING = 12;
const DIVIDER_GAP = 8;
const HEIGHT = 28;
const LABEL = "MRR.fyi";

function buildSVG(mrrLabel: string, productName: string): string {
  const labelWidth = Math.ceil(LABEL.length * CHAR_WIDTH);
  const valueWidth = Math.ceil(mrrLabel.length * CHAR_WIDTH);
  const dividerX = PADDING + labelWidth + DIVIDER_GAP;
  const totalWidth = dividerX + 1 + DIVIDER_GAP + valueWidth + PADDING;
  const midY = Math.round(HEIGHT / 2) + 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${HEIGHT}" role="img" aria-label="${productName} MRR: ${mrrLabel}">
  <title>${productName}: ${mrrLabel}</title>
  <rect width="${totalWidth}" height="${HEIGHT}" rx="5" fill="#0d0d0d"/>
  <rect x="${dividerX}" y="6" width="1" height="${HEIGHT - 12}" fill="#333333"/>
  <text x="${PADDING}" y="${midY}" font-family="monospace,Menlo,'Courier New'" font-size="12" fill="#888888">${LABEL}</text>
  <text x="${dividerX + DIVIDER_GAP + 1}" y="${midY}" font-family="monospace,Menlo,'Courier New'" font-size="12" font-weight="600" fill="#f59e0b">${mrrLabel}</text>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const founder = await prisma.founder.findUnique({
    where: { slug },
    select: { mrr: true, currency: true, productName: true, emailVerified: true },
  });

  if (!founder || !founder.emailVerified) {
    return new NextResponse("Not found", { status: 404 });
  }

  const mrrLabel = formatMRR(founder.mrr, founder.currency) + "/mo";
  const svg = buildSVG(mrrLabel, founder.productName);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
    },
  });
}
