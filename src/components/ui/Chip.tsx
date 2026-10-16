import { Pressable, StyleSheet } from 'react-native';

import { colors, radii, sizes, spacing } from '@/theme';

import { Text } from './Text';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  // Unselected, just the word on the page: for a switch between views,
  // where the selected one already shows what can be tapped.
  plain?: boolean;
};

// An unselected chip is soft white, like every other control on the warm
// page. Its hairline alone is too faint there to say it can be tapped.
export function Chip({ label, selected, onPress, plain = false }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        plain && styles.plain,
        selected && styles.selected,
        pressed && !selected && (plain ? styles.plainPressed : styles.pressed),
      ]}
    >
      <Text variant="label" color={selected ? 'textOnAccent' : 'text'} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  plain: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  plainPressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 14,
  },
});
