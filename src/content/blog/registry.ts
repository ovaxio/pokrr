export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
};

export type Lang = "fr" | "en";

export const posts: Record<Lang, PostMeta[]> = {
  fr: [
    {
      slug: "choisir-outil-planning-poker-mission",
      title: "Comment choisir son outil de planning poker en mission client",
      description: "Il existe 20 outils de planning poker. La plupart se ressemblent sur les features. Ils ne se ressemblent pas sur ce qui fait échouer une session.",
      date: "2026-05-30",
    },
  ],
  en: [],
};

// Explicit import map — avoids dynamic path resolution issues with Turbopack
export const importers: Record<Lang, Record<string, () => Promise<{ default: React.ComponentType; meta?: PostMeta }>>> = {
  fr: {
    "choisir-outil-planning-poker-mission": () =>
      import("./fr/choisir-outil-planning-poker-mission.mdx") as Promise<{ default: React.ComponentType; meta?: PostMeta }>,
  },
  en: {},
};
