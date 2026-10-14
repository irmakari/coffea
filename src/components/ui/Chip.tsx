import { Pressable, StyleSheet } from 'react-native';

import { colors, radii, sizes, spacing } from '@/theme';

import { Text } from './Text';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// An unselected chip is soft white, like every other control on the warm
// page. Its hairline alone is too faint there to say it can be tapped.
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && !selected && styles.pressed]}
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
  label: {
    fontSize: 14,
  },
});
