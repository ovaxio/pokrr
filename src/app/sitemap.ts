import type { MetadataRoute } from "next";
import { locales } from "@/i18n/shared";
import { registry } from "@/content/blog/registry";

const SITE_URL = "https://pokrr.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const langAlternates = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`]));

  const homePages: MetadataRoute.Sitemap = locales.map((lang) => ({
    url: `${SITE_URL}/${lang}`,
    lastModified: new Date("2026-05-31"),
    changeFrequency: "monthly" as const,
    priority: 1,
    alternates: { languages: langAlternates },
  }));

  const blogIndexPages: MetadataRoute.Sitemap = locales.map((lang) => ({
    url: `${SITE_URL}/${lang}/blog`,
    lastModified: new Date("2026-05-31"),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPostPages: MetadataRoute.Sitemap = locales.flatMap((lang) =>
    (registry[lang] ?? []).map((post) => ({
      url: `${SITE_URL}/${lang}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  );

  return [...homePages, ...blogIndexPages, ...blogPostPages];
}
