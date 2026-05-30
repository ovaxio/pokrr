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
      slug: "planning-poker-sans-inscription",
      title: "Planning poker sans inscription : pourquoi c'est le seul critère qui compte en mission client",
      description: "Quand vous imposez un outil avec création de compte à une équipe client, vous perdez avant même d'avoir commencé. Voilà pourquoi.",
      date: "2026-05-30",
    },
  ],
  en: [],
};

// Explicit import map — avoids dynamic path resolution issues with Turbopack
export const importers: Record<Lang, Record<string, () => Promise<{ default: React.ComponentType; meta?: PostMeta }>>> = {
  fr: {
    "planning-poker-sans-inscription": () =>
      import("./fr/planning-poker-sans-inscription.mdx") as Promise<{ default: React.ComponentType; meta?: PostMeta }>,
  },
  en: {},
};
