import { isCoffeeType, MAX_RATING, type Entry } from '@/features/entries/types';
import { formatNumber, t } from '@/i18n';

export const collectionKinds = ['favorites', 'fiveStars', 'type', 'cafe'] as const;
export type CollectionKind = (typeof collectionKinds)[number];

export function isCollectionKind(value: string | undefined): value is CollectionKind {
  return value !== undefined && (collectionKinds as readonly string[]).includes(value);
}

// Coffees with something in common. Nothing is stored: every collection is
// worked out from the journal, so it can never fall out of step with it.
export type Collection = {
  kind: CollectionKind;
  // The type or café being collected. Empty for favorites and five stars.
  value: string;
  name: string;
  // Newest first, like the journal they come from.
  entries: Entry[];
};

// Types and cafés are matched without regard to case or stray spaces.
function normalize(text: string) {
  return text.trim().toLowerCase();
}

function nameOf(kind: CollectionKind, value: string): string {
  switch (kind) {
    case 'favorites':
      return t('collections.favorites');
    case 'fiveStars':
      return t('collections.fiveStars');
    case 'type':
      return isCoffeeType(value) ? t(`coffeeTypes.${value}`) : value;
    case 'cafe':
      return value;
  }
}

export function collect(entries: Entry[], kind: CollectionKind, value = ''): Collection {
  const wanted = normalize(value);
  const belongs = (entry: Entry) => {
    switch (kind) {
      case 'favorites':
        return entry.isFavorite;
      case 'fiveStars':
        return entry.rating === MAX_RATING;
      case 'type':
        return entry.type !== null && normalize(entry.type) === wanted;
      case 'cafe':
        return entry.cafe !== null && normalize(entry.cafe) === wanted;
    }
  };
  return { kind, value, name: nameOf(kind, value), entries: entries.filter(belongs) };
}

// One collection for every type or café in the journal, the fullest first.
// A tie goes to whichever was logged most recently.
export function collectBy(entries: Entry[], kind: 'type' | 'cafe'): Collection[] {
  const groups = new Map<string, Collection>();
  for (const entry of entries) {
    const value = (kind === 'type' ? entry.type : entry.cafe)?.trim();
    if (!value) continue;
    const group = groups.get(normalize(value));
    if (group) {
      group.entries.push(entry);
    } else {
      groups.set(normalize(value), { kind, value, name: nameOf(kind, value), entries: [entry] });
    }
  }
  return [...groups.values()].sort((a, b) => b.entries.length - a.entries.length);
}

// The coffee that stands for a collection: the newest one with a photograph,
// or failing that the newest one, which is then drawn.
export function coverOf(collection: Collection): Entry | null {
  return collection.entries.find((entry) => entry.photoUrl) ?? collection.entries[0] ?? null;
}

export function countLabel(count: number): string {
  if (count === 0) return t('collections.count.none');
  return count === 1 ? t('collections.count.one') : t('collections.count.other', { count: formatNumber(count) });
}
