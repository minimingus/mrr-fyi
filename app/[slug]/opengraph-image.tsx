import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const productName = "Test Product";
  const name = "Test Founder";
  const mrr = "$1,200";

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
        {/* Top: branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#f59e0b", fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em" }}>
            MRR.fyi
          </span>
          <span style={{ color: "#52525b", fontSize: "14px" }}>indie revenue leaderboard</span>
        </div>

        {/* Middle: main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#f59e0b", fontSize: "72px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mrr}
            <span style={{ color: "#71717a", fontSize: "32px", fontWeight: 400 }}>/mo</span>
          </div>
          <div style={{ color: "#fafafa", fontSize: "48px", fontWeight: 600 }}>
            {productName}
          </div>
          <div style={{ color: "#71717a", fontSize: "24px" }}>
            by {name}
          </div>
        </div>

        {/* Bottom: url */}
        <div style={{ color: "#52525b", fontSize: "18px" }}>
          mrr.fyi/{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
