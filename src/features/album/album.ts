import { moreCoffees } from '@/features/entries/moreCoffees';
import { coffeeTypes, isCoffeeType, type Entry } from '@/features/entries/types';
import { t } from '@/i18n';

// One coffee to collect: a type key from `coffeeTypes`, or the name of one
// of the coffees behind "Other", as the journal saves them.
export type AlbumSlot = {
  // 1-based, the order the album shows them in.
  number: number;
  value: string;
  name: string;
};

export type AlbumCard = AlbumSlot & {
  // The newest coffee of this kind, or null while it is still to collect.
  latest: Entry | null;
  count: number;
};

// Every coffee the app knows by name, the short row of types first. Coffees
// typed in by hand are not part of it: there is no end to those.
export function albumSlots(): AlbumSlot[] {
  const values = [
    ...coffeeTypes.filter((type) => type !== 'other'),
    ...moreCoffees.flatMap((group) => group.names),
  ];
  return values.map((value, index) => ({
    number: index + 1,
    value,
    name: isCoffeeType(value) ? t(`coffeeTypes.${value}`) : value,
  }));
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

// Worked out from the journal, newest first, so it is never out of step.
export function buildAlbum(entries: Entry[]): AlbumCard[] {
  const byValue = new Map<string, { latest: Entry; count: number }>();
  for (const entry of entries) {
    if (!entry.type) continue;
    const key = normalize(entry.type);
    const seen = byValue.get(key);
    if (seen) {
      seen.count += 1;
    } else {
      byValue.set(key, { latest: entry, count: 1 });
    }
  }
  return albumSlots().map((slot) => {
    const seen = byValue.get(normalize(slot.value));
    return { ...slot, latest: seen?.latest ?? null, count: seen?.count ?? 0 };
  });
}

export function collectedCount(cards: AlbumCard[]) {
  return cards.filter((card) => card.latest).length;
}

// "#007"
export function slotNumber(number: number) {
  return `#${String(number).padStart(3, '0')}`;
}
