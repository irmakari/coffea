import { router } from 'expo-router';
import { Pressable, View, type ViewStyle } from 'react-native';

import { CoffeePhoto, Text } from '@/components/ui';
import { colors, spacing, themed } from '@/theme';

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

const styles = themed(() => ({
  // Like an album in Music: the cover straight on the page, its words below.
  tile: {},
  pressed: {
    opacity: 0.7,
  },
  cover: {
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.highlight,
  },
  text: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: 2,
  },
}));
