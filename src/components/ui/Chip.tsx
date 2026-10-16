import { Pressable } from 'react-native';

import { colors, radii, sizes, spacing, themed } from '@/theme';

import { Text } from './Text';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  // Unselected, just the word on the page: for a switch between views,
  // where the selected one already shows what can be tapped.
  plain?: boolean;
  // For a second, rarer action on the same chip, such as removing it.
  onLongPress?: () => void;
  accessibilityHint?: string;
};

// An unselected chip is soft white, like every other control on the warm
// page. Its hairline alone is too faint there to say it can be tapped.
export function Chip({ label, selected, onPress, plain = false, onLongPress, accessibilityHint }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onLongPress={onLongPress}
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

const styles = themed(() => ({
  chip: {
    minHeight: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    // An outline on the page until picked, like the outlined cards.
    borderWidth: 1,
    borderColor: colors.border,
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
}));
