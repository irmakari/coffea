import 'expo-sqlite/localStorage/install';

// Cafés taken out of the form's suggestions, such as one saved with a typo.
// Kept on this phone by their lowercase name; the coffees keep their café.
const KEY = 'coffea.hiddenCafes';

export function hiddenCafes(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

export function hideCafe(cafe: string) {
  const hidden = hiddenCafes();
  hidden.add(cafe.trim().toLowerCase());
  localStorage.setItem(KEY, JSON.stringify([...hidden]));
}
