import { isCoffeeType, type CoffeeType, type Entry } from '@/features/entries/types';

// A rough figure for a typical café serving, in milligrams. Cups vary a lot
// with the beans and the barista, so this is an estimate, never a measure.
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

export function caffeineOf(entry: Entry): number {
  return isCoffeeType(entry.type) ? caffeineByType[entry.type] : UNKNOWN_CAFFEINE;
}

export function totalCaffeine(entries: Entry[]): number {
  return entries.reduce((sum, entry) => sum + caffeineOf(entry), 0);
}
