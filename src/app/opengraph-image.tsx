import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "pokrr — planning poker minimaliste";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 70,
              fontWeight: 800,
            }}
          >
            p
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            pokrr
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Planning poker minimaliste
          </div>
          <div style={{ fontSize: 32, color: "#a3a3a3" }}>
            Gratuit, sans pub, sans inscription
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          {["1", "2", "3", "5", "8", "13", "21", "?"].map((card) => (
            <div
              key={card}
              style={{
                width: 70,
                height: 96,
                border: "2px solid #404040",
                background: "#171717",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ededed",
              }}
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
