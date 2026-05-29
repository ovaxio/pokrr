import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "pokrr — salle de planning poker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)",
          color: "#ededed",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            p
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.03em" }}>
            pokrr
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 36, color: "#a3a3a3", fontWeight: 500 }}>
            Tu es invité à rejoindre la salle
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#ededed",
              background: "#1f1f23",
              border: "2px solid #404040",
              borderRadius: 16,
              padding: "20px 48px",
              display: "inline-flex",
              alignSelf: "flex-start",
            }}
          >
            {code.toUpperCase()}
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#737373" }}>
          Planning poker gratuit, sans inscription
        </div>
      </div>
    ),
    { ...size },
  );
}
