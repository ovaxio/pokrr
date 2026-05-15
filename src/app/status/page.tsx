import Link from "next/link";
import StatusClient from "./_StatusClient";

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
        <header className="space-y-2">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← pokrr
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Statut</h1>
          <p className="text-sm text-neutral-400">
            État du frontend et du serveur de salles. Polling toutes les 10 secondes.
          </p>
        </header>
        <StatusClient />
      </main>
    </div>
  );
}
