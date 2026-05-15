import type { Metadata } from "next";
import "./globals.css";
import ThemeScript from "./_ThemeScript";

const SITE_NAME = "pokrr";
const SITE_DESCRIPTION =
  "Planning poker en ligne gratuit, sans inscription, sans pub. Crée une salle, partage le lien, vote.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: `${SITE_NAME} — planning poker minimaliste`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Guillaume Chambard" }],
  keywords: [
    "planning poker",
    "scrum",
    "agile",
    "estimation",
    "refinement",
    "fibonacci",
    "gratuit",
  ],
  openGraph: {
    type: "website",
    title: `${SITE_NAME} — planning poker minimaliste`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — planning poker minimaliste`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
