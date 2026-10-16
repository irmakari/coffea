import { isCoffeeType, type CoffeeType, type Entry, type Size } from '@/features/entries/types';

// A rough figure for a typical, medium café serving, in milligrams. Cups vary
// a lot with the beans and the barista, so this is an estimate, never a measure.
const caffeineByType: Record<CoffeeType, number> = {
  turkish: 60,
  espresso: 65,
  americano: 130,
  latte: 130,
  cappuccino: 130,
  flatWhite: 130,
  mocha: 130,
  coldBrew: 200,
  icedLatte: 130,
  filter: 140,
  matcha: 70,
  other: 100,
};

// A coffee with no type, or one written by hand, counts as an average cup.
const UNKNOWN_CAFFEINE = 100;

// One shot of espresso.
const PER_SHOT = 65;

// A brewed coffee scales with the cup. Espresso drinks scale with their shots
// instead, which a bigger cup mostly fills with milk or water.
const sizeFactor: Record<Size, number> = {
  small: 0.75,
  medium: 1,
  large: 1.4,
};

export function caffeineOf(entry: Entry): number {
  // The shots, when they were given, are the most direct measure there is.
  if (entry.shots) return entry.shots * PER_SHOT;
  const base = isCoffeeType(entry.type) ? caffeineByType[entry.type] : UNKNOWN_CAFFEINE;
  return Math.round(base * (entry.size ? sizeFactor[entry.size] : 1));
}

export function totalCaffeine(entries: Entry[]): number {
  return entries.reduce((sum, entry) => sum + caffeineOf(entry), 0);
}
