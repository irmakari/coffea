import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button, CupMark, Text } from '@/components/ui';
import { startLog } from '@/features/entries/logDraft';
import { useSticker } from '@/features/entries/sticker';
import type { Entry } from '@/features/entries/types';
import { coffeeLabel, useFavoriteCoffee } from '@/features/profile/favoriteCoffee';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, radii, spacing, themed } from '@/theme';

const HEIGHT = 220;

// Words over a photo sit on a dark scrim, whatever the theme: the photo is
// the background, not the page. It fades in from nothing, as Photos does,
// so it never draws a line across the picture.
const SCRIM = 'rgb(28, 20, 16)';
const SCRIM_HEIGHT = 130;

function Scrim() {
  return (
    <Svg style={styles.scrimFade} width="100%" height={SCRIM_HEIGHT} pointerEvents="none">
      <Defs>
        <LinearGradient id="todayScrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={SCRIM} stopOpacity={0} />
          <Stop offset="0.45" stopColor={SCRIM} stopOpacity={0.28} />
          <Stop offset="1" stopColor={SCRIM} stopOpacity={0.7} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#todayScrim)" />
    </Svg>
  );
}
const ON_SCRIM = '#FFFCF8';
const ON_SCRIM_SECONDARY = 'rgba(255, 252, 248, 0.8)';

function openEntry(entry: Entry) {
  router.push({ pathname: '/entry/[id]', params: { id: entry.id } });
}

// Today's coffee, large: its photo edge to edge with the words on it, else
// its sticker or drawing on tan. More than one today shows how many.
function Logged({ entry, count }: { entry: Entry; count: number }) {
  const sticker = useSticker(entry.photoUrl, entry.photoPath);
  const when = [formatDate(entry.consumedAt, 'time'), entry.cafe].filter(Boolean).join(' · ');
  const more = count > 1 ? t('home.today.more', { count: formatNumber(count - 1) }) : null;
  const photo = !sticker && entry.photoUrl;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${when}`}
      onPress={() => openEntry(entry)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {photo ? (
        <>
          <Image
            source={entry.photoPath ? { uri: entry.photoUrl!, cacheKey: entry.photoPath } : { uri: entry.photoUrl! }}
            contentFit="cover"
            transition={200}
            style={StyleSheet.absoluteFill}
          />
          <Scrim />
          <View style={styles.scrim}>
            <Text variant="heading" numberOfLines={1} style={styles.onScrim}>
              {entry.name}
            </Text>
            <Text variant="small" numberOfLines={1} style={styles.onScrimSecondary}>
              {when}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.drawn}>
          {sticker ? (
            <Image source={{ uri: sticker }} contentFit="contain" transition={200} style={styles.sticker} />
          ) : (
            <CupMark drink={entry.type} size={112} />
          )}
          <View style={styles.drawnText}>
            <Text variant="heading" numberOfLines={1} align="center" color="heroText">
              {entry.name}
            </Text>
            <Text variant="small" numberOfLines={1} align="center" color="heroTextSecondary">
              {when}
            </Text>
          </View>
        </View>
      )}
      {more ? (
        <View style={styles.more}>
          <Text variant="caption" color="text">
            {more}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// No coffee yet today: the favorite, offered to log in one tap.
function Invite() {
  const favorite = useFavoriteCoffee();
  const coffee = favorite ? coffeeLabel(favorite) : null;
  return (
    <View style={[styles.card, styles.drawn]}>
      <CupMark drink={favorite} size={96} />
      <Text variant="heading" align="center" color="heroText">
        {coffee ? t('home.today.invite', { coffee }) : t('home.today.inviteAny')}
      </Text>
      <Button
        label={coffee ? t('home.today.logFavorite', { coffee }) : t('home.logAction')}
        onPress={() => (favorite ? startLog({ drink: favorite }) : router.push('/log'))}
        style={styles.inviteAction}
      />
    </View>
  );
}

// `today` holds the coffees logged today, newest first.
export function TodayCard({ today }: { today: Entry[] }) {
  const [latest] = today;
  return latest ? <Logged entry={latest} count={today.length} /> : <Invite />;
}

const styles = themed(() => ({
  card: {
    height: HEIGHT,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.hero,
  },
  pressed: {
    opacity: 0.85,
  },
  scrimFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 2,
  },
  onScrim: {
    color: ON_SCRIM,
  },
  onScrimSecondary: {
    color: ON_SCRIM_SECONDARY,
  },
  drawn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sticker: {
    width: 128,
    height: 128,
  },
  drawnText: {
    gap: 2,
    alignSelf: 'stretch',
  },
  inviteAction: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },
  more: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
}));
