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

// The coffees and teas behind "Other", by the name they are saved under,
// for a typical medium serving like the types above. Most café drinks are
// built on a double shot; a red eye adds one to a filter coffee. A glass of
// Turkish tea is small and long steeped; herbal tea and hot chocolate have
// next to none.
const caffeineByName = new Map(
  Object.entries({
    Ristretto: 60,
    Lungo: 80,
    Doppio: 130,
    Macchiato: 65,
    Cortado: 130,
    Piccolo: 65,
    'Red Eye': 205,
    Affogato: 65,

    'Caramel Macchiato': 130,
    'Vanilla Latte': 130,
    'Spanish Latte': 130,
    'White Mocha': 130,
    'Pumpkin Spice Latte': 130,
    'Chai Latte': 50,
    'Hot Chocolate': 5,

    'Iced Americano': 130,
    'Iced Mocha': 130,
    'Iced Caramel Macchiato': 130,
    'Iced Shaken Espresso': 195,
    'Iced Brown Sugar Oat Shaken Espresso': 195,
    'Vanilla Sweet Cream Cold Brew': 185,
    'Nitro Cold Brew': 250,
    Frappé: 95,
    'Espresso Tonic': 130,
    'Iced Cappuccino': 130,
    'Iced Flat White': 130,
    'Iced Spanish Latte': 130,
    'Iced Vanilla Latte': 130,
    'Iced Matcha Latte': 70,
    'Iced Chai Latte': 50,

    'Pour Over': 140,
    Chemex: 140,
    'French Press': 140,
    AeroPress: 120,
    'Moka Pot': 130,
    Syphon: 140,

    'Turkish Tea': 30,
    'Black Tea': 45,
    'Green Tea': 30,
    'Earl Grey': 45,
    'Herbal Tea': 0,
    'Iced Tea': 30,
  }).map(([name, mg]) => [name.toLowerCase(), mg]),
);

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
  const base = isCoffeeType(entry.type)
    ? caffeineByType[entry.type]
    : (caffeineByName.get(entry.type?.trim().toLowerCase() ?? '') ?? UNKNOWN_CAFFEINE);
  return Math.round(base * (entry.size ? sizeFactor[entry.size] : 1));
}

export function totalCaffeine(entries: Entry[]): number {
  return entries.reduce((sum, entry) => sum + caffeineOf(entry), 0);
}
