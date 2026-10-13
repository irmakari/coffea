export const coffeeTypes = [
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

// A saved coffee, as the app reads it.
export type Entry = {
  id: string;
  name: string;
  // One of `coffeeTypes`, or the user's own wording.
  type: string | null;
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
  // Free text shown when `type` is "other".
  customType: string;
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
    photoUri: null,
    cafe: '',
    rating: null,
    price: '',
    currency,
    consumedAt: null,
    notes: '',
  };
}

// Accepts "4.5" and "4,5". Resolves to null for an empty field and to NaN
// for anything that is not a sensible amount.
export function parsePrice(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(trimmed)) return NaN;
  return Number(trimmed.replace(',', '.'));
}

// A new price on an old entry takes the currency the user prefers today.
export function draftFromEntry(entry: Entry, fallbackCurrency: string): EntryDraft {
  const predefined = isCoffeeType(entry.type) ? entry.type : null;
  return {
    name: entry.name,
    type: predefined ?? (entry.type ? 'other' : null),
    customType: predefined ? '' : (entry.type ?? ''),
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
