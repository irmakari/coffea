import { Pressable, StyleSheet } from 'react-native';

import { colors, radii, sizes, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';

type IconButtonProps = {
  icon: IconName;
  // Read by screen readers, since the button has no visible text.
  label: string;
  filled?: boolean;
  // Just the glyph, a little larger, with no disc behind it.
  plain?: boolean;
  onPress: () => void;
};

export function IconButton({ icon, label, filled, plain = false, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.button,
        plain ? pressed && styles.plainPressed : [styles.disc, pressed && styles.pressed],
      ]}
    >
      <Icon name={icon} size={plain ? 22 : 18} filled={filled} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.chip,
    height: sizes.chip,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  plainPressed: {
    opacity: 0.5,
  },
});
