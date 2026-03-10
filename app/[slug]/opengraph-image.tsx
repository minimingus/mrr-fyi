import { ImageResponse } from "next/og";

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
