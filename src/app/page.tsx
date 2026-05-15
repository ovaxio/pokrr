import HelloPartyKit from "./_HelloPartyKit";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">pokrr</h1>
          <p className="text-neutral-400">
            Planning poker minimaliste, gratuit, sans pub, sans inscription.
          </p>
        </header>

        <section className="w-full space-y-3">
          <p className="text-sm text-neutral-500">
            Squelette projet — étape 0. Smoke test PartyKit ci-dessous.
          </p>
          <HelloPartyKit />
        </section>
      </main>
    </div>
  );
}
