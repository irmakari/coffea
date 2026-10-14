import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Icon, Screen, ScreenHeader, SectionHeader, Text } from '@/components/ui';
import { useBucketList } from '@/features/bucketList/BucketListProvider';
import { collect, collectBy, type Collection } from '@/features/collections/collections';
import { CollectionTile } from '@/features/collections/CollectionTile';
import { useEntries } from '@/features/entries/EntriesProvider';
import { MonthCard } from '@/features/stats/MonthCard';
import { StreakCard } from '@/features/stats/StreakCard';
import { formatNumber, t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

function inPairs(collections: Collection[]): Collection[][] {
  const pairs: Collection[][] = [];
  for (let index = 0; index < collections.length; index += 2) {
    pairs.push(collections.slice(index, index + 2));
  }
  return pairs;
}

export default function CollectionsScreen() {
  const { entries } = useEntries();
  const { items } = useBucketList();

  const kept = useMemo(() => [collect(entries, 'favorites'), collect(entries, 'fiveStars')], [entries]);
  const types = useMemo(() => collectBy(entries, 'type'), [entries]);
  const cafes = useMemo(() => collectBy(entries, 'cafe'), [entries]);
  // Only what is still left to try.
  const toTry = items.filter((item) => !item.isCompleted).length;

  return (
    <Screen scroll>
      <ScreenHeader title={t('collections.title')} />

      <View style={styles.tracking}>
        <MonthCard entries={entries} />
        <StreakCard entries={entries} />
      </View>

      <View style={[styles.pair, styles.kept]}>
        {kept.map((collection) => (
          <CollectionTile key={collection.kind} collection={collection} style={styles.cell} />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/bucket-list')}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.rowText}>
          <Text variant="heading">{t('collections.bucketList.name')}</Text>
          <Text variant="small" color="textSecondary">
            {t('collections.bucketList.description')}
          </Text>
        </View>
        <View style={styles.trailing}>
          <Text variant="label" color="textSecondary">
            {formatNumber(toTry)}
          </Text>
          <Icon name="chevronRight" size={16} color="textMuted" />
        </View>
      </Pressable>

      {types.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={t('collections.byType')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.shelf}
            contentContainerStyle={styles.shelfContent}
          >
            {types.map((collection) => (
              <CollectionTile key={collection.value} collection={collection} style={styles.shelfTile} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {cafes.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={t('collections.byCafe')} />
          <View style={styles.grid}>
            {inPairs(cafes).map((pair) => (
              <View key={pair[0].value} style={styles.pair}>
                {pair.map((collection) => (
                  <CollectionTile key={collection.value} collection={collection} style={styles.cell} />
                ))}
                {/* Keeps a last tile on its own the same width as the rest. */}
                {pair.length === 1 ? <View style={styles.cell} /> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {types.length === 0 && cafes.length === 0 ? (
        <Card style={styles.hint}>
          <Text color="textSecondary">{t('collections.hint')}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tracking: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  kept: {
    marginTop: spacing.xl + 4,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xl - 4,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  section: {
    marginTop: spacing.xl + 4,
  },
  // Runs to the screen edges, past the gutters the rest of the page keeps.
  shelf: {
    marginHorizontal: -spacing.screen,
  },
  shelfContent: {
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  shelfTile: {
    width: 132,
  },
  hint: {
    marginTop: spacing.md,
  },
});
