import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { t } from '@/i18n';
import { sizes, spacing } from '@/theme';

import { Icon } from './Icon';

const GLYPH = 24;

// A bare chevron, with nothing behind it. Its touch target is wider than the
// glyph, so it is pulled left until the chevron itself, not the empty space
// around it, sits on the page's edge in line with the text below.
export function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      onPress={() => router.back()}
      hitSlop={spacing.sm}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="chevronLeft" size={GLYPH} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.chip,
    height: sizes.chip,
    alignItems: 'center',
    justifyContent: 'center',
    // Half the spare width, plus the blank third of the glyph's own box.
    marginLeft: -((sizes.chip - GLYPH) / 2 + GLYPH / 3),
  },
  pressed: {
    opacity: 0.5,
  },
});
