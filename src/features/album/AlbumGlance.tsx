import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { CupMark, Icon, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { useSticker } from '@/features/entries/sticker';
import { formatNumber, t } from '@/i18n';
import { colors, radii, spacing, themed } from '@/theme';

import { buildAlbum, collectedCount, type AlbumCard } from './album';
import { saveDiaryView } from './diaryView';

const COIN = 48;
// How many collected coffees overlap at the front of the card.
const SHOWN = 4;

// One collected coffee as a round coin: its sticker when one is cut, else
// the drawing of the drink.
function Coin({ card, index }: { card: AlbumCard; index: number }) {
  const photo = card.withPhoto;
  const sticker = useSticker(photo?.photoUrl ?? null, photo?.photoPath ?? null);
  return (
    <View style={[styles.coin, index > 0 && styles.coinOverlap, { zIndex: SHOWN - index }]}>
      {sticker ? (
        <Image source={{ uri: sticker }} contentFit="contain" style={styles.coinSticker} />
      ) : (
        <CupMark drink={card.value} size={COIN - 6} />
      )}
    </View>
  );
}

// The album at a glance: the coffees collected lately, fanned out, and the
// next one still to find, so the card reads as somewhere to go next rather
// than how far there is left.
export function AlbumGlance() {
  const { entries } = useEntries();
  const album = useMemo(() => buildAlbum(entries), [entries]);
  const collected = collectedCount(album);
  const recent = album
    .filter((card) => card.latest)
    .sort((a, b) => b.latest!.consumedAt.localeCompare(a.latest!.consumedAt))
    .slice(0, SHOWN);
  const next = album.find((card) => !card.latest);

  const open = () => {
    saveDiaryView('album');
    router.navigate('/diary');
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.title}>
          <Text variant="subheading">{t('album.home.title')}</Text>
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {collected === 0
              ? t('album.home.empty')
              : t('album.home.counts', {
                  collected: formatNumber(collected),
                  left: formatNumber(album.length - collected),
                })}
          </Text>
        </View>
        <Icon name="chevronRight" size={16} color="textMuted" />
      </View>

      <View style={styles.row}>
        {recent.length > 0 ? (
          <View style={styles.coins}>
            {recent.map((card, index) => (
              <Coin key={card.value} card={card} index={index} />
            ))}
          </View>
        ) : null}
        <View style={[styles.next, recent.length > 0 && styles.nextGap]}>
          {next ? (
            <View style={[styles.coin, styles.nextCoin]}>
              <Text variant="subheading" color="textMuted">
                ?
              </Text>
            </View>
          ) : null}
          <View style={styles.text}>
            <Text variant="caption" color="textMuted">
              {next ? t('album.home.nextLabel') : t('album.home.complete')}
            </Text>
            {next ? (
              <Text variant="bodyStrong" numberOfLines={1}>
                {next.name}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = themed(() => ({
  // Outlined on the page like the streak card above it, so the two read as
  // one set rather than two styles.
  card: {
    padding: spacing.xl - 4,
    gap: spacing.md,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coins: {
    flexDirection: 'row',
  },
  coin: {
    width: COIN,
    height: COIN,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    // Tan behind the drawing, so a white saucer stands off the page; the
    // page-coloured edge keeps each coin apart from the one behind it.
    backgroundColor: colors.highlight,
    borderWidth: 2,
    borderColor: colors.background,
    overflow: 'hidden',
  },
  coinOverlap: {
    marginLeft: -18,
  },
  coinSticker: {
    width: COIN - 8,
    height: COIN - 8,
  },
  // The next coffee to find: an empty seat, drawn in dashes.
  nextCoin: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  next: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextGap: {
    marginLeft: spacing.md,
  },
  text: {
    flex: 1,
  },
}));
