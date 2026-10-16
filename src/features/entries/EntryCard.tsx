import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoffeePhoto, Icon, Text } from '@/components/ui';
import { formatDate, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import { typeAndCafe, typeLabel } from './display';
import { useSticker } from './sticker';
import type { Entry } from './types';

// Wide enough that a shelf of them shows two and the edge of a third.
export const TILE_WIDTH = 150;

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

// "Today, 9:12 AM", "Yesterday, 6:40 PM", else the date.
function when(iso: string, now = new Date()) {
  const at = new Date(iso);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime()) /
      86_400_000,
  );
  const time = formatDate(at, 'time');
  if (days === 0) return t('home.when.today', { time });
  if (days === 1) return t('home.when.yesterday', { time });
  return formatDate(at, 'dayShort');
}

// The type and café under the name, without repeating a name that is only
// the type ("Turkish Coffee / Turkish Coffee").
function detailLine(entry: Entry) {
  const type = typeLabel(entry);
  if (type && type.trim().toLowerCase() === entry.name.trim().toLowerCase()) return entry.cafe;
  return typeAndCafe(entry);
}

// What leads the card, in a square on its left: the sticker on tan, else
// the photo, else the drawing of the drink.
function Visual({ entry }: { entry: Entry }) {
  const sticker = useSticker(entry.photoUrl, entry.photoPath);
  if (sticker) {
    return (
      <View style={styles.cardVisual}>
        <View style={styles.stickerBackdrop}>
          <Image source={{ uri: sticker }} contentFit="contain" transition={250} style={styles.cardSticker} />
        </View>
      </View>
    );
  }
  return (
    <CoffeePhoto
      uri={entry.photoUrl}
      cacheKey={entry.photoPath}
      drink={entry.type}
      ratio="square"
      style={styles.cardVisual}
    />
  );
}

// The large card, laid on its side: the coffee on the left, its name, where
// it was had and when on the right.
export function EntryCard({ entry }: { entry: Entry }) {
  const detail = detailLine(entry);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openEntry(entry)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {entry.photoUrl || entry.type ? <Visual entry={entry} /> : null}
      <View style={styles.cardText}>
        <View style={styles.titleRow}>
          <Text variant="subheading" numberOfLines={2} style={styles.title}>
            {entry.name}
          </Text>
          {entry.isFavorite ? <Icon name="heart" size={14} filled color="textSecondary" /> : null}
        </View>
        {detail ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text variant="caption" color="textMuted">
            {when(entry.consumedAt)}
          </Text>
          {entry.rating ? <Rating value={entry.rating} /> : null}
        </View>
      </View>
      <Icon name="chevronRight" size={16} color="textMuted" />
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
            <Icon name="heart" size={12} filled />
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
  // iOS's continuous corners, on a 16 point inset like a grouped list.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  cardVisual: {
    width: 88,
    aspectRatio: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  stickerBackdrop: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.highlight,
  },
  cardSticker: {
    flex: 1,
  },
  cardText: {
    flex: 1,
    gap: 3,
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
  // Like an album in Music: the picture straight on the page, its words below.
  tile: {
    width: TILE_WIDTH,
  },
  tilePhoto: {
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  tileHeart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 252, 248, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Set in from the picture's rounded corner, so the words sit under it.
  tileText: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 1,
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
