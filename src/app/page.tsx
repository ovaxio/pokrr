import JoinRoomForm from "./_JoinRoomForm";
import NewRoomButton from "./_NewRoomButton";
import ThemeToggle from "./_ThemeToggle";

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "pokrr",
  url: "https://pokrr.app",
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
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
    </>
  );
}
