// Illustration statique de la room en état post-révélation — section de preuve produit sur la landing.
// Utilise la classe `dark` forcée pour afficher les tokens dark indépendamment du thème système.

const PLAYERS: { name: string; vote: string; isAdmin?: boolean }[] = [
  { name: "Alice", vote: "5", isAdmin: true },
  { name: "Bob", vote: "8" },
  { name: "Claire", vote: "8" },
  { name: "David", vote: "3" },
  { name: "Emma", vote: "8" },
];

const DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "∞", "?", "☕"] as const;
const SELECTED = "8";

const DISTRIBUTION = [
  { card: "3", count: 1 },
  { card: "5", count: 1 },
  { card: "8", count: 3 },
] as const;

const MAX_COUNT = 3;

export default function RoomPreview({ locale }: { locale: string }) {
  const isFr = locale === "fr";

  return (
    <section
      aria-label={isFr ? "Aperçu de la salle de vote" : "Room preview"}
      className="border-t border-neutral-800 bg-neutral-900 px-6 py-16"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Illustration — aria-hidden car contenu décoratif */}
        <div
          className="dark [zoom:0.85] overflow-hidden rounded-xl ring-1 ring-white/8 sm:[zoom:0.72]"
          aria-hidden="true"
        >
          {/* Browser chrome bar */}
          <div className="flex items-center gap-3 border-b border-token bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 rounded-full bg-red-500/90" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/90" />
              <span className="h-3 w-3 rounded-full bg-green-500/90" />
            </div>
            <div className="flex flex-1 justify-center">
              <span className="flex items-center gap-1.5 rounded-md bg-bg px-3 py-1 font-mono text-xs text-muted max-w-xs w-full justify-center">
                <span className="text-faint">🔒</span>
                pokrr.app/room/SPRINT42
              </span>
            </div>
            <div className="w-12 shrink-0" />
          </div>

          <div className="flex flex-col gap-5 bg-bg px-4 py-5 text-fg sm:px-6 sm:py-6">

            {/* Header */}
            <header className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold tracking-tight text-lg">pokrr</span>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="hidden sm:inline">Salle</span>
                <code className="rounded bg-surface px-2 py-1 font-mono text-fg-soft">
                  SPRINT42
                </code>
                <span className="rounded border border-token bg-surface px-2 py-1 text-fg-soft">
                  {isFr ? "Partager" : "Share"}
                </span>
                <span className="rounded border border-token bg-surface px-2 py-1 font-mono text-fg-soft">
                  ?
                </span>
              </div>
            </header>

            {/* Story + status */}
            <div className="space-y-1">
              <p className="font-semibold">
                {isFr
                  ? "Refonte du système d'authentification"
                  : "Authentication system refactor"}
              </p>
              <p className="text-sm text-muted">
                {isFr ? "Résultats — 5/5 ont voté" : "Results — 5/5 voted"}
              </p>
            </div>

            {/* Players */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {PLAYERS.map((p) => (
                <div key={p.name} className="flex w-20 flex-col items-center gap-1.5">
                  {/* Revealed card face — bg-neutral-50/100 like the real flip-face-back */}
                  <div className="relative h-24 w-16">
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-indigo-500 bg-neutral-50 text-neutral-900">
                      <span className="text-2xl font-bold">{p.vote}</span>
                    </div>
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-bg" />
                  </div>
                  <div className="flex w-full flex-col items-center gap-0.5 text-center">
                    <span className="max-w-full truncate text-xs font-medium text-fg">
                      {p.name}
                    </span>
                    {p.isAdmin && (
                      <span className="rounded bg-indigo-500/20 px-1 py-0.5 text-[10px] uppercase tracking-wider text-indigo-300">
                        admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Results panel */}
            <div className="space-y-4 rounded-lg border border-token bg-surface/40 p-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-token bg-bg px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    {isFr ? "Moyenne" : "Mean"}
                  </div>
                  <div className="mt-0.5 text-2xl font-bold text-fg">6.4</div>
                </div>
                <div className="rounded-md border border-token bg-bg px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    {isFr ? "Médiane" : "Median"}
                  </div>
                  <div className="mt-0.5 text-2xl font-bold text-fg">8</div>
                </div>
                <div className="rounded-md border border-indigo-700 bg-indigo-950/40 px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    {isFr ? "Suggestion" : "Suggestion"}
                  </div>
                  <div className="mt-0.5 text-2xl font-bold text-indigo-200">8</div>
                </div>
              </div>

              {/* Distribution */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {isFr ? "Distribution" : "Distribution"}
                </p>
                <div className="space-y-1.5">
                  {DISTRIBUTION.map(({ card, count }) => (
                    <div key={card} className="flex items-center gap-3">
                      <span className="w-10 text-center font-mono text-sm text-fg">{card}</span>
                      <div className="flex-1">
                        <div
                          className="h-5 rounded bg-indigo-600/80"
                          style={{ width: `${(count / MAX_COUNT) * 100}%` }}
                        />
                      </div>
                      <span className="w-14 text-right text-xs text-muted">
                        {count} {count > 1 ? (isFr ? "votes" : "votes") : (isFr ? "vote" : "vote")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spread warning */}
              <div className="rounded-md border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
                <strong>Emma</strong> (8) ↔ <strong>David</strong> (3) :{" "}
                {isFr ? "écart à discuter." : "spread to discuss."}
              </div>
            </div>

            {/* Admin bar */}
            <div className="space-y-3 rounded-lg border border-token bg-surface/40 p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  tabIndex={-1}
                  className="rounded-lg border border-token-strong bg-surface-2 px-4 py-2 text-sm font-medium text-fg"
                >
                  {isFr ? "Re-voter cette story" : "Re-vote this story"}
                </button>
                <div className="flex flex-1 gap-2">
                  <input
                    readOnly
                    defaultValue=""
                    placeholder={isFr ? "Story suivante (titre)…" : "Next story (title)…"}
                    tabIndex={-1}
                    className="min-w-0 flex-1 rounded-lg border border-token-strong bg-surface px-3 py-2 text-sm text-fg outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="inline-flex items-center gap-1 rounded-lg border border-token-strong bg-surface-2 px-3 py-2 text-sm font-medium text-fg"
                  >
                    {isFr ? "Story suivante" : "Next story"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    readOnly
                    tabIndex={-1}
                    className="accent-indigo-500"
                  />
                  {isFr ? "Auto-révéler" : "Auto-reveal"}
                </label>
                <span>
                  {isFr ? "Deck" : "Deck"} :{" "}
                  <strong className="text-fg">Fibonacci</strong>
                </span>
                <div className="flex items-center gap-1">
                  <span>{isFr ? "Timer" : "Timer"} :</span>
                  {["1 min", "5 min", "10 min"].map((t) => (
                    <span
                      key={t}
                      className="rounded border border-token bg-surface px-2 py-1 text-fg"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card deck */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{isFr ? "Cartes verrouillées" : "Cards locked"}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {DECK.map((card) => (
                  <button
                    key={card}
                    type="button"
                    tabIndex={-1}
                    className={[
                      "flex h-16 cursor-not-allowed items-center justify-center rounded-lg border text-xl font-semibold opacity-40",
                      card === SELECTED
                        ? "border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                        : "border-token-strong bg-surface text-fg",
                    ].join(" ")}
                  >
                    {card}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Caption — visible aux lecteurs d'écran */}
        <p className="text-center text-xs text-neutral-500">
          {isFr
            ? "Après la révélation : votes de l'équipe, médiane, suggestion Fibonacci et distribution en un coup d'œil."
            : "After the reveal: everyone's votes, median, Fibonacci suggestion and distribution at a glance."}
        </p>
      </div>
    </section>
  );
}
