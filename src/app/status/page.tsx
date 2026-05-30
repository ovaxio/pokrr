import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "../_ThemeToggle";
import StatusClient from "./_StatusClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <header className="space-y-2">
          <Link href="/" className="text-sm text-muted hover:text-fg">
            ← pokrr
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Statut</h1>
          <p className="text-sm text-muted">
            État du frontend et du serveur de salles. Polling toutes les 10 secondes.
          </p>
        </header>
        <StatusClient />
      </main>
    </div>
  );
}
