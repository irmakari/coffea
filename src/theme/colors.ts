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
export const colors = {
  // Pages are warm cream; cards, fields and controls sit on top in soft white.
  background: palette.warmCream,
  surface: palette.softWhite,
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
} as const;

export type ColorName = keyof typeof colors;
