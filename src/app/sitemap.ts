import type { MetadataRoute } from "next";
import { locales } from "@/i18n/shared";

const SITE_URL = "https://pokrr.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((lang) => ({
    url: `${SITE_URL}/${lang}`,
    lastModified: new Date("2026-05-30"),
    changeFrequency: "monthly" as const,
    priority: 1,
  }));
}
