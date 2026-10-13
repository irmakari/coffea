import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Screen, ScreenHeader, Text } from '@/components/ui';
import { useBucketList } from '@/features/bucketList/BucketListProvider';
import { useEntries } from '@/features/entries/EntriesProvider';
import { formatNumber, t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

export default function CollectionsScreen() {
  const { entries } = useEntries();
  const { items } = useBucketList();

  const collections: { name: string; description: string; count: number; href: Href }[] = [
    {
      name: t('collections.all.name'),
      description: t('collections.all.description'),
      count: entries.length,
      href: '/diary',
    },
    {
      name: t('collections.favorites.name'),
      description: t('collections.favorites.description'),
      count: entries.filter((entry) => entry.isFavorite).length,
      href: '/favorites',
    },
    {
      name: t('collections.bucketList.name'),
      description: t('collections.bucketList.description'),
      // Only what is still left to try.
      count: items.filter((item) => !item.isCompleted).length,
      href: '/bucket-list',
    },
  ];

  return (
    <Screen scroll>
      <ScreenHeader title={t('collections.title')} />
      <View style={styles.list}>
        {collections.map((collection, index) => (
          <Pressable
            key={collection.name}
            accessibilityRole="button"
            onPress={() => router.navigate(collection.href)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Text variant="eyebrow" color="textMuted" style={styles.index}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View style={styles.text}>
              <Text variant="heading">{collection.name}</Text>
              <Text variant="small" color="textSecondary">
                {collection.description}
              </Text>
            </View>
            <View style={styles.trailing}>
              <Text variant="label" color="textSecondary">
                {formatNumber(collection.count)}
              </Text>
              <Icon name="chevronRight" size={16} color="textMuted" />
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    padding: spacing.xl - 4,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.6,
  },
  index: {
    width: 36,
    // Sits on the baseline of the collection name beside it.
    marginTop: 7,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
  },
});
