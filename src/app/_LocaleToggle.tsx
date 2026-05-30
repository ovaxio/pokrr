"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, defaultLocale } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";

export default function LocaleToggle() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = (locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  ) ?? defaultLocale) as Locale;

  const nextLocale: Locale = currentLocale === "fr" ? "en" : "fr";

  const switchLocale = () => {
    const withoutLocale = pathname.startsWith(`/${currentLocale}`)
      ? pathname.slice(`/${currentLocale}`.length) || "/"
      : pathname;
    router.push(`/${nextLocale}${withoutLocale === "/" ? "" : withoutLocale}`);
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      aria-label={nextLocale === "en" ? "Switch to English" : "Passer en français"}
      className="inline-flex items-center rounded border border-token bg-surface px-2 py-1 text-xs font-medium text-fg-soft transition hover:bg-surface-2"
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
