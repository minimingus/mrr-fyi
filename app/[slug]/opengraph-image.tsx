import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatMRR } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const founder = await prisma.founder.findUnique({
    where: { slug },
    select: {
      productName: true,
      name: true,
      mrr: true,
      currency: true,
      emailVerified: true,
      avatarUrl: true,
      verified: true,
    },
  });

  if (founder && !founder.emailVerified) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#0f0f0f" }} />, { ...size });
  }

  const productName = founder?.productName ?? "Unknown";
  const name = founder?.name ?? "";
  const mrr = founder ? formatMRR(founder.mrr, founder.currency) : "$0";
  const isVerified = founder?.verified ?? false;
  const avatarUrl = founder?.avatarUrl ?? null;

  // Calculate rank
  const rank = founder
    ? await prisma.founder.count({ where: { emailVerified: true, mrr: { gt: founder.mrr } } }) + 1
    : null;

  const rankLabel = rank === 1 ? "🥇 #1" : rank === 2 ? "🥈 #2" : rank === 3 ? "🥉 #3" : rank ? `#${rank}` : null;

  // Generate initials fallback
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Attempt to fetch avatar as base64 for reliable rendering
  let avatarSrc: string | null = null;
  if (avatarUrl) {
    try {
      const res = await fetch(avatarUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        avatarSrc = `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
      }
    } catch {
      // fall through to initials
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f0f0f",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: Logo + Rank badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#f59e0b", fontSize: "20px", fontWeight: 700, marginRight: "10px" }}>
              MRR.fyi
            </span>
            <span style={{ color: "#52525b", fontSize: "16px" }}>verified founder profiles</span>
          </div>
          {rankLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: rank && rank <= 3 ? "rgba(245,158,11,0.15)" : "rgba(39,39,42,0.8)",
                border: `1px solid ${rank && rank <= 3 ? "#f59e0b" : "#3f3f46"}`,
                borderRadius: "8px",
                padding: "8px 16px",
              }}
            >
              <span
                style={{
                  color: rank && rank <= 3 ? "#f59e0b" : "#a1a1aa",
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                {rankLabel}
              </span>
              <span style={{ color: "#52525b", fontSize: "14px" }}>verified profile</span>
            </div>
          )}
        </div>

        {/* Middle: Founder info */}
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "60px",
              overflow: "hidden",
              flexShrink: 0,
              background: "#1c1c1c",
              border: "3px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                width={120}
                height={120}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#f59e0b", fontSize: "44px", fontWeight: 700 }}>
                {initials || "?"}
              </span>
            )}
          </div>

          {/* Name + Product + Verified */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#fafafa", fontSize: "42px", fontWeight: 700 }}>
                {productName}
              </span>
              {isVerified && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#1a1a2e",
                    border: "1px solid #3b3b8a",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "#818cf8", fontSize: "14px", fontWeight: 600 }}>
                    ✓ Stripe Verified
                  </span>
                </div>
              )}
            </div>
            <span style={{ color: "#71717a", fontSize: "24px" }}>by {name}</span>
          </div>
        </div>

        {/* Bottom: MRR + URL */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ color: "#f59e0b", fontSize: "80px", fontWeight: 700, lineHeight: 1 }}>
              {mrr}
            </span>
            <span style={{ color: "#71717a", fontSize: "32px" }}>/mo</span>
          </div>
          <span style={{ color: "#3f3f46", fontSize: "18px" }}>mrr.fyi/{slug}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
