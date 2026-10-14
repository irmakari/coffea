export const coffeeTypes = [
  'turkish',
  'espresso',
  'americano',
  'latte',
  'cappuccino',
  'flatWhite',
  'mocha',
  'coldBrew',
  'icedLatte',
  'filter',
  'matcha',
  'other',
] as const;

export type CoffeeType = (typeof coffeeTypes)[number];

export function isCoffeeType(value: string | null): value is CoffeeType {
  return value !== null && (coffeeTypes as readonly string[]).includes(value);
}

export const milkTypes = ['whole', 'lowFat', 'lactoseFree', 'oat', 'almond', 'soy', 'coconut'] as const;

export type MilkType = (typeof milkTypes)[number];

export function isMilkType(value: string | null): value is MilkType {
  return value !== null && (milkTypes as readonly string[]).includes(value);
}

// Milk is asked about for every type but the two that never take any.
export function takesMilk(type: CoffeeType | null): boolean {
  return type !== null && type !== 'turkish' && type !== 'espresso';
}

// How people write the predefined types when they type their own, reduced to
// plain lowercase letters: no accents, spaces or punctuation.
const typeSpellings: Record<string, CoffeeType> = {
  turkish: 'turkish',
  turkishcoffee: 'turkish',
  turkkahvesi: 'turkish',
  turkkahve: 'turkish',
  espresso: 'espresso',
  americano: 'americano',
  amerikano: 'americano',
  latte: 'latte',
  caffelatte: 'latte',
  cappuccino: 'cappuccino',
  cappucino: 'cappuccino',
  kapucino: 'cappuccino',
  flatwhite: 'flatWhite',
  mocha: 'mocha',
  moka: 'mocha',
  coldbrew: 'coldBrew',
  icedlatte: 'icedLatte',
  icelatte: 'icedLatte',
  buzlulatte: 'icedLatte',
  filter: 'filter',
  filtercoffee: 'filter',
  filtre: 'filter',
  filtrekahve: 'filter',
  matcha: 'matcha',
  matchalatte: 'matcha',
};

// A type written by hand that names one of the predefined types is read as
// that type, so it gets the same drawing and is counted together with it.
// Anything else is kept as written.
export function recognizeType(value: string | null): string | null {
  if (value === null || isCoffeeType(value)) return value;
  const spelling = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '');
  return typeSpellings[spelling] ?? value;
}

// A saved coffee, as the app reads it.
export type Entry = {
  id: string;
  name: string;
  // One of `coffeeTypes`, or the user's own wording.
  type: string | null;
  // One of `milkTypes`.
  milk: string | null;
  cafe: string | null;
  // Where the photo lives in private storage, and a temporary link to show it.
  photoPath: string | null;
  photoUrl: string | null;
  consumedAt: string;
  price: number | null;
  currency: string | null;
  rating: number | null;
  notes: string | null;
  isFavorite: boolean;
};

// What the entry form edits. Only `name` is required.
export type EntryDraft = {
  name: string;
  type: CoffeeType | null;
  // The coffee picked or typed behind "Other". Used when `type` is "other".
  customType: string;
  milk: MilkType | null;
  // A file on the device for a new photo, or the saved photo's link.
  photoUri: string | null;
  cafe: string;
  rating: number | null;
  // As typed. Empty means no price was recorded.
  price: string;
  // Used only when there is a price.
  currency: string;
  // Null means "now", decided at the moment of saving.
  consumedAt: string | null;
  notes: string;
};

export function emptyDraft(currency: string): EntryDraft {
  return {
    name: '',
    type: null,
    customType: '',
    milk: null,
    photoUri: null,
    cafe: '',
    rating: null,
    price: '',
    currency,
    consumedAt: null,
    notes: '',
  };
}

// Accepts "4.5" and "4,5", and "4." on the way to either, so the field does
// not complain halfway through an amount. Resolves to null for an empty
// field and to NaN for anything that is not a sensible amount.
export function parsePrice(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (!/^\d{1,7}([.,]\d{0,2})?$/.test(trimmed)) return NaN;
  return Number(trimmed.replace(',', '.'));
}

// A new price on an old entry takes the currency the user prefers today.
export function draftFromEntry(entry: Entry, fallbackCurrency: string): EntryDraft {
  const predefined = isCoffeeType(entry.type) ? entry.type : null;
  return {
    name: entry.name,
    type: predefined ?? (entry.type ? 'other' : null),
    customType: predefined ? '' : (entry.type ?? ''),
    milk: isMilkType(entry.milk) ? entry.milk : null,
    photoUri: entry.photoUrl,
    cafe: entry.cafe ?? '',
    rating: entry.rating,
    price: entry.price === null ? '' : String(entry.price),
    currency: entry.currency ?? fallbackCurrency,
    consumedAt: entry.consumedAt,
    notes: entry.notes ?? '',
  };
}

export const MAX_RATING = 5;
