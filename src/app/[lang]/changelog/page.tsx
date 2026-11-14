import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, getDict } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";
import { changelog } from "@/content/changelog";
import LocaleToggle from "../../_LocaleToggle";
import ThemeToggle from "../../_ThemeToggle";

const SITE_URL = "https://pokrr.app";

type Props = { params: Promise<Record<string, string>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) return {};
  const d = getDict(lang as Locale);
  const url = `${SITE_URL}/${lang}/changelog`;
  const image = `${SITE_URL}/${lang}/opengraph-image`;
  return {
    title: d.changelogTitle,
    description: d.changelogMetaDescription,
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr/changelog`,
        en: `${SITE_URL}/en/changelog`,
        "x-default": `${SITE_URL}/en/changelog`,
      },
    },
    openGraph: {
      title: d.changelogTitle,
      description: d.changelogMetaDescription,
      url,
      type: "website",
      siteName: "pokrr",
      locale: lang === "fr" ? "fr_FR" : "en_US",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.changelogTitle,
      description: d.changelogMetaDescription,
      images: [image],
    },
  };
}

export default async function ChangelogPage({ params }: Props) {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const d = getDict(locale);
  // timeZone UTC : une date ISO seule est parsée à minuit UTC, sans cela un fuseau négatif affiche la veille.
  const dateFormat = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-10 border-b border-token bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <Link href={`/${locale}`} className="font-bold tracking-tight text-fg hover:text-accent transition-colors">
            pokrr
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{d.changelogTitle}</h1>
          <p className="text-muted text-pretty">{d.changelogIntro}</p>
        </div>
        <ol className="mt-10 divide-y divide-token">
          {changelog.map((entry, i) => (
            <li key={`${entry.date}-${i}`} className="space-y-1.5 py-6">
              <p className="text-xs text-muted">
                <time dateTime={entry.date}>{dateFormat.format(new Date(entry.date))}</time>
              </p>
              <h2 className="font-semibold">{entry.text[locale].title}</h2>
              <p className="text-sm text-muted text-pretty">{entry.text[locale].body}</p>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-token py-8 text-center text-xs text-muted">
        <Link href={`/${locale}`} className="hover:text-fg transition-colors">← pokrr</Link>
      </footer>
    </div>
  );
}
