import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://pokrr.app",
      lastModified: new Date("2026-05-27"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
