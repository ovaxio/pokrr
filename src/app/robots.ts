import type { MetadataRoute } from "next";
import { locales } from "@/i18n/shared";

const SITE_URL = "https://pokrr.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...locales.map((l) => `/${l}/room/`),
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
