import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoffeePhoto, Icon, Text } from '@/components/ui';
import { formatDate, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import { typeAndCafe } from './display';
import type { Entry } from './types';

function openEntry(entry: Entry) {
  router.push({ pathname: '/entry/[id]', params: { id: entry.id } });
}

function Rating({ value }: { value: number }) {
  return (
    <View style={styles.rating} accessibilityLabel={t('entry.rating.value', { count: value })}>
      {Array.from({ length: value }, (_, index) => (
        <Icon key={index} name="star" size={11} filled strokeWidth={1} color="textSecondary" />
      ))}
    </View>
  );
}

// The large card: the photograph leads when there is one, or a drawing of
// the coffee type. An entry with neither is simply its words.
export function EntryCard({ entry }: { entry: Entry }) {
  const subtitle = typeAndCafe(entry);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openEntry(entry)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {entry.photoUrl || entry.type ? (
        <CoffeePhoto
          uri={entry.photoUrl}
          cacheKey={entry.photoPath}
          drink={entry.type}
          ratio="wide"
          style={styles.cardPhoto}
        />
      ) : null}
      <View style={styles.cardText}>
        <View style={styles.titleRow}>
          <Text variant="heading" numberOfLines={2} style={styles.title}>
            {entry.name}
          </Text>
          {entry.isFavorite ? <Icon name="heart" size={16} filled color="textSecondary" /> : null}
        </View>
        {subtitle ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text variant="caption" color="textMuted">
            {formatDate(entry.consumedAt, 'dayShort')}
          </Text>
          {entry.rating ? <Rating value={entry.rating} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

// A small square card for horizontal shelves.
export function EntryTile({ entry }: { entry: Entry }) {
  const subtitle = typeAndCafe(entry);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openEntry(entry)}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View>
        <CoffeePhoto uri={entry.photoUrl} cacheKey={entry.photoPath} drink={entry.type} ratio="square" style={styles.tilePhoto} />
        {entry.isFavorite ? (
          <View style={styles.tileHeart}>
            <Icon name="heart" size={13} filled />
          </View>
        ) : null}
      </View>
      <View style={styles.tileText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {entry.name}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {subtitle ?? formatDate(entry.consumedAt, 'dayShort')}
        </Text>
      </View>
    </Pressable>
  );
}

// A compact line for lists inside a card, with a small thumbnail.
export function EntryRow({ entry, last = false }: { entry: Entry; last?: boolean }) {
  const subtitle = typeAndCafe(entry);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openEntry(entry)}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.pressed]}
    >
      <CoffeePhoto uri={entry.photoUrl} cacheKey={entry.photoPath} drink={entry.type} ratio="square" style={styles.thumbnail} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {entry.name}
        </Text>
        {subtitle ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" color="textMuted">
        {formatDate(entry.consumedAt, 'dayShort')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardPhoto: {
    borderRadius: 0,
  },
  cardText: {
    padding: spacing.xl - 4,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  tile: {
    width: 148,
    padding: spacing.sm,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  tilePhoto: {
    borderRadius: radii.frame - spacing.sm,
    backgroundColor: colors.background,
  },
  tileHeart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  thumbnail: {
    width: 52,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
