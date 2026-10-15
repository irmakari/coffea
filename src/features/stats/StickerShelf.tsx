import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CoffeePhoto, IconButton, Text } from '@/components/ui';
import { useSticker } from '@/features/entries/sticker';
import type { Entry } from '@/features/entries/types';
import { t } from '@/i18n';
import { palette, radii, spacing } from '@/theme';

const ITEM_HEIGHT = 104;
const ITEM_WIDTH = 84;
const GAP = spacing.sm;
// The share of each coffee the ledge covers, like books in a wall pocket.
const LEDGE_HEIGHT = 40;

// The ledges take turns through the warm part of the palette.
const ledges = [palette.latte, palette.oatTaupe, palette.mocha];

export function ledgeColor(index: number) {
  return ledges[index % ledges.length];
}

// One coffee on the shelf: its sticker when one is made, else the photo in a
// small frame, so a coffee never goes missing from the shelf.
function ShelfItem({ entry }: { entry: Entry }) {
  const sticker = useSticker(entry.photoUrl, entry.photoPath);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.name}
      onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      {sticker ? (
        <Image source={{ uri: sticker }} contentFit="contain" contentPosition="bottom" transition={200} style={styles.sticker} />
      ) : (
        <CoffeePhoto uri={entry.photoUrl} cacheKey={entry.photoPath} ratio="portrait" style={styles.photo} />
      )}
    </Pressable>
  );
}

type StickerShelfProps = {
  title: string;
  detail: string;
  // Newest first, each with a photo.
  entries: Entry[];
  color: string;
};

// Coffees standing behind a see-through ledge. The coffees scroll sideways;
// the ledge stays put in front of them.
export function StickerShelf({ title, detail, entries, color }: StickerShelfProps) {
  const scroller = useRef<ScrollView>(null);
  const offset = useRef(0);
  const [width, setWidth] = useState(0);
  const contentWidth = entries.length * (ITEM_WIDTH + GAP) - GAP;
  const scrollable = contentWidth > width;

  const step = (direction: 1 | -1) => {
    const next = Math.max(0, Math.min(contentWidth - width, offset.current + direction * (ITEM_WIDTH + GAP) * 2));
    scroller.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <View style={styles.shelf}>
      <View style={styles.header}>
        <Text variant="subheading" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="small" color="textMuted">
          {detail}
        </Text>
        {scrollable ? (
          <View style={styles.arrows}>
            <IconButton icon="chevronLeft" label={t('stats.shelf.back')} onPress={() => step(-1)} />
            <IconButton icon="chevronRight" label={t('stats.shelf.forward')} onPress={() => step(1)} />
          </View>
        ) : null}
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            offset.current = event.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={32}
          contentContainerStyle={styles.row}
        >
          {entries.map((entry) => (
            <ShelfItem key={entry.id} entry={entry} />
          ))}
        </ScrollView>
        <View pointerEvents="none" style={[styles.ledge, { backgroundColor: `${color}8C` }]}>
          <View style={styles.screw} />
          <View style={styles.screw} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  title: {
    flexShrink: 1,
  },
  arrows: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: spacing.xs,
  },
  row: {
    gap: GAP,
    alignItems: 'flex-end',
    paddingBottom: LEDGE_HEIGHT / 3,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  sticker: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
  },
  photo: {
    width: ITEM_WIDTH - spacing.md,
    borderRadius: 12,
  },
  // A strip of tinted acrylic held on by two screws.
  ledge: {
    position: 'absolute',
    left: -spacing.xs,
    right: -spacing.xs,
    bottom: 0,
    height: LEDGE_HEIGHT,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 252, 248, 0.6)',
  },
  screw: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 252, 248, 0.85)',
  },
});
