import type { ComponentType } from "react";

export type PostEntry = {
  slug: string;
  title: string;
  description: string;
  date: string;
  load: () => Promise<{ default: ComponentType }>;
};

export type Lang = "fr" | "en";

export const registry: Record<Lang, PostEntry[]> = {
  fr: [
    {
      slug: "choisir-outil-planning-poker-mission",
      title: "Comment choisir son outil de planning poker en mission client",
      description: "Il existe 20 outils de planning poker. La plupart se ressemblent sur les features. Ils ne se ressemblent pas sur ce qui fait échouer une session.",
      date: "2026-05-30",
      load: () => import("./fr/choisir-outil-planning-poker-mission.mdx"),
    },
  ],
  en: [
    {
      slug: "how-to-choose-planning-poker-tool",
      title: "How to choose a planning poker tool for client projects",
      description: "There are 20+ planning poker tools. Most look the same on features. They don't look the same on what actually breaks a session.",
      date: "2026-05-30",
      load: () => import("./en/how-to-choose-planning-poker-tool.mdx"),
    },
  ],
};

export function getPosts(lang: Lang): PostEntry[] {
  return registry[lang] ?? [];
}

export function getPost(lang: Lang, slug: string): PostEntry | null {
  return getPosts(lang).find((p) => p.slug === slug) ?? null;
}
