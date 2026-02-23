import type { DevCard, DevCardType } from "@/types/game";

const DEV_DECK_COUNTS: Record<DevCardType, number> = {
  knight:        14,
  victoryPoint:   5,
  roadBuilding:   2,
  yearOfPlenty:   2,
  monopoly:       2,
};

/** Builds a full 25-card dev deck and returns it shuffled. */
export function buildDevDeck(): DevCard[] {
  const cards: DevCard[] = [];
  for (const [type, count] of Object.entries(DEV_DECK_COUNTS) as [DevCardType, number][]) {
    for (let i = 0; i < count; i++) {
      cards.push({ type });
    }
  }

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}
