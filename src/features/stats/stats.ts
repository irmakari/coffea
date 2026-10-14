import type { Entry } from '@/features/entries/types';

export type Tally = { label: string; count: number };

export type Stats = {
  total: number;
  // The earliest coffee in the journal.
  since: string | null;
  // Null when no entry has that detail, so the screen can leave it out.
  topType: Tally | null;
  topCafe: Tally | null;
  distinctTypes: number;
  distinctCafes: number;
  // Calendar days with at least one coffee.
  activeDays: number;
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
    distinctTypes: types.distinct,
    distinctCafes: cafes.distinct,
    activeDays: new Set(entries.map((entry) => dayKey(new Date(entry.consumedAt)))).size,
    spending: [...totals.entries()]
      .map(([currency, { total, count }]) => ({ currency, total: total / 100, count }))
      .sort((a, b) => b.count - a.count),
    topRated,
  };
}

// How many coffees had been logged by this point of the previous month, so
// a month that has only just begun is not held against a whole one.
export function countByThisTimeLastMonth(entries: Entry[], now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // The 31st has no match in a shorter month; its last day stands in.
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const end = new Date(start);
  end.setDate(Math.min(now.getDate(), lastDay));
  end.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

  return entries.filter((entry) => {
    const at = new Date(entry.consumedAt);
    return at >= start && at <= end;
  }).length;
}

export type Streak = {
  // Days in a row with a coffee, up to today. While today is still empty the
  // run up to yesterday counts, since it is not broken yet.
  current: number;
  best: number;
  loggedToday: boolean;
};

// Days are the phone's own calendar days, not UTC ones.
function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function shiftDays(date: Date, days: number) {
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

export function computeStreak(entries: Entry[], now = new Date()): Streak {
  const days = new Map<string, Date>();
  for (const entry of entries) {
    const day = shiftDays(new Date(entry.consumedAt), 0);
    days.set(dayKey(day), day);
  }

  const runEndingOn = (end: Date) => {
    let length = 0;
    for (let day = end; days.has(dayKey(day)); day = shiftDays(day, -1)) length += 1;
    return length;
  };

  let best = 0;
  for (const day of days.values()) {
    // Only the last day of a run is worth counting back from.
    if (!days.has(dayKey(shiftDays(day, 1)))) best = Math.max(best, runEndingOn(day));
  }

  const loggedToday = days.has(dayKey(now));
  return { current: runEndingOn(loggedToday ? now : shiftDays(now, -1)), best, loggedToday };
}

// The last `count` days, oldest first, each with the newest coffee logged on
// it. Expects the entries newest first.
export function recentDays(entries: Entry[], count: number, now = new Date()): { date: Date; entry: Entry | null }[] {
  const newest = new Map<string, Entry>();
  for (const entry of entries) {
    const key = dayKey(new Date(entry.consumedAt));
    if (!newest.has(key)) newest.set(key, entry);
  }
  return Array.from({ length: count }, (_, index) => {
    const date = shiftDays(now, index - (count - 1));
    return { date, entry: newest.get(dayKey(date)) ?? null };
  });
}
