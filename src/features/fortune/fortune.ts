import { buildAlbum } from '@/features/album/album';
import type { Entry } from '@/features/entries/types';
import { caffeineLevel } from '@/features/stats/caffeineLevel';
import { computeStreak } from '@/features/stats/stats';
import { formatDate, formatNumber, t } from '@/i18n';

// The shapes a cup can show. Each has its old meaning, and says it with
// something from the journal.
export const symbols = ['bird', 'road', 'heart', 'fish', 'key', 'moon', 'star'] as const;
export type FortuneSymbol = (typeof symbols)[number];

export type Reading = {
  symbol: FortuneSymbol;
  // Where it lies in the cup, from -1 to 1 across and down.
  x: number;
  y: number;
  text: string;
};

// The same cup always reads the same: the random choices are seeded by the
// coffee, so coming back to it does not change the fortune.
function seeded(seed: string) {
  let state = 0;
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function mostCommonCafe(entries: Entry[]): string | null {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const cafe = entry.cafe?.trim();
    if (cafe) counts.set(cafe, (counts.get(cafe) ?? 0) + 1);
  }
  let best: string | null = null;
  let most = 0;
  for (const [cafe, count] of counts) {
    if (count > most) {
      best = cafe;
      most = count;
    }
  }
  return best;
}

function thisMonth(entries: Entry[]) {
  const now = new Date();
  return entries.filter((entry) => {
    const at = new Date(entry.consumedAt);
    return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
  }).length;
}

function sentence(symbol: FortuneSymbol, entries: Entry[], friends: number): string {
  switch (symbol) {
    case 'bird':
      return friends > 0 ? t('fortune.bird.friends') : t('fortune.bird.alone');
    case 'road': {
      const cafe = mostCommonCafe(entries);
      return cafe ? t('fortune.road.cafe', { cafe }) : t('fortune.road.none');
    }
    case 'heart': {
      const favorites = entries.filter((entry) => entry.isFavorite).length;
      if (favorites === 0) return t('fortune.heart.none');
      return favorites === 1 ? t('fortune.heart.one') : t('fortune.heart.some', { count: formatNumber(favorites) });
    }
    case 'fish': {
      const cups = thisMonth(entries);
      return cups === 1 ? t('fortune.fish.one') : t('fortune.fish.other', { count: formatNumber(cups) });
    }
    case 'key': {
      const next = buildAlbum(entries).find((card) => !card.latest);
      return next ? t('fortune.key.next', { name: next.name }) : t('fortune.key.done');
    }
    case 'moon': {
      const level = caffeineLevel(entries);
      return level?.clearAt
        ? t('fortune.moon.later', { time: formatDate(level.clearAt, 'time') })
        : t('fortune.moon.now');
    }
    case 'star': {
      const streak = computeStreak(entries).current;
      return streak > 1 ? t('fortune.star.streak', { count: formatNumber(streak) }) : t('fortune.star.start');
    }
  }
}

// Three shapes from the grounds of one cup, each with what it says.
export function readCup(cup: Entry, entries: Entry[], friends: number): Reading[] {
  const random = seeded(cup.id);
  const pool = [...symbols];
  const readings: Reading[] = [];
  // Three spots round the cup, so the shapes never sit on each other.
  const spots = [
    { x: -0.42, y: -0.38 },
    { x: 0.44, y: -0.12 },
    { x: -0.12, y: 0.45 },
  ];
  for (const spot of spots) {
    const symbol = pool.splice(Math.floor(random() * pool.length), 1)[0];
    readings.push({
      symbol,
      x: spot.x + (random() - 0.5) * 0.16,
      y: spot.y + (random() - 0.5) * 0.16,
      text: sentence(symbol, entries, friends),
    });
  }
  return readings;
}

// The scatter of grounds left on the cup's wall, also fixed for each cup.
export function groundsOf(cup: Entry, count = 22) {
  const random = seeded(`${cup.id}:grounds`);
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 0.85;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 0.04 + random() * 0.12,
      stretch: 0.5 + random(),
      turn: random() * 180,
      opacity: 0.35 + random() * 0.5,
    };
  });
}
