import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";

type FaqItem = { q: string; a: string };

type PostEntry = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  translations?: Partial<Record<Lang, string>>;
  faq?: FaqItem[];
  load: () => Promise<{ default: ComponentType<MDXProps> }>;
};

export type Lang = "fr" | "en";

export const registry: Record<Lang, PostEntry[]> = {
  fr: [
    {
      slug: "tshirt-sizing-vs-fibonacci",
      title: "T-Shirt sizing vs Fibonacci : lequel choisir pour estimer vos stories ?",
      description: "Deux échelles d'estimation agile, deux usages différents. Comparaison directe, tableau, et stratégie pour utiliser les deux selon l'horizon : roadmap ou sprint.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { en: "tshirt-sizing-vs-fibonacci" },
      faq: [
        {
          q: "Peut-on convertir des estimations T-Shirt en story points ?",
          a: "Oui, avec une table de correspondance fixée par l'équipe (XS=1, S=2, M=3, L=5, XL=8 par exemple). Mais cette conversion introduit de l'arbitraire. Mieux vaut réévaluer les stories en Fibonacci quand elles entrent dans le sprint.",
        },
        {
          q: "Le T-Shirt sizing fonctionne-t-il en planning poker ?",
          a: "Oui, dans le même format : présenter la story, voter simultanément, révéler, discuter les écarts. Le vote simultané s'applique quelle que soit l'échelle.",
        },
        {
          q: "Quelle est la différence entre T-Shirt sizing et affinity estimation ?",
          a: "Le T-Shirt sizing s'utilise en vote simultané (planning poker). L'affinity estimation est un exercice de tri silencieux. Les deux sont des méthodes d'estimation relative avec des dynamiques de groupe très différentes.",
        },
      ],
      load: () => import("./fr/tshirt-sizing-vs-fibonacci.mdx"),
    },
    {
      slug: "fibonacci-planning-poker",
      title: "Pourquoi le planning poker utilise la suite de Fibonacci (et pas 1-2-3-4-5) ?",
      description: "Fibonacci, Modified Fibonacci, 20 ou 21 ? Le raisonnement derrière l'échelle des cartes de planning poker — et pourquoi une suite linéaire n'aurait aucun sens.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { en: "fibonacci-planning-poker" },
      faq: [
        {
          q: "Pourquoi certains decks vont jusqu'à 100 et d'autres s'arrêtent à 21 ?",
          a: "Les decks qui incluent 40, 100 ou ∞ permettent de traiter les epics et les stories trop grandes sans les découper arbitrairement pendant la session. Les decks qui s'arrêtent à 13 ou 21 obligent à replanifier si une story s'avère trop grande.",
        },
        {
          q: "Faut-il obligatoirement utiliser Fibonacci ?",
          a: "Non. Certaines équipes préfèrent le T-Shirt sizing, les puissances de 2 ou des échelles personnalisées. L'important est que l'échelle force des choix entre des valeurs suffisamment espacées pour refléter l'incertitude réelle.",
        },
        {
          q: "Est-ce que la valeur Fibonacci correspond à des heures ou des jours ?",
          a: "Non. Les story points Fibonacci mesurent la complexité relative d'une story par rapport aux autres, pas une durée absolue. C'est la vélocité de l'équipe sur plusieurs sprints qui donne la valeur prédictive.",
        },
        {
          q: "Pourquoi la carte ? est-elle importante ?",
          a: "Parce qu'elle est honnête. Quand un membre ne dispose pas des informations nécessaires pour estimer, jouer ? signale ce manque explicitement. Voter une valeur inventée pour ne pas ralentir la session est ce qui produit les mauvaises estimations.",
        },
      ],
      load: () => import("./fr/fibonacci-planning-poker.mdx"),
    },
    {
      slug: "comparatif-outils-planning-poker-gratuit",
      title: "Planning poker gratuit sans inscription : comparatif 2026 (pokrr, PlanITPoker, PointingPoker et autres)",
      description: "Tableau comparatif des 5 principaux outils de planning poker gratuits en ligne : inscription, limites, decks, pubs. Verdict par contexte d'équipe.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { en: "best-free-planning-poker-tools-comparison" },
      faq: [
        {
          q: "Quel outil de planning poker est vraiment gratuit sans limite ?",
          a: "PointingPoker et pokrr sont les deux outils sans limite de participants et sans limite de sessions en version gratuite. PointingPoker est financé par des publicités. pokrr ne l'est pas.",
        },
        {
          q: "Est-ce que PlanITPoker est vraiment gratuit ?",
          a: "Partiellement. La version gratuite est limitée à 7 participants par session. Au-delà, la version payante coûte 20 dollars par mois.",
        },
        {
          q: "Peut-on faire du planning poker sans créer de compte ?",
          a: "Oui. PointingPoker, pokrr, Scrum Poker Online (sans decks custom) et PlanningPoker.live permettent de créer et rejoindre une session sans inscription. Seul Parabol exige un compte.",
        },
        {
          q: "Quelle est la différence entre PlanningPoker.live et pokrr ?",
          a: "PlanningPoker.live propose plus d'intégrations (Jira, Linear, Zoom, Teams, Meet, Webex) et le vote asynchrone. pokrr est entièrement gratuit sans système de crédits, sans pubs, et sans limite de sessions ou de participants.",
        },
      ],
      load: () => import("./fr/comparatif-outils-planning-poker-gratuit.mdx"),
    },
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
      slug: "fibonacci-planning-poker",
      title: "Why Planning Poker Uses Fibonacci (and Not a Linear Scale)",
      description: "Fibonacci vs linear scale, the 20 vs 21 debate, modified Fibonacci. The real reasoning behind planning poker card values — and what each range means in practice.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { fr: "fibonacci-planning-poker" },
      faq: [
        {
          q: "Why do some decks go up to 100 and others stop at 21?",
          a: "Decks with 40, 100, or ∞ handle epics and oversized stories without forcing a split during the session. Decks stopping at 13 or 21 require rescheduling if a story is too large.",
        },
        {
          q: "Do we have to use Fibonacci?",
          a: "No. T-shirt sizing, powers of 2, and custom scales all work. What matters is that the scale forces choices between values spaced far enough apart to reflect genuine estimation uncertainty.",
        },
        {
          q: "Do Fibonacci values correspond to hours or days?",
          a: "No. Story points measure relative complexity compared to other stories — not absolute duration. The team's velocity across multiple sprints is what gives estimates predictive value.",
        },
        {
          q: "Why does the ? card matter?",
          a: "Because it's honest. When a team member lacks information to estimate, playing ? signals that gap explicitly. Inventing a number to avoid slowing the session is what produces bad estimates.",
        },
      ],
      load: () => import("./en/fibonacci-planning-poker.mdx"),
    },
    {
      slug: "tshirt-sizing-vs-fibonacci",
      title: "T-Shirt Sizing vs Fibonacci: Which Should You Use for Story Estimation?",
      description: "Two agile estimation scales, two different uses. Direct comparison, table, and strategy for using both depending on the horizon: roadmap or sprint.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { fr: "tshirt-sizing-vs-fibonacci" },
      faq: [
        {
          q: "Can T-shirt estimates be converted to story points?",
          a: "Yes, with a fixed conversion table (e.g. XS=1, S=2, M=3, L=5, XL=8). But this introduces arbitrariness. Better to re-estimate in Fibonacci when stories enter the sprint.",
        },
        {
          q: "Does T-shirt sizing work in planning poker?",
          a: "Yes, same format: present the story, vote simultaneously, reveal, discuss divergence. Simultaneous voting applies regardless of the scale used.",
        },
        {
          q: "What's the difference between T-shirt sizing and affinity estimation?",
          a: "T-shirt sizing uses simultaneous voting (planning poker). Affinity estimation is a silent sorting exercise. Both are relative estimation methods with very different group dynamics.",
        },
      ],
      load: () => import("./en/tshirt-sizing-vs-fibonacci.mdx"),
    },
    {
      slug: "best-free-planning-poker-tools-comparison",
      title: "Free Planning Poker With No Signup: 2026 Comparison (pokrr, PlanITPoker, PointingPoker and more)",
      description: "Verified comparison of 5 free online planning poker tools: signup requirements, participant limits, decks, ads. Context-based verdict.",
      publishedAt: "2026-05-31",
      updatedAt: "2026-05-31",
      translations: { fr: "comparatif-outils-planning-poker-gratuit" },
      faq: [
        {
          q: "Which planning poker tool is genuinely free with no limits?",
          a: "PointingPoker and pokrr are the two tools with no participant limit and no session limit in their free versions. PointingPoker is ad-funded. pokrr is not.",
        },
        {
          q: "Is PlanITPoker really free?",
          a: "Partially. The free version is capped at 7 participants per session. Beyond that, the paid version costs $20 per month.",
        },
        {
          q: "Can you run planning poker without creating an account?",
          a: "Yes. PointingPoker, pokrr, Scrum Poker Online (without custom decks), and PlanningPoker.live all let you create and join a session without signing up. Only Parabol requires an account.",
        },
        {
          q: "What's the difference between PlanningPoker.live and pokrr?",
          a: "PlanningPoker.live offers more integrations (Jira, Linear, Zoom, Teams, Meet, Webex) and async voting. pokrr is entirely free with no credit system, no ads, and no session or participant limits.",
        },
      ],
      load: () => import("./en/best-free-planning-poker-tools-comparison.mdx"),
    },
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
