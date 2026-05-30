import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INVITES: Record<string, string> = {
  fr: "Tu es invité à rejoindre la salle",
  en: "You're invited to join the room",
};
const FOOTERS: Record<string, string> = {
  fr: "Planning poker gratuit, sans inscription",
  en: "Free planning poker, no account required",
};

export const alt = "pokrr — planning poker room";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<Record<string, string>>;
}) {
  const { lang, code } = await params;
  const invite = INVITES[lang] ?? INVITES.fr;
  const footer = FOOTERS[lang] ?? FOOTERS.fr;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "80px 96px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)",
          color: "#ededed", fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: 16, background: "#4f46e5",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 52, fontWeight: 800,
            }}
          >
            p
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.03em" }}>pokrr</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 36, color: "#a3a3a3", fontWeight: 500 }}>{invite}</div>
          <div
            style={{
              fontSize: 96, fontWeight: 800, letterSpacing: "0.12em", color: "#ededed",
              background: "#1f1f23", border: "2px solid #404040", borderRadius: 16,
              padding: "20px 48px", display: "inline-flex", alignSelf: "flex-start",
            }}
          >
            {code.toUpperCase()}
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#737373" }}>{footer}</div>
      </div>
    ),
    { ...size },
  );
}
