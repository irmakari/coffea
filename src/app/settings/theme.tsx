import { Pressable, View } from 'react-native';

import { Icon, PageHeader, Screen, Text } from '@/components/ui';
import { setTheme, useTheme } from '@/features/theme/theme';
import { t } from '@/i18n';
import { colors, sizes, spacing, themeNames, themes, themed } from '@/theme';

export default function ThemeScreen() {
  const theme = useTheme();

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('settings.theme.title')} subtitle={t('settings.theme.body')} />

      <View style={styles.rows}>
        {themeNames.map((name) => {
          const selected = theme === name;
          const swatch = themes[name].colors;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setTheme(name)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {/* The page, the hero and the hero's button of each theme. */}
              <View style={[styles.swatch, { backgroundColor: swatch.background, borderColor: swatch.border }]}>
                <View style={[styles.swatchDot, { backgroundColor: swatch.hero }]} />
                <View style={[styles.swatchDot, { backgroundColor: swatch.heroAction }]} />
              </View>
              <Text variant={selected ? 'bodyStrong' : 'body'} style={styles.rowText}>
                {t(`settings.theme.names.${name}`)}
              </Text>
              {selected ? <Icon name="check" size={20} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = themed(() => ({
  rows: {
    marginTop: spacing.xxl,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  swatch: {
    flexDirection: 'row',
    gap: 4,
    padding: 6,
    borderRadius: 999,
    borderWidth: sizes.hairline,
  },
  swatchDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.6,
  },
}));
