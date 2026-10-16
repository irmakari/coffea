import 'expo-sqlite/localStorage/install';

export const palette = {
  espresso: '#2C1E1A',
  darkRoast: '#4A3028',
  mocha: '#806252',
  oatTaupe: '#B8A18D',
  warmCream: '#F6F1E9',
  softWhite: '#FFFCF8',
  mutedText: '#8A7B72',
  subtleBorder: '#E8DED4',
  // A warm tan between oat and mocha, for hero blocks and highlights.
  latte: '#D9BBA0',
} as const;

// Semantic roles. Components use these, never the raw palette, so the
// identity can be tuned in one place.
const latte = {
  // Pages are warm cream; cards, fields and controls sit on top in soft white.
  background: palette.warmCream,
  surface: palette.softWhite,
  // Full pages that rise over a hero, like a coffee's details: the page
  // colour, so no pale block sits under the words.
  sheet: palette.warmCream,
  highlight: palette.latte,
  surfacePressed: palette.subtleBorder,
  border: palette.subtleBorder,
  borderStrong: palette.oatTaupe,

  text: palette.espresso,
  // Mocha passes AA on both backgrounds; use it for readable secondary copy.
  textSecondary: palette.mocha,
  // Muted is ~4:1 on soft white: captions and inactive states only.
  textMuted: palette.mutedText,
  textOnAccent: palette.softWhite,

  accent: palette.espresso,
  accentPressed: palette.darkRoast,
  placeholder: palette.oatTaupe,

  danger: '#8C3A2B',
  // What lifts the few raised things off the page; never the text colour,
  // which turns light on a dark theme.
  shadow: palette.espresso,

  // The block that opens the home page, and what sits on it.
  hero: palette.latte,
  heroText: palette.espresso,
  heroTextSecondary: palette.darkRoast,
  heroAction: palette.espresso,
  heroActionText: palette.softWhite,

  // The dark board the friends leaderboard sits on.
  boardCard: palette.espresso,
  boardRaised: palette.darkRoast,
  boardText: palette.softWhite,
  boardMuted: palette.oatTaupe,
  boardAccent: palette.latte,
};

export type ColorName = keyof typeof latte;
// `dark` is the page, `darkHero` the block at the top of home: each says
// whether the clock and battery above it should be drawn light.
type Theme = { dark: boolean; darkHero: boolean; colors: Record<ColorName, string> };

// A dark roast: the page is the cup, cards sit a shade lighter, and latte
// is the one light thing, on buttons and what is picked.
const espresso: Theme['colors'] = {
  background: '#1C1411',
  surface: '#2A1F1B',
  sheet: '#1C1411',
  highlight: '#5C4436',
  surfacePressed: '#3A2C26',
  border: '#3A2C26',
  borderStrong: '#5A463C',

  text: '#F3E9DD',
  textSecondary: '#C9B3A0',
  textMuted: '#9C8676',
  textOnAccent: '#2B1F1A',

  accent: palette.latte,
  accentPressed: '#C4A389',
  placeholder: '#7A6558',

  danger: '#E08A74',
  shadow: '#000000',

  hero: '#2E221D',
  heroText: palette.softWhite,
  heroTextSecondary: palette.oatTaupe,
  heroAction: palette.latte,
  heroActionText: '#2B1F1A',

  boardCard: '#2A1F1B',
  boardRaised: '#3A2C26',
  boardText: palette.softWhite,
  boardMuted: palette.oatTaupe,
  boardAccent: palette.latte,
};

// Whisked matcha: a pale tea page, a soft green hero, deep leaf ink.
const matcha: Theme['colors'] = {
  background: '#F2F4EA',
  surface: '#FCFDF8',
  sheet: '#F2F4EA',
  highlight: '#BCD09A',
  surfacePressed: '#DFE6D0',
  border: '#DFE6D0',
  borderStrong: '#A8B795',

  text: '#1E2A1A',
  textSecondary: '#55694A',
  textMuted: '#717F67',
  textOnAccent: '#FCFDF8',

  accent: '#3E5B2C',
  accentPressed: '#2E4720',
  placeholder: '#A8B795',

  danger: '#8C3A2B',
  shadow: '#1E2A1A',

  hero: '#BCD09A',
  heroText: '#1E2A1A',
  heroTextSecondary: '#2E4720',
  heroAction: '#3E5B2C',
  heroActionText: '#FCFDF8',

  boardCard: '#26361E',
  boardRaised: '#3A4F2D',
  boardText: '#FCFDF8',
  boardMuted: '#A9BC92',
  boardAccent: '#BCD09A',
};

export const themes = {
  latte: { dark: false, darkHero: false, colors: latte },
  espresso: { dark: true, darkHero: true, colors: espresso },
  matcha: { dark: false, darkHero: false, colors: matcha },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

// The look is a matter of taste on this phone, so it is kept on the device
// rather than with the account. It is read before any screen draws.
const KEY = 'coffea.theme';

function savedTheme(): ThemeName {
  const saved = localStorage.getItem(KEY);
  return saved && saved in themes ? (saved as ThemeName) : 'latte';
}

let current: ThemeName = savedTheme();

// One object for the life of the app, refilled when the theme changes, so
// everything reading `colors.x` at render time picks the new value up.
export const colors: Record<ColorName, string> = { ...themes[current].colors };

// Bumped on every change; themed styles rebuild when it moves.
let version = 0;

export function themeVersion(): number {
  return version;
}

export function currentTheme(): ThemeName {
  return current;
}

export function isDarkTheme(): boolean {
  return themes[current].dark;
}

export function isDarkHero(): boolean {
  return themes[current].darkHero;
}

export function applyTheme(name: ThemeName) {
  current = name;
  localStorage.setItem(KEY, name);
  Object.assign(colors, themes[name].colors);
  version += 1;
}

// A hex colour at the given opacity, for washes over photos and pages.
export function withAlpha(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
