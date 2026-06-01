import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  for (const segment of acceptLanguage.split(",")) {
    const lang = segment.split(";")[0].trim().toLowerCase().split("-")[0];
    if ((locales as string[]).includes(lang)) return lang as Locale;
  }
  return defaultLocale;
}

const SKIP_PATTERN = /^\/(api\/|_next\/|favicon\.ico|robots\.txt|sitemap\.xml|llms\.txt|icon\.svg|.*opengraph-image)/;

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const partyKitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
  const isLocalPK = partyKitHost.startsWith("localhost");
  const partyKitWS = `${isLocalPK ? "ws" : "wss"}://${partyKitHost}`;
  const impeccableDev = isDev ? " http://localhost:8400" : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}${impeccableDev}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${partyKitWS} https://vitals.vercel-insights.com${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  const pathLocale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", pathLocale ?? defaultLocale);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  if (host.endsWith(".vercel.app")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Redirect unlocalized user-facing paths to locale-prefixed version
  if (!pathLocale && !SKIP_PATTERN.test(pathname)) {
    const detected = detectLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
