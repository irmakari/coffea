import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BackButton,
  Button,
  CoffeePhoto,
  CupMark,
  EmptyState,
  Icon,
  type IconName,
  LoadingState,
  Screen,
  Text,
  showAlert,
} from '@/components/ui';
import { albumSlots, slotNumber } from '@/features/album/album';
import { typeLabel } from '@/features/entries/display';
import { useEntries, useEntry } from '@/features/entries/EntriesProvider';
import { useSticker } from '@/features/entries/sticker';
import { isMilkType, MAX_RATING, type Entry } from '@/features/entries/types';
import { startLog } from '@/features/entries/logDraft';
import { showActions } from '@/features/friends/actions';
import { useHeroStatusBar } from '@/features/theme/theme';
import { caffeineOf } from '@/features/stats/caffeine';
import { formatCurrency, formatDate, formatNumber, t } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';
import { colors, contentColumn, radii, sizes, spacing, themed } from '@/theme';

const VISUAL = 156;
// How far the coffee reaches down over the white sheet.
const OVERHANG = 44;

// A bare icon on the tan header, with a full-size touch area.
function HeaderButton({
  icon,
  label,
  filled,
  onPress,
}: {
  icon: IconName;
  label: string;
  filled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={spacing.xs}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} filled={filled} color="heroText" />
    </Pressable>
  );
}

// The coffee on the right of the header: its sticker standing free, else
// the photo in a small frame, else the drawing of the drink.
function Visual({ entry }: { entry: Entry }) {
  const sticker = useSticker(entry.photoUrl, entry.photoPath);
  if (sticker) {
    return <Image source={{ uri: sticker }} contentFit="contain" transition={250} style={styles.sticker} />;
  }
  if (entry.photoUrl) {
    return (
      <CoffeePhoto
        uri={entry.photoUrl}
        cacheKey={entry.photoPath}
        ratio="square"
        accessibilityLabel={entry.name}
        style={styles.photo}
      />
    );
  }
  return (
    <View style={styles.drawing}>
      <CupMark drink={entry.type} size={VISUAL - spacing.lg} />
    </View>
  );
}

