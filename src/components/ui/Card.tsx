import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';

type CardProps = {
  children: ReactNode;
  // Cards that hold a full-width photo or their own rows opt out of padding.
  padded?: boolean;
  style?: ViewStyle;
};

// The app's one container: a soft white block with a generous corner on the
// warm page. Flat on purpose; depth comes from colour, not shadow.
export function Card({ children, padded = true, style }: CardProps) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.xl - 4,
  },
});
