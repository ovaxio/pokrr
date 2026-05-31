import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
  import { Geist } from "next/font/google";
import "./globals.css";
import ThemeScript from "./_ThemeScript";
import { Analytics } from "@vercel/analytics/next";
import { locales, defaultLocale } from "@/i18n/shared";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const SITE_NAME = "pokrr";
const SITE_URL = "https://pokrr.app";
const SITE_DESCRIPTION =
  "Planning poker en ligne gratuit, sans inscription, sans pub. Fibonacci, T-Shirt, decks custom. Crée une salle, partage le lien, vote.";

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : SITE_URL);

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: `${SITE_NAME} — Planning Poker gratuit en ligne, sans inscription`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Guillaume Chambard" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} — Planning Poker gratuit en ligne, sans inscription`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Planning Poker gratuit en ligne, sans inscription`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "pokrr",
  url: SITE_URL,
  inLanguage: ["fr-FR", "en-US"],
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "pokrr",
  url: SITE_URL,
  description:
    "Planning poker gratuit en ligne pour équipes agile et Scrum. Sans inscription, sans pub, sans données stockées.",
  foundingDate: "2025",
  knowsAbout: [
    "Planning Poker",
    "Agile estimation",
    "Scrum",
    "Sprint planning",
    "Story points",
    "Fibonacci sequence",
    "T-Shirt sizing",
  ],
  sameAs: [
    // Add your social/profile URLs here: GitHub, LinkedIn, ProductHunt, etc.
  ],
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icon.svg`,
    width: 32,
    height: 32,
  },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const h = await headers();
  const xLocale = h.get("x-locale");
  const lang = xLocale && (locales as string[]).includes(xLocale) ? xLocale : defaultLocale;

  return (
    <html lang={lang} className={`h-full antialiased ${geist.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
