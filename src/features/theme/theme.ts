import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useSyncExternalStore } from 'react';

import { applyTheme, currentTheme, isDarkHero, isDarkTheme, type ThemeName } from '@/theme';

const listeners = new Set<() => void>();

export function setTheme(name: ThemeName) {
  if (name === currentTheme()) return;
  applyTheme(name);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme(): ThemeName {
  return useSyncExternalStore(subscribe, currentTheme);
}

// For screens whose hero runs up behind the clock and battery: draws them
// light while such a screen is in front, when the theme's hero is dark. A
// count, since one hero screen can gain focus before another lets it go.
let heroScreens = 0;

export function useHeroStatusBar() {
  useFocusEffect(
    useCallback(() => {
      if (!isDarkHero()) return;
      heroScreens += 1;
      setStatusBarStyle('light');
      return () => {
        heroScreens -= 1;
        if (heroScreens === 0) setStatusBarStyle(isDarkTheme() ? 'light' : 'dark');
      };
    }, []),
  );
}
