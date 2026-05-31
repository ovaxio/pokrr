import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";

const SITE_URL = "https://pokrr.app";

type Props = { params: Promise<{ lang: string }> };

const content = {
  fr: {
    metaTitle: "Planning Poker Scrum : estimez votre backlog sprint en équipe, sans friction",
    metaDescription:
      "Outil de planning poker pour équipes Scrum. Fibonacci, vote simultané, rôle admin pour le Scrum Master. Gratuit, sans inscription, sans limite de sessions.",
    title: "Planning poker Scrum : estimez votre backlog sans alourdir la cérémonie",
    lead1:
      "Le sprint planning ou le backlog refinement dure déjà assez longtemps.",
    lead2:
      "L'outil de planning poker ne doit pas en rajouter : pas d'inscription pour l'équipe, pas de configuration entre deux sprints, pas de compte à renouveler.",
    lead3:
      "pokrr est prêt en 10 secondes. Créer une salle, partager le lien, commencer à voter.",
    cta: "Créer une salle",
    rolesTitle: "Qui fait quoi pendant le planning poker Scrum ?",
    roles: [
      {
        role: "Scrum Master",
        desc: "Facilite la session sans voter. Sur pokrr, le SM prend le rôle admin : il présente les stories et révèle les cartes. Il peut transférer ce rôle à un autre membre si besoin.",
      },
      {
        role: "Équipe de développement",
        desc: "Vote sur la complexité de chaque story. Chaque développeur, QA, et designer impliqué dans la story vote simultanément, sans voir les choix des autres avant la révélation.",
      },
      {
        role: "Product Owner",
        desc: "Présente les stories et répond aux questions de clarification. La pratique courante est de ne pas voter pour ne pas influencer l'équipe. Si le PO vote, il révèle sa carte au même moment que les autres.",
      },
    ],
    featuresTitle: "Ce que pokrr apporte à une équipe Scrum",
    features: [
      {
        title: "Vote simultané anti-ancrage",
        desc: "Personne ne voit les votes des autres avant la révélation. Le senior ne donne pas le ton avant que l'équipe ait voté. C'est la règle fondamentale du planning poker — elle s'applique en présentiel comme à distance.",
      },
      {
        title: "Fibonacci et T-Shirt dans le même outil",
        desc: "Fibonacci pour les stories de sprint (story points). T-Shirt sizing pour les epics et la roadmap. Puissances de 2 et deck custom disponibles selon la pratique de l'équipe.",
      },
      {
        title: "Admin = rôle du Scrum Master",
        desc: "Le SM crée la salle, contrôle la révélation et peut passer à la story suivante. Plusieurs admins peuvent être actifs simultanément si l'équipe est co-facilite.",
      },
      {
        title: "Timer par story",
        desc: "Chaque story peut avoir son propre compte à rebours. Utile pour tenir le rythme sur un backlog de 15 à 20 stories sans que la session déborde.",
      },
      {
        title: "Rejoindre sans compte",
        desc: "L'équipe change à chaque recrutement, chaque nouveau stakeholder, chaque session de découverte avec un client. Aucun membre ne crée de compte. Un lien suffit.",
      },
      {
        title: "Résultats copiables en Markdown",
        desc: "Après la révélation, la médiane, la distribution et les votes individuels peuvent être copiés en Markdown pour être collés dans Notion, Confluence ou un canal Slack.",
      },
    ],
    antiPatternsTitle: "Les erreurs courantes en planning poker Scrum",
    antiPatterns: [
      {
        title: "Le SM donne son estimation avant le vote",
        desc: "Même involontairement, une estimation verbale avant la révélation déclenche le biais d'ancrage documenté par Kahneman et Tversky. La règle : on vote, puis on parle.",
      },
      {
        title: "Traiter l'estimation comme un engagement",
        desc: "Les story points mesurent la complexité relative d'une story, pas une durée contractuelle. Une story à 8 points ne signifie pas 8 heures ni 8 jours. C'est la vélocité de l'équipe sur plusieurs sprints qui donne la valeur prédictive.",
      },
      {
        title: "Estimer pendant le sprint planning",
        desc: "Le sprint planning est fait pour sélectionner les stories et construire le plan. L'estimation devrait être faite en amont, pendant le backlog refinement. Un sprint planning qui commence avec des stories non estimées se transforme en session d'estimation non prévue.",
      },
      {
        title: "Passer sans discuter les grands écarts",
        desc: "Si quelqu'un vote 2 et quelqu'un vote 13, continuer sans discussion annule l'intérêt de la session. L'écart signale un désaccord sur la définition de la story, une dépendance non identifiée ou un risque technique non partagé.",
      },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "À quel moment du sprint faire le planning poker ?",
        a: "Le plus souvent en backlog refinement, à mi-sprint, pour préparer les stories du sprint suivant. Le sprint planning peut inclure une estimation rapide, mais les stories complexes devraient être estimées avant.",
      },
      {
        q: "Combien de stories estimer par session ?",
        a: "Entre 8 et 15 pour une session de 60 à 90 minutes avec une équipe de 5 à 7 personnes. Au-delà, la concentration baisse et la qualité des estimations se dégrade.",
      },
      {
        q: "Le Scrum Master doit-il voter ?",
        a: "Non dans la pratique courante. Le SM facilite la session. S'il vote, il influence l'équipe, même sans le vouloir. Il peut noter sa propre estimation séparément pour comparaison, sans la révéler avant le vote collectif.",
      },
      {
        q: "pokrr peut-il tracker la vélocité ?",
        a: "Non. pokrr est un outil de session de planning poker. Les salles expirent après 4 heures d'inactivité et aucune donnée n'est stockée côté serveur. Le suivi de la vélocité sprint par sprint se fait dans votre outil de gestion de projet (Jira, Linear, Notion, etc.).",
      },
      {
        q: "Est-ce que pokrr s'intègre à Jira ?",
        a: "Non, pas d'intégration native. Les résultats de session peuvent être copiés en Markdown depuis l'interface pour être reportés manuellement dans votre backlog.",
      },
    ],
    blogLinkLabel: "Lire : pourquoi la suite Fibonacci en planning poker ?",
    blogHref: "/fr/blog/fibonacci-planning-poker",
  },
  en: {
    metaTitle: "Scrum Planning Poker: Estimate Your Sprint Backlog as a Team, No Friction",
    metaDescription:
      "Planning poker tool for Scrum teams. Fibonacci, simultaneous reveal, admin role for the Scrum Master. Free, no signup, no session limits.",
    title: "Scrum planning poker: estimate your backlog without adding ceremony overhead",
    lead1: "Sprint planning and backlog refinement already take long enough.",
    lead2:
      "The planning poker tool shouldn't add to that: no signup for the team, no reconfiguration between sprints, no account to renew.",
    lead3:
      "pokrr is ready in 10 seconds. Create a room, share the link, start voting.",
    cta: "Create a room",
    rolesTitle: "Who does what in Scrum planning poker?",
    roles: [
      {
        role: "Scrum Master",
        desc: "Facilitates the session without voting. On pokrr, the SM takes the admin role: presents stories and reveals cards. The role can be transferred to another team member as needed.",
      },
      {
        role: "Development team",
        desc: "Votes on the complexity of each story. Every developer, QA, and designer involved in the story votes simultaneously, without seeing anyone else's choice before the reveal.",
      },
      {
        role: "Product Owner",
        desc: "Presents stories and answers clarifying questions. The common practice is not to vote to avoid influencing the team. If the PO votes, they reveal their card at the same moment as everyone else.",
      },
    ],
    featuresTitle: "What pokrr adds to a Scrum team",
    features: [
      {
        title: "Simultaneous vote, anchoring-free",
        desc: "No one sees anyone else's vote before the reveal. The senior doesn't set the tone before the team has voted. That's the core rule of planning poker — it applies in person and remotely.",
      },
      {
        title: "Fibonacci and T-Shirt in the same tool",
        desc: "Fibonacci for sprint stories (story points). T-shirt sizing for epics and the roadmap. Powers of 2 and custom decks available to match the team's practice.",
      },
      {
        title: "Admin role = Scrum Master role",
        desc: "The SM creates the room, controls the reveal, and moves to the next story. Multiple admins can be active simultaneously for co-facilitated sessions.",
      },
      {
        title: "Per-story timer",
        desc: "Each story can have its own countdown. Useful for keeping pace on a backlog of 15 to 20 stories without the session running over.",
      },
      {
        title: "Join without an account",
        desc: "The team changes with every hire, every new stakeholder, every discovery session. No team member creates an account. A link is enough.",
      },
      {
        title: "Results exportable as Markdown",
        desc: "After the reveal, the median, distribution, and individual votes can be copied as Markdown and pasted into Notion, Confluence, or a Slack channel.",
      },
    ],
    antiPatternsTitle: "Common planning poker mistakes in Scrum",
    antiPatterns: [
      {
        title: "The SM gives their estimate before the vote",
        desc: "Even unintentionally, a verbal estimate before the reveal triggers anchoring bias, documented by Kahneman and Tversky. The rule: vote first, then talk.",
      },
      {
        title: "Treating estimates as commitments",
        desc: "Story points measure the relative complexity of a story, not a contractual duration. An 8-point story doesn't mean 8 hours or 8 days. The team's velocity across multiple sprints is what gives estimates predictive value.",
      },
      {
        title: "Estimating during sprint planning",
        desc: "Sprint planning is for selecting stories and building the plan. Estimation should happen earlier, during backlog refinement. A sprint planning that starts with unestimated stories turns into an unplanned estimation session.",
      },
      {
        title: "Moving on without discussing large divergence",
        desc: "If someone votes 2 and someone votes 13, skipping the discussion defeats the purpose of the session. The gap signals a disagreement about the story definition, an unidentified dependency, or an undisclosed technical risk.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "When in the sprint should planning poker happen?",
        a: "Most commonly during backlog refinement, mid-sprint, to prepare stories for the next sprint. Sprint planning can include quick estimation, but complex stories should be estimated beforehand.",
      },
      {
        q: "How many stories should be estimated per session?",
        a: "Between 8 and 15 stories for a 60-to-90-minute session with a team of 5 to 7 people. Beyond that, concentration drops and estimate quality degrades.",
      },
      {
        q: "Should the Scrum Master vote?",
        a: "Not in common practice. The SM facilitates the session. If they vote, they influence the team, even unintentionally. They can note their own estimate separately for comparison, without revealing it before the collective vote.",
      },
      {
        q: "Can pokrr track velocity?",
        a: "No. pokrr is a planning poker session tool. Rooms expire after 4 hours of inactivity and no data is stored server-side. Sprint-by-sprint velocity tracking happens in your project management tool (Jira, Linear, Notion, etc.).",
      },
      {
        q: "Does pokrr integrate with Jira?",
        a: "No native integration. Session results can be copied as Markdown from the interface and manually reported to your backlog.",
      },
    ],
    blogLinkLabel: "Read: why does planning poker use Fibonacci?",
    blogHref: "/en/blog/fibonacci-planning-poker",
  },
} as const;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) return {};
  const locale = lang as Locale;
  const c = content[locale];
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/planning-poker-scrum`,
      languages: {
        fr: `${SITE_URL}/fr/planning-poker-scrum`,
        en: `${SITE_URL}/en/planning-poker-scrum`,
        "x-default": `${SITE_URL}/en/planning-poker-scrum`,
      },
    },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `${SITE_URL}/${locale}/planning-poker-scrum`,
    },
  };
}

export default async function ScrumPage({ params }: Props) {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const c = content[locale];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "pokrr", item: `${SITE_URL}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: c.title,
        item: `${SITE_URL}/${locale}/planning-poker-scrum`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    mainEntity: c.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-bg text-fg">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Link
            href={locale === "fr" ? "/en/planning-poker-scrum" : "/fr/planning-poker-scrum"}
            className="text-xs text-muted hover:text-fg transition-colors px-2 py-1 rounded border border-token"
          >
            {locale === "fr" ? "EN" : "FR"}
          </Link>
        </div>

        <main className="mx-auto max-w-2xl px-6 py-20 space-y-20">

          {/* Hero */}
          <section className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {c.title}
            </h1>
            <div className="space-y-3 text-lg text-fg-soft">
              <p>{c.lead1}</p>
              <p>{c.lead2}</p>
              <p className="text-fg font-medium">{c.lead3}</p>
            </div>
            <Link
              href={`/${locale}`}
              className="inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {c.cta}
            </Link>
            <p className="text-xs text-faint">
              {locale === "fr"
                ? "Sans inscription · Aucune donnée stockée · RGPD-friendly"
                : "No signup · No data stored · GDPR-friendly"}
            </p>
          </section>

          {/* Roles */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">{c.rolesTitle}</h2>
            <dl className="divide-y divide-token">
              {c.roles.map((r) => (
                <div key={r.role} className="py-6 space-y-2 first:pt-0">
                  <dt className="font-semibold">{r.role}</dt>
                  <dd className="text-sm text-muted text-pretty">{r.desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Features */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">{c.featuresTitle}</h2>
            <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {c.features.map((f) => (
                <li key={f.title} className="space-y-2 border-t border-token py-6">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted text-pretty">{f.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Anti-patterns */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">{c.antiPatternsTitle}</h2>
            <ol className="space-y-6">
              {c.antiPatterns.map((p, i) => (
                <li key={p.title} className="flex gap-5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted border border-token">
                    {i + 1}
                  </span>
                  <div className="space-y-1 pt-0.5">
                    <p className="font-semibold text-sm">{p.title}</p>
                    <p className="text-sm text-muted text-pretty">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href={`/${locale}`}
              className="inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {c.cta}
            </Link>
          </section>

          {/* FAQ */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">{c.faqTitle}</h2>
            <dl className="divide-y divide-token">
              {c.faq.map((item) => (
                <div key={item.q} className="space-y-2 py-6 first:pt-0 last:pb-0">
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="text-sm text-muted text-pretty">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Internal link */}
          <div className="border-t border-token pt-8">
            <Link href={c.blogHref} className="text-sm text-accent hover:underline">
              {c.blogLinkLabel} →
            </Link>
          </div>

          <div className="text-sm text-muted">
            <Link href={`/${locale}`} className="hover:text-fg transition-colors">
              ← pokrr
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}
