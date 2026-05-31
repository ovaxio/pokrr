import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";

const SITE_URL = "https://pokrr.app";

type Props = { params: Promise<{ lang: string }> };

const content = {
  fr: {
    title: "Planning poker en remote : lancez votre session sans friction",
    metaTitle: "Planning Poker en Remote : outil gratuit sans inscription pour équipes distribuées",
    metaDescription:
      "Lancez une session de planning poker avec votre équipe à distance en moins de 60 secondes. Gratuit, sans compte, sans installation. Fonctionne dans tout navigateur.",
    lead1:
      "Une session de planning poker en remote se plante en général au même endroit. Pas sur la méthode.",
    lead2:
      "Sur les cinq premières minutes : quelqu'un n'arrive pas à se connecter, quelqu'un attend un email de confirmation, le product owner regarde sa montre.",
    lead3:
      "pokrr ne demande aucune inscription. Un lien, un pseudo, et tout le monde est dans la salle.",
    cta: "Créer une salle",
    featuresTitle: "Ce qui change quand l'équipe est distribuée",
    features: [
      {
        title: "Zéro inscription pour les participants",
        desc: "Chaque nouveau participant, chaque stakeholder invité, chaque salle nouvellement créée : personne ne crée de compte. Un lien dans Slack ou Teams suffit.",
      },
      {
        title: "Fonctionne dans tout navigateur",
        desc: "Safari sur iPhone, Chrome sur Android, Firefox sous Linux. Pas d'application à installer, pas de droits IT à demander.",
      },
      {
        title: "Vote masqué jusqu'à la révélation",
        desc: "Même à distance, personne ne voit les votes des autres avant la révélation simultanée. Le biais d'ancrage ne s'invite pas dans la call.",
      },
      {
        title: "Timer par story",
        desc: "Lancez un compte à rebours par user story pour garder le rythme. Les sessions remote s'essoufflent plus vite que les sessions en présentiel.",
      },
      {
        title: "Multi-admin avec transfert",
        desc: "L'animateur peut changer en cours de session. Utile quand l'équipe est distribuée sur plusieurs fuseaux horaires ou quand le Scrum Master doit passer la main.",
      },
      {
        title: "Aucune donnée stockée",
        desc: "Les salles expirent après 4 heures d'inactivité. Aucun compte, aucun email, aucune donnée côté serveur. RGPD-friendly par conception.",
      },
    ],
    howToTitle: "Comment lancer une session de planning poker en remote",
    howToSteps: [
      { step: "Aller sur pokrr.app/fr et cliquer « Créer une salle »." },
      {
        step: "Copier le lien ou le QR code et le partager dans Slack, Teams ou Discord.",
      },
      { step: "Chaque participant entre un pseudo. Aucun compte requis." },
      { step: "Le product owner présente la première user story." },
      {
        step: "Tout le monde vote en secret. L'admin révèle toutes les cartes simultanément.",
      },
      {
        step: "Discuter les écarts, re-voter si nécessaire, passer à la story suivante.",
      },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Est-ce que pokrr fonctionne avec Zoom ou Teams ?",
        a: "Oui, dans un onglet du navigateur à côté de la call. Chaque participant ouvre pokrr.app pendant que l'appel vidéo tourne en parallèle. Aucune intégration native n'est nécessaire.",
      },
      {
        q: "Peut-on faire du planning poker en asynchrone ?",
        a: "pokrr est conçu pour les sessions synchrones, mais une salle reste ouverte 4 heures. Si l'équipe vote à des moments différents dans cette fenêtre, les votes s'accumulent jusqu'à la révélation par l'admin.",
      },
      {
        q: "Combien de personnes peuvent rejoindre une session ?",
        a: "Pas de limite fixe. pokrr est conçu pour des équipes de 3 à 15 personnes, mais aucun plafond technique n'est imposé.",
      },
      {
        q: "Est-ce que pokrr est gratuit pour les équipes en remote ?",
        a: "Oui, entièrement gratuit. Sans publicité, sans inscription, sans limite de sessions.",
      },
      {
        q: "Comment partager la salle avec l'équipe ?",
        a: "Un code court, un lien URL et un QR code sont générés automatiquement à la création. Colle le lien dans le canal Slack de l'équipe avant la call.",
      },
    ],
    blogLinkLabel: "Lire le guide : adapter le planning poker pour les équipes remote",
    blogHref: "/fr/blog/guide-complet-planning-poker",
  },
  en: {
    title: "Remote Planning Poker: Start Your Session in Under 60 Seconds",
    metaTitle: "Remote Planning Poker: Free Tool, No Signup, Works in Any Browser",
    metaDescription:
      "Run a planning poker session with your distributed team in under 60 seconds. Free, no account, no install. Works in any browser on any device.",
    lead1:
      "Remote planning poker sessions usually break down in the same place. Not on the method.",
    lead2:
      "In the first five minutes: someone can't connect, someone is waiting on a verification email, the product owner is checking their watch.",
    lead3:
      "pokrr requires no signup. One link, one username, and everyone's in the room.",
    cta: "Create a room",
    featuresTitle: "What matters when your team is distributed",
    features: [
      {
        title: "Zero signup for participants",
        desc: "Every new participant, every invited stakeholder, every new session: no one creates an account. A link in Slack or Teams is enough.",
      },
      {
        title: "Works in any browser",
        desc: "Safari on iPhone, Chrome on Android, Firefox on Linux. No app to install, no IT approval needed.",
      },
      {
        title: "Votes hidden until the reveal",
        desc: "Even remotely, no one sees anyone else's vote before the simultaneous reveal. Anchoring bias doesn't join the call.",
      },
      {
        title: "Per-story timer",
        desc: "Start a countdown for each user story to keep sessions on track. Remote sessions lose momentum faster than in-person ones.",
      },
      {
        title: "Multi-admin with transfer",
        desc: "The facilitator role can change mid-session. Useful when the team spans time zones or when the Scrum Master needs to hand off.",
      },
      {
        title: "No data stored",
        desc: "Rooms expire after 4 hours of inactivity. No account, no email, no server-side data. GDPR-compliant by design.",
      },
    ],
    howToTitle: "How to run a planning poker session with a remote team",
    howToSteps: [
      { step: "Go to pokrr.app/en and click \"Create a room\"." },
      {
        step: "Copy the link or QR code and share it in Slack, Teams, or Discord.",
      },
      { step: "Each participant enters a username. No account required." },
      { step: "The product owner presents the first user story." },
      {
        step: "Everyone votes in secret. The admin reveals all cards simultaneously.",
      },
      {
        step: "Discuss the divergence, re-vote if needed, move to the next story.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Does pokrr work with Zoom or Teams?",
        a: "Yes, in a browser tab alongside the video call. Each participant opens pokrr.app while the call runs in parallel. No native integration needed.",
      },
      {
        q: "Can planning poker be done asynchronously?",
        a: "pokrr is designed for synchronous sessions, but a room stays open for 4 hours. If the team votes at different times within that window, votes accumulate until the admin reveals.",
      },
      {
        q: "How many people can join a session?",
        a: "No hard limit. pokrr is designed for teams of 3 to 15 people, but no technical cap is enforced.",
      },
      {
        q: "Is pokrr free for remote teams?",
        a: "Yes, entirely free. No ads, no signup, no session limits.",
      },
      {
        q: "How do I share the room with the team?",
        a: "A short room code, a URL link, and a QR code are generated automatically when you create a room. Paste the link in the team's Slack channel before the call.",
      },
    ],
    blogLinkLabel: "Read the guide: planning poker for remote teams",
    blogHref: "/en/blog/complete-guide-planning-poker",
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
      canonical: `${SITE_URL}/${locale}/planning-poker-remote`,
      languages: {
        fr: `${SITE_URL}/fr/planning-poker-remote`,
        en: `${SITE_URL}/en/planning-poker-remote`,
        "x-default": `${SITE_URL}/en/planning-poker-remote`,
      },
    },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `${SITE_URL}/${locale}/planning-poker-remote`,
    },
  };
}

export default async function RemotePage({ params }: Props) {
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
        item: `${SITE_URL}/${locale}/planning-poker-remote`,
      },
    ],
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: c.howToTitle,
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    step: c.howToSteps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s.step,
    })),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-bg text-fg">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Link
            href={locale === "fr" ? "/en/planning-poker-remote" : "/fr/planning-poker-remote"}
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

          {/* How-to */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight text-balance">{c.howToTitle}</h2>
            <ol className="space-y-6">
              {c.howToSteps.map((s, i) => (
                <li key={i} className="flex gap-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm text-muted text-pretty">{s.step}</p>
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

          {/* Internal link to blog */}
          <div className="border-t border-token pt-8">
            <Link
              href={c.blogHref}
              className="text-sm text-accent hover:underline"
            >
              {c.blogLinkLabel} →
            </Link>
          </div>

          {/* Footer nav */}
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
