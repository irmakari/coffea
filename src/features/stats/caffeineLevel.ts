import type { Entry } from '@/features/entries/types';

import { caffeineOf } from './caffeine';

const HOUR = 60 * 60 * 1000;

// Caffeine halves in the body every five hours or so, more or less for
// everyone, once it has been taken in over about three quarters of an hour.
// Like the amounts themselves, this is a rough guide, never a measure.
const HALF_LIFE = 5 * HOUR;
const ABSORPTION = 0.75 * HOUR;

// Below about this much, most people fall asleep as they would without any.
export const SLEEP_LEVEL = 50;

// Less than this is what is left of yesterday's cups, too little to feel,
// so it counts as none.
const TRACE_LEVEL = 10;

// Coffees older than this have long since worn off.
const LOOK_BACK = 30 * HOUR;

type Dose = { at: number; mg: number };

function dosesOf(entries: Entry[], now: number): Dose[] {
  const doses: Dose[] = [];
  for (const entry of entries) {
    const at = new Date(entry.consumedAt).getTime();
    if (at > now || now - at > LOOK_BACK) continue;
    doses.push({ at, mg: caffeineOf(entry) });
  }
  return doses;
}

function levelAt(doses: Dose[], time: number): number {
  let total = 0;
  for (const { at, mg } of doses) {
    if (time < at) continue;
    // Held in full while it is taken in, then halving away.
    total += mg * Math.pow(0.5, Math.max(0, time - at - ABSORPTION) / HALF_LIFE);
  }
  return total;
}

export type CaffeineLevel = {
  // What is in the body now, in milligrams. A coffee still being taken in
  // counts in full: it is there the moment it is drunk.
  now: number;
  // When the level falls under the sleep line, if it is above it now.
  clearAt: Date | null;
};

// The caffeine in the body now, and when it will be low enough for sleep
// as no more coffees are drunk. Null when nothing recent was drunk.
export function caffeineLevel(entries: Entry[]): CaffeineLevel | null {
  const now = Date.now();
  const doses = dosesOf(entries, now);
  if (doses.length === 0) return null;
  const left = levelAt(doses, now);
  const level = left < TRACE_LEVEL ? 0 : left;

  let clearAt: Date | null = null;
  if (level >= SLEEP_LEVEL) {
    // From now on the level only falls, so the first quarter hour under the
    // line is when it is crossed.
    for (let time = now; time < now + 48 * HOUR; time += HOUR / 4) {
      if (levelAt(doses, time) < SLEEP_LEVEL) {
        clearAt = new Date(time);
        break;
      }
    }
  }
  return { now: level, clearAt };
}
