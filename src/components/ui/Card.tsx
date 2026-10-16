import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors, radii, spacing, themed } from '@/theme';

type CardProps = {
  children: ReactNode;
  // Cards that hold a full-width photo or their own rows opt out of padding.
  padded?: boolean;
  // Only an outline on the page, for cards that should not lay a pale block
  // over the page colour.
  outline?: boolean;
  style?: ViewStyle;
};

// The app's one container: a soft white block with a generous corner on the
// warm page. Flat on purpose; depth comes from colour, not shadow.
export function Card({ children, padded = true, outline = false, style }: CardProps) {
  return <View style={[styles.card, outline && styles.outline, padded && styles.padded, style]}>{children}</View>;
}

const styles = themed(() => ({
  card: {
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: {
    padding: spacing.xl - 4,
  },
}));
