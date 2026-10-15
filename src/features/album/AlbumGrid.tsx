import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { CupMark, Text } from '@/components/ui';
import { useSticker } from '@/features/entries/sticker';
import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

import { slotNumber, type AlbumCard } from './album';

const ART = 84;

// A cup seen from above, in one flat grey: the shape of what is still to
// collect, without giving away the drink.
function Silhouette() {
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
      <View style={styles.art}>{collected ? <Collected card={card} /> : <Silhouette />}</View>
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

export function AlbumGrid({ cards }: { cards: AlbumCard[] }) {
  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <Tile key={card.value} card={card} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
