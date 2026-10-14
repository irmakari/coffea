import { router } from 'expo-router';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { CoffeePhoto, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { countLabel, coverOf, type Collection } from './collections';

type CollectionTileProps = {
  collection: Collection;
  // The tile has no width of its own; a grid cell or a shelf gives it one.
  style?: ViewStyle;
};

export function CollectionTile({ collection, style }: CollectionTileProps) {
  const cover = coverOf(collection);
  // A type is shown as its drawing, which tells the types apart at a glance.
  // The others show their newest photograph.
  const drawn = collection.kind === 'type';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/collection', params: { kind: collection.kind, value: collection.value } })
      }
      style={({ pressed }) => [styles.tile, style, pressed && styles.pressed]}
    >
      <CoffeePhoto
        uri={drawn ? null : cover?.photoUrl}
        cacheKey={drawn ? null : cover?.photoPath}
        drink={drawn ? collection.value : cover?.type}
        ratio="square"
        style={styles.cover}
      />
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {collection.name}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {countLabel(collection.entries.length)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    padding: spacing.sm,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  cover: {
    borderRadius: radii.frame - spacing.sm,
    backgroundColor: colors.background,
  },
  text: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
  },
});
