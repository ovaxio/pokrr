import JoinRoomForm from "./_JoinRoomForm";
import NewRoomButton from "./_NewRoomButton";
import ThemeToggle from "./_ThemeToggle";

const SITE_URL = "https://pokrr.app";

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "pokrr",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Planning poker en ligne gratuit, sans inscription, sans pub. Fibonacci, T-Shirt, decks custom.",
  inLanguage: "fr-FR",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  featureList: [
    "Fibonacci",
    "T-Shirt sizing",
    "Puissances de 2",
    "Minuteur intégré",
    "QR Code de partage",
    "Export Markdown",
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Comment organiser un planning poker en ligne avec pokrr",
  description:
    "Guide pour lancer une session de planning poker en temps réel avec pokrr, sans inscription.",
  inLanguage: "fr-FR",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Crée une salle",
      text: "Clique sur \"Nouvelle salle\" pour générer un code de session unique. Aucun compte requis.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Partage le code",
      text: "Envoie le code ou le lien à ton équipe. Chaque participant rejoint en saisissant le code.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Vote sur chaque user story",
      text: "L'admin énonce la user story. Chaque participant choisit sa carte (Fibonacci, T-Shirt, etc.) sans voir les votes des autres.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Révèle les votes en simultané",
      text: "L'admin révèle toutes les cartes en même temps, évitant le biais d'ancrage. La médiane et la distribution sont affichées.",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "fr-FR",
  mainEntity: [
    {
      "@type": "Question",
      name: "Qu'est-ce que le planning poker ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le planning poker est une technique d'estimation agile utilisée par les équipes Scrum. Chaque membre vote simultanément sur la complexité d'une user story à l'aide de cartes (souvent la suite de Fibonacci). Le vote simultané évite le biais d'ancrage.",
      },
    },
    {
      "@type": "Question",
      name: "pokrr est-il gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, pokrr est entièrement gratuit, sans pub et sans abonnement. Aucune carte bancaire n'est requise.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il créer un compte pour utiliser pokrr ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. pokrr ne demande aucune inscription ni email. Tu crées une salle en un clic et tu partages le code à ton équipe.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de participants peuvent rejoindre une salle ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Il n'y a pas de limite fixe. pokrr est conçu pour des équipes Scrum typiques de 3 à 15 personnes, mais peut accueillir davantage de participants.",
      },
    },
    {
      "@type": "Question",
      name: "Quelles échelles de vote sont disponibles ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "pokrr propose la suite de Fibonacci (1, 2, 3, 5, 8, 13, 21…), le T-Shirt sizing (XS, S, M, L, XL), les puissances de 2, les entiers naturels, et un deck personnalisable.",
      },
    },
    {
      "@type": "Question",
      name: "Les données sont-elles stockées ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. Aucune donnée personnelle n'est stockée côté serveur. Les salles sont en mémoire et expirent automatiquement après 4 heures d'inactivité. pokrr est RGPD-friendly.",
      },
    },
  ],
};

const FEATURES = [
  {
    title: "Sans inscription",
    desc: "Aucun compte, aucun email. Crée une salle et lance ton sprint en 10 secondes.",
  },
  {
    title: "Vote simultané",
    desc: "Les cartes se révèlent toutes en même temps — le biais d'ancrage est éliminé.",
  },
  {
    title: "5 échelles de vote",
    desc: "Fibonacci, T-Shirt sizing, puissances de 2, entiers naturels, ou ton deck sur mesure.",
  },
  {
    title: "Minuteur intégré",
    desc: "Lance un timer par user story pour maintenir le rythme des sessions.",
  },
  {
    title: "Multi-admin",
    desc: "Plusieurs admins par salle, transfert d'admin en un clic.",
  },
  {
    title: "RGPD-friendly",
    desc: "Aucune donnée stockée côté serveur. Les salles expirent après 4h d'inactivité.",
  },
] as const;

const FAQ = [
  {
    q: "Qu'est-ce que le planning poker ?",
    a: "Le planning poker est une technique d'estimation agile utilisée par les équipes Scrum. Chaque membre vote simultanément sur la complexité d'une user story à l'aide de cartes (souvent la suite de Fibonacci). Le vote simultané évite le biais d'ancrage.",
  },
  {
    q: "pokrr est-il vraiment gratuit ?",
    a: "Oui — sans pub, sans abonnement, sans carte bancaire. Pour toujours.",
  },
  {
    q: "Faut-il créer un compte ?",
    a: "Non. Aucune inscription, aucun email. Tu crées une salle en un clic et tu partages le code.",
  },
  {
    q: "Combien de participants peuvent rejoindre ?",
    a: "Pas de limite fixe. pokrr est conçu pour des équipes Scrum typiques de 3 à 15 personnes.",
  },
  {
    q: "Quelles échelles de vote sont disponibles ?",
    a: "Fibonacci (1, 2, 3, 5, 8, 13, 21…), T-Shirt (XS, S, M, L, XL), puissances de 2, entiers naturels, et un deck personnalisable.",
  },
  {
    q: "Les données sont-elles stockées ?",
    a: "Non. Aucune donnée personnelle côté serveur. Les salles expirent après 4h d'inactivité. Pokrr est RGPD-friendly.",
  },
] as const;

const HOW_TO_STEPS = [
  {
    n: "1",
    title: "Crée une salle",
    desc: 'Clique sur "Nouvelle salle". Un code unique est généré instantanément.',
  },
  {
    n: "2",
    title: "Partage le code",
    desc: "Envoie le code ou le lien QR à ton équipe. Chaque participant rejoint sans compte.",
  },
  {
    n: "3",
    title: "Vote sur chaque story",
    desc: "Chacun choisit sa carte en secret. Aucun vote n'est visible avant la révélation.",
  },
  {
    n: "4",
    title: "Révèle en simultané",
    desc: "L'admin révèle toutes les cartes d'un coup. La médiane et la distribution s'affichent.",
  },
] as const;

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="min-h-screen bg-bg text-fg">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-10 px-6 py-16">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <header className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">pokrr</h1>
            <p className="text-muted">
              Planning poker minimaliste : gratuit, sans pub, sans inscription.
            </p>
          </header>
          <section className="space-y-6">
            <NewRoomButton />
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-token" />
              <span>ou</span>
              <span className="h-px flex-1 bg-token" />
            </div>
            <JoinRoomForm />
          </section>
          <footer className="text-xs text-muted">
            Aucune donnée stockée côté serveur. Les salles expirent après 4h d&apos;inactivité.
          </footer>
        </main>
      </div>

      <section id="comment" aria-label="Comment utiliser pokrr" className="border-t border-token bg-surface px-6 py-20">
        <div className="mx-auto max-w-md space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">Comment organiser un planning poker en ligne</h2>
          <ol className="space-y-8">
            {HOW_TO_STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {step.n}
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" aria-label="Fonctionnalités" className="border-t border-token bg-bg px-6 py-20">
        <div className="mx-auto max-w-md space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">Pourquoi pokrr ?</h2>
          <ul className="space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="space-y-1">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" aria-label="Questions fréquentes" className="border-t border-token bg-surface px-6 py-20">
        <div className="mx-auto max-w-md space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">Questions fréquentes</h2>
          <dl className="space-y-8">
            {FAQ.map((item) => (
              <div key={item.q} className="space-y-2">
                <dt className="font-semibold">{item.q}</dt>
                <dd className="text-sm text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
