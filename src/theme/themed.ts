import { StyleSheet } from 'react-native';

import { themeVersion } from './colors';

// StyleSheet.create, but read when a screen draws rather than when the file
// loads, and built again after the theme changes. The factory reads
// `colors` like any style would.
export function themed<T extends StyleSheet.NamedStyles<T>>(factory: () => T): T {
  let built: T | undefined;
  let builtFor = -1;
  const current = () => {
    if (builtFor !== themeVersion()) {
      built = StyleSheet.create(factory());
      builtFor = themeVersion();
    }
    return built as T;
  };
  return new Proxy({} as T, {
    get: (_, key) => current()[key as keyof T],
  });
}
