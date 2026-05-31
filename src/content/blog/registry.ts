import type { ComponentType } from "react";

export type FaqItem = { q: string; a: string };

export type PostEntry = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  translations?: Partial<Record<Lang, string>>;
  faq?: FaqItem[];
  load: () => Promise<{ default: ComponentType }>;
};

export type Lang = "fr" | "en";

export const registry: Record<Lang, PostEntry[]> = {
  fr: [
    {
      slug: "guide-complet-planning-poker",
      title: "Le guide complet du Planning Poker (2026) : méthode, règles et outil gratuit sans inscription",
      description: "Planning poker : définition, règles du vote, pourquoi Fibonacci, et comment lancer une session gratuite en ligne sans créer de compte. Le guide pratique pour équipes Scrum.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { en: "complete-guide-planning-poker" },
      faq: [
        {
          q: "Combien de temps dure une session de planning poker ?",
          a: "Pour 8 à 10 stories avec une équipe de 5 à 7 personnes : 45 à 60 minutes. Une session de backlog refinement complète (20 à 25 stories) dure 90 à 120 minutes. Au-delà, la qualité des estimations baisse.",
        },
        {
          q: "Qui doit participer au planning poker ?",
          a: "L'équipe de développement : développeurs, QA, designers impliqués dans les stories. Le product owner participe pour répondre aux questions de clarification mais ne vote généralement pas. Le scrum master facilite sans voter.",
        },
        {
          q: "Que faire si l'équipe ne trouve pas de consensus ?",
          a: "Deux options : adopter la médiane et avancer, ou fractionner la story. Si après deux tours de discussion l'écart reste fort, la story est probablement trop grande ou trop ambiguë pour être estimée telle quelle.",
        },
        {
          q: "Quelle est la différence entre story points et jours-homme ?",
          a: "Les story points mesurent la complexité relative d'une story par rapport aux autres. Une story à 5 points signifie qu'elle est deux fois et demi plus complexe qu'une story à 2 points, pas qu'elle prend 5 heures ou 5 jours.",
        },
        {
          q: "Peut-on faire du planning poker sans inscription ?",
          a: "Oui. pokrr.app ne demande ni compte ni email. Un code de salle partagé dans Slack ou Teams, et chaque participant rejoint en moins de 30 secondes depuis n'importe quel navigateur.",
        },
        {
          q: "Peut-on faire du planning poker en asynchrone ?",
          a: "Oui. Certains outils permettent de voter sans que tout le monde soit connecté simultanément. Cela convient aux équipes distribuées sur plusieurs fuseaux horaires. La discussion après révélation doit alors se faire par écrit.",
        },
      ],
      load: () => import("./fr/guide-complet-planning-poker.mdx"),
    },
    {
      slug: "choisir-outil-planning-poker-mission",
      title: "Comment choisir son outil de planning poker en mission client",
      description: "Il existe 20 outils de planning poker. La plupart se ressemblent sur les features. Ils ne se ressemblent pas sur ce qui fait échouer une session.",
      publishedAt: "2026-05-30",
      updatedAt: "2026-05-30",
      translations: { en: "how-to-choose-planning-poker-tool" },
      faq: [
        {
          q: "Quelle est la différence entre le planning poker Fibonacci et le T-Shirt sizing ?",
          a: "Fibonacci (1, 2, 3, 5, 8, 13, 21…) s'utilise pour estimer la complexité en story points. Le T-Shirt sizing (XS, S, M, L, XL) est plus accessible pour les équipes qui débutent, ou pour des livrables difficiles à chiffrer en points.",
        },
        {
          q: "Combien de participants peut-on avoir dans une session de planning poker en ligne ?",
          a: "Il n'y a pas de limite fixe sur la plupart des outils gratuits. En pratique, une session fonctionne bien entre 4 et 12 participants.",
        },
        {
          q: "Est-ce qu'on peut faire du planning poker sans scrum master ?",
          a: "Oui. Le rôle d'animateur peut tourner dans l'équipe. Il faut simplement quelqu'un pour gérer les discussions quand les écarts sont importants, et quelqu'un pour décider quand passer à la story suivante.",
        },
      ],
      load: () => import("./fr/choisir-outil-planning-poker-mission.mdx"),
    },
  ],
  en: [
    {
      slug: "complete-guide-planning-poker",
      title: "The Complete Planning Poker Guide (2026): Rules, Method & Free Online Tool, No Signup",
      description: "Planning poker explained: definition, voting rules, why Fibonacci, and how to run a free online session with no account. The practical guide for Scrum and agile teams.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { fr: "guide-complet-planning-poker" },
      faq: [
        {
          q: "How long does a planning poker session take?",
          a: "For 8 to 10 stories with a team of 5 to 7 people: 45 to 60 minutes. A full backlog refinement session (20 to 25 stories) runs 90 to 120 minutes. Beyond that, estimate quality drops.",
        },
        {
          q: "Who should participate in planning poker?",
          a: "The development team: developers, QA, designers involved in the stories. The product owner participates to answer clarifying questions but typically doesn't vote. The scrum master facilitates without voting.",
        },
        {
          q: "What to do when the team can't reach consensus?",
          a: "Two options: adopt the median and move on, or split the story. If after two discussion rounds the spread is still large, the story is likely too large or too ambiguous to estimate as written.",
        },
        {
          q: "What's the difference between story points and man-hours?",
          a: "Story points measure the relative complexity of a story compared to others. A 5-point story is two and a half times more complex than a 2-point story, not 5 hours or 5 days.",
        },
        {
          q: "Can I run planning poker with no account?",
          a: "Yes. pokrr.app requires no account or email. A room code shared in Slack or Teams, and every participant joins in under 30 seconds from any browser on any device.",
        },
        {
          q: "Can planning poker be done asynchronously?",
          a: "Yes. Some tools allow voting without everyone being connected at the same time. This works for teams distributed across time zones. The trade-off: post-reveal discussion has to happen in writing, which extends the cycle.",
        },
      ],
      load: () => import("./en/complete-guide-planning-poker.mdx"),
    },
    {
      slug: "how-to-choose-planning-poker-tool",
      title: "How to choose a planning poker tool for client projects",
      description: "There are 20+ planning poker tools. Most look the same on features. They don't look the same on what actually breaks a session.",
      publishedAt: "2026-05-30",
      updatedAt: "2026-05-30",
      translations: { fr: "choisir-outil-planning-poker-mission" },
      faq: [
        {
          q: "What's the difference between Fibonacci and T-Shirt sizing in planning poker?",
          a: "Fibonacci (1, 2, 3, 5, 8, 13, 21…) is used to estimate complexity in story points. T-Shirt sizing (XS, S, M, L, XL) is more accessible for teams new to estimation, or for deliverables that are hard to quantify in points.",
        },
        {
          q: "How many participants can join an online planning poker session?",
          a: "There's no hard limit on most free tools. In practice, a session works well with 4 to 12 participants.",
        },
        {
          q: "Can you run planning poker without a scrum master?",
          a: "Yes. The facilitator role can rotate within the team. Someone needs to manage the discussion when estimates diverge significantly, and decide when to move to the next story.",
        },
      ],
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
