import { Pressable, useWindowDimensions, View } from 'react-native';

import { CupMark, PageHeader, Screen, Text } from '@/components/ui';
import { coffeeTypes, isCoffeeType } from '@/features/entries/types';
import { setTabCup, useTabCup } from '@/features/profile/tabCup';
import { t } from '@/i18n';
import { colors, contentColumn, radii, spacing, themed } from '@/theme';

const COLUMNS = 3;

// The plain cup first, then every type with a drawing of its own.
const cups: (string | null)[] = [null, ...coffeeTypes.filter((type) => type !== 'other')];

const rows: (string | null)[][] = [];
for (let index = 0; index < cups.length; index += COLUMNS) rows.push(cups.slice(index, index + COLUMNS));

export default function CupScreen() {
  const chosen = useTabCup();
  const { width } = useWindowDimensions();
  // The drawing is sized to its tile, which takes a third of the page.
  const column = Math.min(width, contentColumn.maxWidth) - spacing.screen * 2;
  const tile = (column - spacing.md * (COLUMNS - 1)) / COLUMNS;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('settings.cup.title')} subtitle={t('settings.cup.body')} />

      <View style={styles.preview}>
        <CupMark tan drink={chosen} size={96} />
      </View>

      <View style={styles.grid} accessibilityRole="radiogroup">
        {rows.map((row) => (
          <View key={row[0] ?? 'classic'} style={styles.row}>
            {row.map((cup) => {
              const selected = chosen === cup;
              const label = isCoffeeType(cup) ? t(`coffeeTypes.${cup}`) : t('settings.cup.classic');
              return (
                <Pressable
                  key={cup ?? 'classic'}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => setTabCup(cup)}
                  style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
                >
                  <View style={[styles.tile, selected && styles.tileSelected]}>
                    <CupMark drink={cup} size={Math.round(tile * 0.68)} />
                  </View>
                  <Text
                    variant={selected ? 'label' : 'caption'}
                    color={selected ? 'text' : 'textSecondary'}
                    align="center"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = themed(() => ({
  preview: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  grid: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  tile: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.highlight,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    borderColor: colors.accent,
  },
}));
