// 4pt scale. Screens use `screen` as their horizontal gutter.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  screen: 24,
} as const;

// Three radii only: controls, photographs and panels, and fully round.
export const radii = {
  control: 16,
  frame: 26,
  pill: 999,
} as const;

export const sizes = {
  // Minimum comfortable touch target on both platforms.
  touch: 48,
  control: 54,
  chip: 40,
  hairline: 1,
} as const;

// Coffee photographs are always shown in one of these crops.
export const photoRatio = {
  portrait: 4 / 5,
  landscape: 4 / 3,
  square: 1,
} as const;
