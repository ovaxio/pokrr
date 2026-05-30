import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JoinRoomForm from "../_JoinRoomForm";
import NewRoomButton from "../_NewRoomButton";
import ThemeToggle from "../_ThemeToggle";
import LocaleToggle from "../_LocaleToggle";
import { locales, getDict } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";

const SITE_URL = "https://pokrr.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) return {};
  const d = getDict(lang as Locale);
  return {
    title: `pokrr — ${lang === "fr" ? "Planning Poker gratuit en ligne, sans inscription" : "Free Online Planning Poker, No Sign-up"}`,
    description: d.tagline,
    openGraph: {
      images: [{ url: `${SITE_URL}/${lang}/opengraph-image`, width: 1200, height: 630 }],
    },
  };
}

export default async function LangHome({ params }: { params: Promise<Record<string, string>> }) {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const d = getDict(locale);

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "pokrr",
    url: `${SITE_URL}/${lang}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: d.tagline,
    inLanguage: locale === "fr" ? "fr-FR" : "en",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    featureList: d.features.map((f) => f.title),
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: d.howToTitle,
    description: d.tagline,
    inLanguage: locale === "fr" ? "fr-FR" : "en",
    step: d.howToSteps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.desc,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "fr" ? "fr-FR" : "en",
    mainEntity: d.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

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
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
          <header className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">pokrr</h1>
            <p className="text-muted">{d.tagline}</p>
          </header>
          <section className="space-y-6">
            <NewRoomButton />
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-token" />
              <span>{d.or}</span>
              <span className="h-px flex-1 bg-token" />
            </div>
            <JoinRoomForm />
          </section>
          <footer className="text-xs text-muted">{d.pageFooter}</footer>
        </main>
      </div>

      <section id="comment" aria-label={d.howToTitle} className="border-t border-token bg-surface px-6 py-20">
        <div className="mx-auto max-w-md space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">{d.howToTitle}</h2>
          <ol className="space-y-8">
            {d.howToSteps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {i + 1}
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

      <section id="features" aria-label={d.featuresTitle} className="border-t border-token bg-bg px-6 py-20">
        <div className="mx-auto max-w-md space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">{d.featuresTitle}</h2>
          <ul className="space-y-6">
            {d.features.map((f) => (
              <li key={f.title} className="space-y-1">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" aria-label={d.faqTitle} className="border-t border-token bg-surface px-6 py-20">
        <div className="mx-auto max-w-md space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">{d.faqTitle}</h2>
          <dl className="space-y-8">
            {d.faq.map((item) => (
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
