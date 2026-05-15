import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pokrr — planning poker minimaliste",
  description:
    "Planning poker en ligne gratuit, sans inscription, sans pub. Crée une salle, partage le lien, vote.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
