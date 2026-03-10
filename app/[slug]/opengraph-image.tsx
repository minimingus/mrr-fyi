import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatMRR } from "@/lib/utils";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const founder = await prisma.founder.findUnique({
    where: { slug },
    select: { productName: true, name: true, mrr: true, currency: true },
  });

  const productName = founder?.productName ?? "Unknown";
  const name = founder?.name ?? "";
  const mrr = founder ? formatMRR(founder.mrr, founder.currency) : "$0";

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
          <span style={{ color: "#f59e0b", fontSize: "18px", fontWeight: 700, marginRight: "8px" }}>
            MRR.fyi
          </span>
          <span style={{ color: "#52525b", fontSize: "14px" }}>indie revenue leaderboard</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: "16px" }}>
            <span style={{ color: "#f59e0b", fontSize: "72px", fontWeight: 700 }}>{mrr}</span>
            <span style={{ color: "#71717a", fontSize: "32px", fontWeight: 400, marginLeft: "4px" }}>/mo</span>
          </div>
          <div style={{ display: "flex", color: "#fafafa", fontSize: "48px", fontWeight: 600, marginBottom: "12px" }}>
            {productName}
          </div>
          <div style={{ display: "flex", color: "#71717a", fontSize: "24px" }}>
            by {name}
          </div>
        </div>

        <div style={{ display: "flex", color: "#52525b", fontSize: "18px" }}>
          mrr.fyi/{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
