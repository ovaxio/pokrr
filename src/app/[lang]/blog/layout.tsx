import type { ReactNode } from "react";
import Link from "next/link";
import ThemeToggle from "../../_ThemeToggle";
import LocaleToggle from "../../_LocaleToggle";

export default async function BlogLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<Record<string, string>>;
}) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-10 border-b border-token bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <Link href={`/${lang}`} className="font-bold tracking-tight text-fg hover:text-accent">
            pokrr
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-token py-8 text-center text-xs text-muted">
        <Link href={`/${lang}`} className="hover:text-fg">← pokrr</Link>
      </footer>
    </div>
  );
}
