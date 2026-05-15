import type { NextConfig } from "next";

const partyKitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const isLocalPK = partyKitHost.startsWith("localhost");
const partyKitWS = `${isLocalPK ? "ws" : "wss"}://${partyKitHost}`;
const isProd = process.env.NODE_ENV === "production";

// CSP : 'unsafe-inline' est conservé pour les inline scripts de Next App Router
// (__next_f.push) et les styles Tailwind injectés. Une vraie politique nonce-based
// nécessiterait un middleware ; gardée pour V2.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${partyKitWS}${isProd ? "" : " ws://localhost:* http://localhost:*"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
