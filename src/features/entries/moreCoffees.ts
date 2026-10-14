import type { TranslationKey } from '@/i18n';

// The longer list behind "Other": coffees worth a tap of their own, though
// not a place in the short row of types. They are saved as written, exactly
// like a type the user typed in, so they are names rather than translation
// keys. A name may be at most 40 characters, the limit of the column.
export const moreCoffees: { title: TranslationKey; names: string[] }[] = [
  {
    title: 'entry.more.groups.espresso',
    names: ['Ristretto', 'Lungo', 'Doppio', 'Macchiato', 'Cortado', 'Piccolo', 'Red Eye', 'Affogato'],
  },
  {
    title: 'entry.more.groups.milk',
    names: [
      'Caramel Macchiato',
      'Vanilla Latte',
      'Spanish Latte',
      'White Mocha',
      'Pumpkin Spice Latte',
      'Chai Latte',
      'Hot Chocolate',
    ],
  },
  {
    title: 'entry.more.groups.iced',
    names: [
      'Iced Americano',
      'Iced Mocha',
      'Iced Caramel Macchiato',
      'Iced Shaken Espresso',
      'Iced Brown Sugar Oat Shaken Espresso',
      'Vanilla Sweet Cream Cold Brew',
      'Nitro Cold Brew',
      'Frappé',
      'Espresso Tonic',
    ],
  },
  {
    title: 'entry.more.groups.brewed',
    names: ['Pour Over', 'Chemex', 'French Press', 'AeroPress', 'Moka Pot', 'Syphon'],
  },
];
