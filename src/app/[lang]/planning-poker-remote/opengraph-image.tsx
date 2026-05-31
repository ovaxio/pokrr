import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const labels: Record<string, { title: string; sub: string }> = {
  fr: {
    title: "Planning poker en remote",
    sub: "Lancez votre session en moins de 60 secondes. Gratuit, sans inscription.",
  },
  en: {
    title: "Remote Planning Poker",
    sub: "Start your session in under 60 seconds. Free, no signup.",
  },
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = labels[lang] ?? labels.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 96px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)",
          color: "#ededed",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 12, background: "#4f46e5",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 36, fontWeight: 800,
            }}
          >
            p
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em" }}>pokrr</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "#f5f5f5" }}>
            {t.title}
          </div>
          <div style={{ fontSize: 30, color: "#a3a3a3", lineHeight: 1.4 }}>
            {t.sub}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "#737373" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f46e5" }} />
          pokrr.app
        </div>
      </div>
    ),
    { ...size },
  );
}
