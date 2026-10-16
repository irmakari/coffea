import { Pressable, useWindowDimensions, View } from 'react-native';

import { CupMark, PageHeader, Screen, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { coffeeTypes } from '@/features/entries/types';
import {
  coffeeLabel,
  mostOften,
  setFavoriteCoffee,
  useChosenFavorite,
} from '@/features/profile/favoriteCoffee';
import { t } from '@/i18n';
import { colors, contentColumn, radii, spacing, themed } from '@/theme';

const COLUMNS = 3;

// "Most often" first, which follows the journal, then every type.
const options: (string | null)[] = [null, ...coffeeTypes.filter((type) => type !== 'other')];

const rows: (string | null)[][] = [];
for (let index = 0; index < options.length; index += COLUMNS) rows.push(options.slice(index, index + COLUMNS));

export default function FavoriteScreen() {
  const picked = useChosenFavorite();
  const { entries } = useEntries();
  const usual = mostOften(entries);
  const { width } = useWindowDimensions();
  const column = Math.min(width, contentColumn.maxWidth) - spacing.screen * 2;
  const tile = (column - spacing.md * (COLUMNS - 1)) / COLUMNS;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('settings.favorite.title')} subtitle={t('settings.favorite.body')} />

      <View style={styles.grid} accessibilityRole="radiogroup">
        {rows.map((row) => (
          <View key={row[0] ?? 'usual'} style={styles.row}>
            {row.map((option) => {
              const selected = picked === option;
              const label =
                option === null
                  ? t('settings.favorite.usual')
                  : coffeeLabel(option);
              return (
                <Pressable
                  key={option ?? 'usual'}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => setFavoriteCoffee(option)}
                  style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
                >
                  <View style={[styles.tile, selected && styles.tileSelected]}>
                    <CupMark drink={option ?? usual} size={Math.round(tile * 0.68)} />
                  </View>
                  <Text
                    variant={selected ? 'label' : 'caption'}
                    color={selected ? 'text' : 'textSecondary'}
                    align="center"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {option === null && usual ? (
                    <Text variant="caption" color="textMuted" align="center" numberOfLines={1}>
                      {coffeeLabel(usual)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            {/* Keeps a short last row's tiles the size of the rest. */}
            {Array.from({ length: COLUMNS - row.length }, (_, index) => (
              <View key={`gap-${index}`} style={styles.cell} />
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = themed(() => ({
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
    gap: spacing.xs,
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
