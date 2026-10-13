import type { Entry } from '@/features/entries/types';

export type Tally = { label: string; count: number };

export type Stats = {
  total: number;
  // The earliest coffee in the journal.
  since: string | null;
  // Null when no entry has that detail, so the screen can leave it out.
  topType: Tally | null;
  topCafe: Tally | null;
  distinctCafes: number;
  // One total per currency. Amounts in different currencies are never added.
  spending: { currency: string; total: number; count: number }[];
  topRated: Entry[];
};

const TOP_RATED_COUNT = 3;

export const statsPeriods = ['week', 'month', 'year', 'all'] as const;
export type StatsPeriod = (typeof statsPeriods)[number];

// The calendar week (from Monday), month or year that `now` falls in.
export function entriesInPeriod(entries: Entry[], period: StatsPeriod, now = new Date()): Entry[] {
  if (period === 'all') return entries;

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (period === 'month') start.setDate(1);
  if (period === 'year') start.setMonth(0, 1);

  return entries.filter((entry) => new Date(entry.consumedAt) >= start);
}

// The most common value, counted without regard to case or stray spaces.
// A tie goes to whichever value was logged most recently.
function mostCommon(values: (string | null)[]): { top: Tally | null; distinct: number } {
  const tallies = new Map<string, Tally>();
  for (const value of values) {
    const label = value?.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const tally = tallies.get(key);
    if (tally) {
      tally.count += 1;
    } else {
      tallies.set(key, { label, count: 1 });
    }
  }

  let top: Tally | null = null;
  for (const tally of tallies.values()) {
    if (!top || tally.count > top.count) top = tally;
  }
  return { top, distinct: tallies.size };
}

// Everything is derived from the entries passed in (newest first); nothing
// is stored, so the numbers can never drift from the journal.
export function computeStats(entries: Entry[]): Stats {
  const types = mostCommon(entries.map((entry) => entry.type));
  const cafes = mostCommon(entries.map((entry) => entry.cafe));

  const totals = new Map<string, { total: number; count: number }>();
  for (const entry of entries) {
    if (entry.price === null || !entry.currency || !Number.isFinite(entry.price)) continue;
    const running = totals.get(entry.currency) ?? { total: 0, count: 0 };
    // Summed in whole cents to avoid floating-point drift.
    running.total += Math.round(entry.price * 100);
    running.count += 1;
    totals.set(entry.currency, running);
  }

  const topRated = entries
    .filter((entry) => entry.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, TOP_RATED_COUNT);

  return {
    total: entries.length,
    since: entries.at(-1)?.consumedAt ?? null,
    topType: types.top,
    topCafe: cafes.top,
    distinctCafes: cafes.distinct,
    spending: [...totals.entries()]
      .map(([currency, { total, count }]) => ({ currency, total: total / 100, count }))
      .sort((a, b) => b.count - a.count),
    topRated,
  };
}
