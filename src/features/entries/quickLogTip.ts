import 'expo-sqlite/localStorage/install';

// The tab bar's cup opens a picker when held, which nothing on screen says.
// A tip points it out until it has been seen once on this phone.
const KEY = 'coffea.quickLogTipSeen';

export function quickLogTipSeen() {
  return localStorage.getItem(KEY) === '1';
}

export function markQuickLogTipSeen() {
  localStorage.setItem(KEY, '1');
}
