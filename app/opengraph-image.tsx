import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatMRR } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [founderCount, topFounders] = await Promise.all([
    prisma.founder.count(),
    prisma.founder.findMany({
      orderBy: { mrr: "desc" },
      take: 3,
      select: { productName: true, mrr: true, currency: true },
    }),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: "#f59e0b", fontSize: "24px", fontWeight: 700, marginRight: "12px" }}>
            MRR.fyi
          </span>
          <span style={{ color: "#52525b", fontSize: "18px" }}>indie revenue leaderboard</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#fafafa", fontSize: "56px", fontWeight: 700, marginBottom: "24px" }}>
            Public Indie Revenue Leaderboard
          </div>
          <div style={{ display: "flex", color: "#71717a", fontSize: "24px", marginBottom: "32px" }}>
            {founderCount} founders building in public
          </div>

          {topFounders.length > 0 && (
            <div style={{ display: "flex", gap: "16px" }}>
              {topFounders.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#111113",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    padding: "12px 20px",
                  }}
                >
                  <span style={{ color: "#52525b", fontSize: "18px", fontWeight: 600 }}>#{i + 1}</span>
                  <span style={{ color: "#fafafa", fontSize: "18px", fontWeight: 500 }}>{f.productName}</span>
                  <span style={{ color: "#f59e0b", fontSize: "18px", fontWeight: 700 }}>
                    {formatMRR(f.mrr, f.currency)}/mo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", color: "#52525b", fontSize: "18px" }}>
          mrr.fyi — Real MRR from real indie hackers
        </div>
      </div>
    ),
    { ...size }
  );
}
