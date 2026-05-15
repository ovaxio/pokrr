import { NUMERIC_CARDS, type Card, type PlayerView } from "../../party/types";

const NUMERIC_VALUES = new Map<Card, number>(NUMERIC_CARDS.map((c) => [c, Number(c)]));
const FIBO_NUMBERS: number[] = NUMERIC_CARDS.map((c) => Number(c));

export type DistributionEntry = { card: Card; count: number };

export type Stats = {
  voteCount: number; // votes effectifs (toutes cartes confondues, sauf null)
  numericCount: number; // votes numériques seulement
  mean: number | null;
  median: number | null;
  consensusSuggestion: Card | null;
  consensus: boolean; // tous les voters numériques ont voté la même carte
  distribution: DistributionEntry[]; // triée par count desc, ordre deck si égalité
  highest: { player: PlayerView; value: number } | null;
  lowest: { player: PlayerView; value: number } | null;
  spread: number | null; // highest - lowest
};

export function computeStats(players: PlayerView[]): Stats {
  const numericPlayers: Array<{ p: PlayerView; v: number }> = [];
  const countByCard = new Map<Card, number>();

  let voteCount = 0;
  for (const p of players) {
    if (!p.vote) continue;
    voteCount++;
    countByCard.set(p.vote, (countByCard.get(p.vote) ?? 0) + 1);
    const numeric = NUMERIC_VALUES.get(p.vote);
    if (numeric !== undefined) numericPlayers.push({ p, v: numeric });
  }

  const numericValues = numericPlayers.map((np) => np.v);
  const mean = numericValues.length
    ? round1(numericValues.reduce((a, b) => a + b, 0) / numericValues.length)
    : null;

  let median: number | null = null;
  if (numericValues.length) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    median =
      sorted.length % 2 === 0 ? round1((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
  }

  let consensusSuggestion: Card | null = null;
  if (mean !== null) {
    let best = FIBO_NUMBERS[0];
    for (const v of FIBO_NUMBERS) {
      if (Math.abs(v - mean) < Math.abs(best - mean)) best = v;
    }
    consensusSuggestion = String(best) as Card;
  }

  const consensus =
    numericPlayers.length > 0 &&
    numericPlayers.every((np) => np.p.vote === numericPlayers[0].p.vote);

  const sortedByValue = [...numericPlayers].sort((a, b) => a.v - b.v);
  const lowest = sortedByValue.length
    ? { player: sortedByValue[0].p, value: sortedByValue[0].v }
    : null;
  const highest = sortedByValue.length
    ? { player: sortedByValue[sortedByValue.length - 1].p, value: sortedByValue[sortedByValue.length - 1].v }
    : null;
  const spread = highest && lowest ? highest.value - lowest.value : null;

  // Ordonne distribution par count desc, puis par ordre deck.
  const deckOrder = new Map<Card, number>();
  ([
    "0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "∞", "?", "☕",
  ] as Card[]).forEach((c, i) => deckOrder.set(c, i));

  const distribution: DistributionEntry[] = [...countByCard.entries()]
    .map(([card, count]) => ({ card, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (deckOrder.get(a.card) ?? 0) - (deckOrder.get(b.card) ?? 0);
    });

  return {
    voteCount,
    numericCount: numericValues.length,
    mean,
    median,
    consensusSuggestion,
    consensus,
    distribution,
    highest,
    lowest,
    spread,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Détecte un écart suffisamment large pour mériter une discussion canonique (Mike Cohn).
// Heuristique : au moins 2 paliers Fibonacci d'écart.
export function isWideSpread(lowest: number, highest: number): boolean {
  const lowIdx = FIBO_NUMBERS.indexOf(lowest);
  const highIdx = FIBO_NUMBERS.indexOf(highest);
  if (lowIdx === -1 || highIdx === -1) return false;
  return highIdx - lowIdx >= 2;
}
