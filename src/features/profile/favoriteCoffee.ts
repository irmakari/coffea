import 'expo-sqlite/localStorage/install';

import { useMemo, useSyncExternalStore } from 'react';

import { useEntries } from '@/features/entries/EntriesProvider';
import { isCoffeeType, type Entry } from '@/features/entries/types';
import { computeStats } from '@/features/stats/stats';
import { t } from '@/i18n';

// The coffee the evening reminder offers. Picked by hand, or left to the
// journal, where it is the one logged most often. Kept apart from the tab bar
// cup, which is changed on a whim. On this phone, like the reminder itself.
const KEY = 'coffea.favoriteCoffee';

let chosen: string | null = localStorage.getItem(KEY);
const listeners = new Set<() => void>();

export function setFavoriteCoffee(drink: string | null) {
  chosen = drink;
  if (drink === null) {
    localStorage.removeItem(KEY);
  } else {
    localStorage.setItem(KEY, drink);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// The one picked by hand, or null when the journal decides.
export function useChosenFavorite(): string | null {
  return useSyncExternalStore(subscribe, () => chosen);
}

// The journal's choice: the type logged most often, if any.
export function mostOften(entries: Entry[]): string | null {
  return computeStats(entries).topType?.label ?? null;
}

export function favoriteOf(entries: Entry[], picked: string | null): string | null {
  return picked ?? mostOften(entries);
}

// The favorite as the reminder and the profile use it.
export function useFavoriteCoffee(): string | null {
  const { entries } = useEntries();
  const picked = useChosenFavorite();
  return useMemo(() => favoriteOf(entries, picked), [entries, picked]);
}

export function coffeeLabel(drink: string) {
  return isCoffeeType(drink) ? t(`coffeeTypes.${drink}`) : drink;
}
