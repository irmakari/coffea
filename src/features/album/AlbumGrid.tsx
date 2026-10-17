import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { CupMark, isIcedDrawing, Text } from '@/components/ui';
import { useSticker } from '@/features/entries/sticker';
import { formatNumber, t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

import { albumShelves, shelfOf, slotNumber, type AlbumCard } from './album';

const ART = 84;

// A cup seen from above, in one flat grey: the shape of what is still to
// collect, without giving away the drink. Iced drinks get their clear cup.
function Silhouette({ drink }: { drink: string }) {
  // An iced drink keeps the shape of its clear cup, from the side.
  if (isIcedDrawing(drink)) {
    return (
      <Svg width={ART} height={ART} viewBox="0 0 120 120" accessible={false}>
        <Path d="M27 36L37 104Q38 110 44 110H76Q82 110 83 104L93 36Z" fill={colors.border} />
        <Rect x={46} y={46} width={14} height={13} rx={3} fill={colors.borderStrong} opacity={0.45} />
        <Rect x={63} y={52} width={13} height={13} rx={3} fill={colors.borderStrong} opacity={0.45} />
        <Rect x={40} y={64} width={12} height={12} rx={3} fill={colors.borderStrong} opacity={0.45} />
        <Rect x={23} y={30} width={74} height={9} rx={4.5} fill={colors.borderStrong} opacity={0.6} />
        <Rect x={64} y={6} width={6} height={30} rx={3} fill={colors.border} transform="rotate(14 67 21)" />
      </Svg>
    );
  }
  return (
    <Svg width={ART} height={ART} viewBox="0 0 120 120" accessible={false}>
      <Circle cx={60} cy={60} r={46} fill={colors.border} />
      <Circle cx={60} cy={60} r={30} fill={colors.borderStrong} opacity={0.45} />
      <Rect x={86} y={30} width={22} height={14} rx={7} fill={colors.border} transform="rotate(-35 97 37)" />
    </Svg>
  );
}

// A collected coffee: the sticker of its newest photo when there is one,
// else the drawing of the drink.
function Collected({ card }: { card: AlbumCard }) {
  const entry = card.withPhoto;
  const sticker = useSticker(entry?.photoUrl ?? null, entry?.photoPath ?? null);
  if (sticker) {
    return <Image source={{ uri: sticker }} contentFit="contain" transition={200} style={styles.sticker} />;
  }
  return <CupMark drink={card.value} size={ART} />;
}

function Tile({ card }: { card: AlbumCard }) {
  const collected = !!card.latest;
  const art = (
    <>
      <View style={styles.art}>{collected ? <Collected card={card} /> : <Silhouette drink={card.value} />}</View>
      <Text variant="caption" color="textMuted" align="center">
        {slotNumber(card.number)}
      </Text>
      <Text
        variant="label"
        color={collected ? 'text' : 'textMuted'}
        align="center"
        numberOfLines={2}
        style={styles.name}
      >
        {card.name}
      </Text>
    </>
  );

  if (!collected) {
    return (
      <View style={styles.tile} accessible accessibilityLabel={t('album.locked', { name: card.name })}>
        {art}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('album.collected', { name: card.name, count: card.count })}
      onPress={() => router.push({ pathname: '/collection', params: { kind: 'type', value: card.value } })}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {art}
    </Pressable>
  );
}

// The album on its three shelves, each under its name and how many of it
// are collected.
export function AlbumGrid({ cards }: { cards: AlbumCard[] }) {
  return (
    <View style={styles.shelves}>
      {albumShelves.map((shelf) => {
        const onShelf = cards.filter((card) => shelfOf(card.value) === shelf);
        if (onShelf.length === 0) return null;
        const collected = onShelf.filter((card) => card.latest).length;
        return (
          <View key={shelf} style={styles.shelf}>
            <View style={styles.shelfHead}>
              <Text variant="heading" accessibilityRole="header">
                {t(`album.shelves.${shelf}`)}
              </Text>
              <Text variant="label" color="textSecondary">
                {t('album.progress', { collected: formatNumber(collected), total: formatNumber(onShelf.length) })}
              </Text>
            </View>
            <View style={styles.grid}>
              {onShelf.map((card) => (
                <Tile key={card.value} card={card} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shelves: {
    gap: spacing.xxl,
  },
  shelf: {
    gap: spacing.lg,
  },
  shelfHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xl,
  },
  tile: {
    width: '33.333%',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  art: {
    width: ART + spacing.lg,
    height: ART + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderRadius: radii.frame,
  },
  sticker: {
    width: ART + spacing.md,
    height: ART + spacing.md,
  },
  name: {
    minHeight: 36,
  },
  pressed: {
    opacity: 0.7,
  },
});