// One part of the sheet, set off from the next by a hairline.
function Section({ label, children, last = false }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View style={[styles.section, last && styles.sectionLast]}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

// "1st", "2nd", "3rd", "4th"... for the album line.
function ordinal(count: number) {
  const tens = count % 100;
  if (tens >= 11 && tens <= 13) return t('entry.album.nth', { count });
  switch (count % 10) {
    case 1:
      return t('entry.album.first', { count });
    case 2:
      return t('entry.album.second', { count });
    case 3:
      return t('entry.album.third', { count });
    default:
      return t('entry.album.nth', { count });
  }
}

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntry(id);
  const { entries, status, remove, toggleFavorite } = useEntries();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  useHeroStatusBar();

  // Where the coffee sits in the album, and how many times it was had up to
  // and including this one.
  const album = useMemo(() => {
    if (!entry?.type) return null;
    const key = entry.type.trim().toLowerCase();
    const slot = albumSlots().find((candidate) => candidate.value.toLowerCase() === key);
    if (!slot) return null;
    const times = entries.filter(
      (other) => other.type?.trim().toLowerCase() === key && other.consumedAt <= entry.consumedAt,
    ).length;
    return { number: slot.number, times };
  }, [entries, entry]);

  if (!entry) {
    return (
      <Screen>
        <BackButton />
        {status === 'loading' ? <LoadingState /> : <EmptyState title={t('entry.notFound')} />}
      </Screen>
    );
  }

  const type = typeLabel(entry);
  const milk = isMilkType(entry.milk) ? t(`milkTypes.${entry.milk}`) : entry.milk;
  // The type is left out when it is all the name says ("Turkish Coffee").
  const sameAsName = !!type && type.trim().toLowerCase() === entry.name.trim().toLowerCase();
  const kind = [
    sameAsName ? null : type,
    milk,
    entry.size ? t(`entry.size.${entry.size}`) : null,
    entry.temperature ? t(`entry.temperature.${entry.temperature}`) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const where = [entry.venue ? t(`entry.venue.${entry.venue}`) : null, entry.cafe].filter(Boolean).join(' · ');
  const caffeine = [
    t('entry.caffeine.value', { mg: formatNumber(caffeineOf(entry)) }),
    entry.shots ? t(entry.shots === 1 ? 'entry.shots.one' : 'entry.shots.other', { count: entry.shots }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const price = entry.price !== null && entry.currency ? formatCurrency(entry.price, entry.currency) : null;
  // Nothing beyond the basics yet, so editing reads as filling it in.
  const bare = !entry.cafe && !entry.rating && !price && !entry.notes;

  const favorite = () => {
    setFailure(null);
    tapFeedback();
    // The provider puts the heart back if the save fails; this says why.
    toggleFavorite(entry).catch(() => setFailure(t('entry.favorite.error')));
  };

  const edit = () => router.push({ pathname: '/entry/[id]/edit', params: { id: entry.id } });
  const share = () => router.push({ pathname: '/entry/[id]/share', params: { id: entry.id } });

  const confirmDelete = () => {
    showAlert(t('entry.delete.title'), t('entry.delete.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('entry.delete.confirm'),
        style: 'destructive',
        onPress: async () => {
          setFailure(null);
          setDeleting(true);
          try {
            await remove(entry);
            router.back();
          } catch {
            setFailure(t('entry.delete.error'));
            setDeleting(false);
          }
        },
      },
    ]);
  };

  // The same coffee again, today: its name, type and café filled in.
  const logAgain = () =>
    startLog({ drink: entry.type ?? undefined, name: entry.name, cafe: entry.cafe ?? undefined });

  const more = () =>
    showActions(entry.name, [
      { label: t('entry.logAgain'), onPress: logAgain },
      { label: t('entry.delete.action'), destructive: true, onPress: confirmDelete },
    ]);

  // Each part of the sheet that has something to say, in order.
  const sections: { key: string; label: string; body: ReactNode }[] = [
    {
      key: 'when',
      label: t('entry.date.label'),
      body: (
        <Text variant="subheading">
          {formatDate(entry.consumedAt, 'day')} · {formatDate(entry.consumedAt, 'time')}
        </Text>
      ),
    },
  ];
  if (where) {
    sections.push({ key: 'where', label: t('entry.venue.label'), body: <Text variant="subheading">{where}</Text> });
  }
  sections.push({ key: 'caffeine', label: t('entry.caffeine.label'), body: <Text variant="subheading">{caffeine}</Text> });
  if (entry.rating) {
    sections.push({
      key: 'rating',
      label: t('entry.rating.label'),
      body: (
        <View style={styles.rating} accessibilityLabel={t('entry.rating.value', { count: entry.rating })}>
          {Array.from({ length: MAX_RATING }, (_, index) => {
            const active = index < (entry.rating ?? 0);
            return (
              <Icon
                key={index}
                name="star"
                size={20}
                filled={active}
                strokeWidth={1.25}
                color={active ? 'text' : 'placeholder'}
              />
            );
          })}
        </View>
      ),
    });
  }
  if (entry.notes) {
    sections.push({ key: 'notes', label: t('entry.notes.label'), body: <Text>{entry.notes}</Text> });
  }
  if (album) {
    sections.push({
      key: 'album',
      label: t('entry.album.label'),
      body: (
        <Text variant="subheading">
          {slotNumber(album.number)} · {ordinal(album.times)}
        </Text>
      ),
    });
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        // The tan header runs up behind the status bar.
        contentInsetAdjustmentBehavior="never"
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <View style={[contentColumn, styles.heroInner]}>
            <View style={styles.topBar}>
              <HeaderButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
              <View style={styles.topActions}>
                <HeaderButton
                  icon="heart"
                  filled={entry.isFavorite}
                  label={t(entry.isFavorite ? 'entry.favorite.remove' : 'entry.favorite.add')}
                  onPress={favorite}
                />
                <HeaderButton icon="more" label={t('entry.moreActions')} onPress={more} />
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroText}>
                <Text variant="display" color="heroText" accessibilityRole="header" numberOfLines={3}>
                  {entry.name}
                </Text>
                {kind ? <Text color="heroTextSecondary">{kind}</Text> : null}
                {price ? (
                  <Text variant="heading" color="heroText" style={styles.price}>
                    {price}
                  </Text>
                ) : null}
              </View>
              <View style={styles.visual}>
                {entry.photoUrl || entry.type ? <Visual entry={entry} /> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={[contentColumn, styles.sheetInner]}>
            {/* A Turkish coffee leaves grounds to read. */}
            {entry.type === 'turkish' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/fortune/[id]', params: { id: entry.id } })}
                style={({ pressed }) => [styles.fortune, pressed && styles.pressed]}
              >
                <CupMark drink="turkish" size={52} />
                <View style={styles.fortuneText}>
                  <Text variant="subheading">{t('fortune.entry.title')}</Text>
                  <Text variant="small" color="textSecondary">
                    {t('fortune.entry.body')}
                  </Text>
                </View>
                <Icon name="chevronRight" size={18} color="textMuted" />
              </Pressable>
            ) : null}
            {sections.map((section, index) => (
              <Section key={section.key} label={section.label} last={index === sections.length - 1}>
                {section.body}
              </Section>
            ))}

            {failure ? (
              <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite" style={styles.failure}>
                {failure}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={[contentColumn, styles.barInner]}>
          <Button variant="secondary" label={t(bare ? 'entry.details.add' : 'entry.edit')} onPress={edit} style={styles.barButton} />
          <Button label={t('share.action')} loading={deleting} onPress={share} style={styles.barButton} />
        </View>
      </View>
    </View>
  );
}

const styles = themed(() => ({
  fortune: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  fortuneText: {
    flex: 1,
    gap: 2,
  },
  root: {
    flex: 1,
    backgroundColor: colors.sheet,
  },
  hero: {
    backgroundColor: colors.hero,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
  },
  heroInner: {
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  round: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: OVERHANG,
  },
  price: {
    marginTop: spacing.sm,
  },
  // Sits on the header and reaches down over the top of the sheet.
  visual: {
    width: VISUAL,
    height: VISUAL,
    marginBottom: -OVERHANG - spacing.xl,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticker: {
    width: VISUAL,
    height: VISUAL,
  },
  photo: {
    width: VISUAL - spacing.md,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 4,
    borderColor: colors.surface,
  },
  drawing: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sheet: {
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    backgroundColor: colors.sheet,
  },
  sheetInner: {
    paddingTop: OVERHANG - spacing.md,
  },
  section: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  sectionLast: {
    borderBottomWidth: 0,
  },
  // As tall as a line of the text values above and below it.
  rating: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  failure: {
    marginTop: spacing.lg,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.sheet,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  barInner: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  barButton: {
    flex: 1,
  },
}));
