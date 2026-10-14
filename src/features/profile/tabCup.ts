import 'expo-sqlite/localStorage/install';

import { useSyncExternalStore } from 'react';

// Which coffee is drawn in the middle of the tab bar. It is a matter of
// taste on this phone, so it is kept on the device rather than with the
// account. Null is the plain cup.
const KEY = 'coffea.tabCup';

let current: string | null = localStorage.getItem(KEY);
const listeners = new Set<() => void>();

export function setTabCup(drink: string | null) {
  current = drink;
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

export function useTabCup(): string | null {
  return useSyncExternalStore(subscribe, () => current);
}
