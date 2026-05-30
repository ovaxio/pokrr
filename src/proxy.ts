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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  const pathLocale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  // Forward locale to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", pathLocale ?? defaultLocale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

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
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
