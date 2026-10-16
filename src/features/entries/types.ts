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

export const servingSizes = ['small', 'medium', 'large'] as const;
export type Size = (typeof servingSizes)[number];

export const shotCounts = [1, 2, 3, 4] as const;
export type Shots = (typeof shotCounts)[number];

export const temperatures = ['hot', 'iced'] as const;
export type Temperature = (typeof temperatures)[number];

export const venues = ['cafe', 'home', 'takeaway'] as const;
export type Venue = (typeof venues)[number];

function oneOf<T extends string | number>(list: readonly T[], value: unknown): T | null {
  return (list as readonly unknown[]).includes(value) ? (value as T) : null;
}

export const asSize = (value: unknown) => oneOf(servingSizes, value);
export const asShots = (value: unknown) => oneOf(shotCounts, value);
export const asTemperature = (value: unknown) => oneOf(temperatures, value);
export const asVenue = (value: unknown) => oneOf(venues, value);

// Shots are asked about for the drinks made from espresso. Turkish coffee,
// filter, cold brew and matcha are brewed some other way.
export function takesShots(type: CoffeeType | null): boolean {
  return type !== null && type !== 'turkish' && type !== 'filter' && type !== 'coldBrew' && type !== 'matcha';
}

// A Turkish coffee or an espresso comes in one size.
export function takesSize(type: CoffeeType | null): boolean {
  return type !== 'turkish' && type !== 'espresso';
}

// Hot or iced is asked only where both are ordered. Turkish coffee and
// espresso come hot; cold brew and an iced latte say it in their name.
export function takesTemperature(type: CoffeeType | null): boolean {
  return type !== 'turkish' && type !== 'espresso' && type !== 'coldBrew' && type !== 'icedLatte';
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
  // A smaller copy made for the old friends feed, removed with the photo.
  photoThumbPath: string | null;
  consumedAt: string;
  price: number | null;
  currency: string | null;
  rating: number | null;
  notes: string | null;
  isFavorite: boolean;
  size: Size | null;
  shots: Shots | null;
  temperature: Temperature | null;
  // Had at a café, at home, or taken away.
  venue: Venue | null;
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
  size: Size | null;
  shots: Shots | null;
  temperature: Temperature | null;
  venue: Venue | null;
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
    size: null,
    shots: null,
    temperature: null,
    venue: null,
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
    size: entry.size,
    shots: entry.shots,
    temperature: entry.temperature,
    venue: entry.venue,
  };
}

export const MAX_RATING = 5;
