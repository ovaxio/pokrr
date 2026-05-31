import { ImageResponse } from "next/og";
import { getPost, type Lang } from "@/content/blog/registry";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOGImage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const post = getPost(lang as Lang, slug);
  const title = post?.title ?? "pokrr — Planning Poker";

  // Truncate title for display: split into two lines at a natural word boundary
  const words = title.split(" ");
  let line1 = "";
  let line2 = "";
  for (const word of words) {
    if ((line1 + " " + word).trim().length <= 42) {
      line1 = (line1 + " " + word).trim();
    } else {
      line2 = (line2 + " " + word).trim();
    }
  }
  if (line2.length > 52) {
    line2 = line2.slice(0, 50) + "…";
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
          padding: "72px 96px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)",
          color: "#ededed",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            p
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em" }}>
            pokrr
          </div>
        </div>

        {/* Article title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: line1.length > 32 ? 44 : 52,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#f5f5f5",
            }}
          >
            {line1}
          </div>
          {line2 && (
            <div
              style={{
                fontSize: line1.length > 32 ? 44 : 52,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: "#a3a3a3",
              }}
            >
              {line2}
            </div>
          )}
        </div>

        {/* Bottom: blog label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 26,
            color: "#737373",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4f46e5",
            }}
          />
          Blog · pokrr.app
        </div>
      </div>
    ),
    { ...size },
  );
}
