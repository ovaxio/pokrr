import JoinRoomForm from "./_JoinRoomForm";
import NewRoomButton from "./_NewRoomButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-10 px-6 py-16">
        <header className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">pokrr</h1>
          <p className="text-neutral-400">
            Planning poker minimaliste : gratuit, sans pub, sans inscription.
          </p>
        </header>
        <section className="space-y-6">
          <NewRoomButton />
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-neutral-500">
            <span className="h-px flex-1 bg-neutral-800" />
            <span>ou</span>
            <span className="h-px flex-1 bg-neutral-800" />
          </div>
          <JoinRoomForm />
        </section>
        <footer className="text-xs text-neutral-600">
          Aucune donnée stockée côté serveur. Les salles expirent après 4h d&apos;inactivité.
        </footer>
      </main>
    </div>
  );
}
