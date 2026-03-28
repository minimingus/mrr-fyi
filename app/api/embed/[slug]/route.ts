import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VerificationStatus } from "@prisma/client";

function formatCompactMRR(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${Math.round(amount)}`;
}

function formatDaysAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function buildSparklineSVG(values: number[], color: string): string {
  if (values.length < 2) return "";

  const width = 120;
  const height = 32;
  const padding = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const theme = req.nextUrl.searchParams.get("theme");
  const isDark = theme !== "light";

  const founder = await prisma.founder.findUnique({
    where: { slug },
    select: {
      name: true,
      productName: true,
      slug: true,
      mrr: true,
      currency: true,
      verified: true,
      featured: true,
      emailVerified: true,
      verificationStatus: true,
      mrrRangeMin: true,
      mrrRangeMax: true,
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 6,
        select: { mrr: true, recordedAt: true },
      },
    },
  });

  if (!founder || !founder.emailVerified) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rank =
    (await prisma.founder.count({ where: { emailVerified: true, mrr: { gt: founder.mrr } } })) + 1;

  const sparklineValues = [...founder.snapshots].reverse().map((s) => s.mrr);

  const c = isDark
    ? {
        bg: "#111113",
        border: "#27272a",
        text: "#fafafa",
        muted: "#71717a",
        dim: "#52525b",
        amber: "#f59e0b",
        emerald: "#10b981",
        yellow: "#eab308",
        zinc: "#a1a1aa",
      }
    : {
        bg: "#ffffff",
        border: "#e4e4e7",
        text: "#09090b",
        muted: "#71717a",
        dim: "#a1a1aa",
        amber: "#d97706",
        emerald: "#059669",
        yellow: "#ca8a04",
        zinc: "#71717a",
      };

  const verificationStatus = founder.verificationStatus ?? VerificationStatus.SELF_REPORTED;
  const isVerified = verificationStatus === VerificationStatus.VERIFIED;
  const isConnected = verificationStatus === VerificationStatus.CONNECTED;

  const name = escapeHtml(founder.name);
  const productName = escapeHtml(founder.productName);

  // MRR display: exact for VERIFIED, range for others if available
  let mrrDisplay: string;
  if (isVerified) {
    mrrDisplay = escapeHtml(formatCompactMRR(founder.mrr, founder.currency));
  } else if (founder.mrrRangeMin != null && founder.mrrRangeMax != null) {
    const lo = escapeHtml(formatCompactMRR(founder.mrrRangeMin, founder.currency));
    const hi = escapeHtml(formatCompactMRR(founder.mrrRangeMax, founder.currency));
    mrrDisplay = `${lo}–${hi}`;
  } else {
    mrrDisplay = escapeHtml(formatCompactMRR(founder.mrr, founder.currency));
  }

  const sparkline = buildSparklineSVG(sparklineValues, c.amber);

  // Trust badge
  let trustBadge: string;
  if (isVerified) {
    trustBadge = `<span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;background:${isDark ? "rgba(16,185,129,0.15)" : "rgba(5,150,105,0.1)"};color:${c.emerald};letter-spacing:0.05em;line-height:16px">✓ Stripe Verified</span>`;
  } else if (isConnected) {
    trustBadge = `<span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;background:${isDark ? "rgba(234,179,8,0.15)" : "rgba(202,138,4,0.1)"};color:${c.yellow};letter-spacing:0.05em;line-height:16px">◉ Connected</span>`;
  } else {
    trustBadge = `<span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;background:${isDark ? "rgba(161,161,170,0.15)" : "rgba(113,113,122,0.1)"};color:${c.zinc};letter-spacing:0.05em;line-height:16px">○ Self-reported</span>`;
  }

  // Last synced for verified
  const latestSnapshot = founder.snapshots[0];
  const lastSyncedLine = isVerified && latestSnapshot
    ? `<span class="last-synced">Synced ${escapeHtml(formatDaysAgo(latestSnapshot.recordedAt))}</span>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:transparent;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
    a{text-decoration:none;color:inherit}
    .card{display:block;padding:16px;border-radius:12px;border:1px solid ${c.border};background:${c.bg};min-width:280px;max-width:400px}
    .card:hover{border-color:${isDark ? "#3f3f46" : "#d4d4d8"}}
    .top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .info{min-width:0;flex:1}
    .product-row{display:flex;align-items:center;gap:6px}
    .product-name{font-size:15px;font-weight:600;color:${c.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .founder-name{font-size:12px;color:${c.muted};display:block;margin-top:2px}
    .mrr{font-size:20px;font-weight:700;color:${c.amber};font-variant-numeric:tabular-nums;font-family:"JetBrains Mono","SF Mono","Fira Code",monospace;white-space:nowrap;line-height:1}
    .mrr-unit{font-size:11px;font-weight:400;color:${c.muted}}
    .middle{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:12px}
    .rank{font-size:12px;color:${c.dim};font-variant-numeric:tabular-nums;white-space:nowrap}
    .footer{margin-top:12px;padding-top:10px;border-top:1px solid ${c.border};display:flex;align-items:center;justify-content:space-between}
    .tracked{font-size:10px;color:${c.dim};letter-spacing:0.03em}
    .tracked b{font-weight:600;color:${c.muted}}
    .last-synced{font-size:10px;color:${c.dim};letter-spacing:0.03em}
  </style>
</head>
<body>
  <a class="card" href="https://mrr.fyi/${founder.slug}" target="_blank" rel="noopener noreferrer">
    <div class="top">
      <div class="info">
        <div class="product-row">
          <span class="product-name">${productName}</span>
        </div>
        <span class="founder-name">${name}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="mrr">${mrrDisplay}<span class="mrr-unit">/mo</span></div>
        ${trustBadge}
      </div>
    </div>
    <div class="middle">
      ${sparkline}
      <span class="rank">Rank #${rank}</span>
    </div>
    <div class="footer">
      <div style="display:flex;flex-direction:column;gap:2px">
        <span class="tracked">Tracked on <b>MRR.fyi</b></span>
        ${lastSyncedLine}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${c.dim}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
    </div>
  </a>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
