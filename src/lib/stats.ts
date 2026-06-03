import {
  cardToNumber,
  DECKS,
  DEFAULT_DECK_ID,
  type Card,
  type PlayerView,
} from "../../party/types";

type DistributionEntry = { card: Card; count: number };

type Stats = {
  voteCount: number; // votes effectifs (toutes cartes confondues, sauf null)
  numericCount: number; // votes numériques seulement (selon deck)
  mean: number | null;
  median: number | null;
  consensusSuggestion: Card | null;
  consensus: boolean; // tous les voters ont voté la même carte (effective)
  distribution: DistributionEntry[]; // triée par count desc, ordre deck si égalité
  highest: { player: PlayerView; value: number } | null;
  lowest: { player: PlayerView; value: number } | null;
  spread: number | null; // highest - lowest
  numericDeck: boolean; // false = deck non-numérique (T-shirt) → mean/median/suggestion sans sens
};

export function computeStats(players: PlayerView[], deckId: string = DEFAULT_DECK_ID): Stats {
  const deck = DECKS[deckId] ?? DECKS[DEFAULT_DECK_ID];
  const numericDeck = deck.numericCards.length > 0;

  const numericPlayers: Array<{ p: PlayerView; v: number }> = [];
  const countByCard = new Map<Card, number>();

  let voteCount = 0;
  for (const p of players) {
    if (!p.vote) continue;
    voteCount++;
    countByCard.set(p.vote, (countByCard.get(p.vote) ?? 0) + 1);
    const numeric = cardToNumber(deck, p.vote);
    if (numeric !== null) numericPlayers.push({ p, v: numeric });
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
  if (mean !== null && numericDeck) {
    // Snap au card numérique le plus proche dans le deck courant
    const numericValuesInDeck = deck.numericCards
      .map((c) => ({ card: c, n: cardToNumber(deck, c) }))
      .filter((x): x is { card: string; n: number } => x.n !== null);
    if (numericValuesInDeck.length > 0) {
      let best = numericValuesInDeck[0];
      for (const v of numericValuesInDeck) {
        if (Math.abs(v.n - mean) < Math.abs(best.n - mean)) best = v;
      }
      consensusSuggestion = best.card;
    }
  }

  const consensus =
    voteCount > 0 && countByCard.size === 1;

  const sortedByValue = [...numericPlayers].sort((a, b) => a.v - b.v);
  const lowest = sortedByValue.length
    ? { player: sortedByValue[0].p, value: sortedByValue[0].v }
    : null;
  const highest = sortedByValue.length
    ? {
        player: sortedByValue[sortedByValue.length - 1].p,
        value: sortedByValue[sortedByValue.length - 1].v,
      }
    : null;
  const spread = highest && lowest ? highest.value - lowest.value : null;

  // Ordonne distribution par count desc, puis par ordre deck.
  const deckOrder = new Map<Card, number>();
  deck.cards.forEach((c, i) => deckOrder.set(c, i));

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
    numericDeck,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Détecte un écart suffisamment large pour mériter une discussion canonique (Mike Cohn).
// Heuristique : au moins 2 paliers dans l'ordre du deck numérique.
export function isWideSpread(
  lowest: number,
  highest: number,
  deckId: string = DEFAULT_DECK_ID,
): boolean {
  const deck = DECKS[deckId] ?? DECKS[DEFAULT_DECK_ID];
  const values = deck.numericCards
    .map((c) => cardToNumber(deck, c))
    .filter((n): n is number => n !== null);
  const lowIdx = values.indexOf(lowest);
  const highIdx = values.indexOf(highest);
  if (lowIdx === -1 || highIdx === -1) return false;
  return highIdx - lowIdx >= 2;
}
