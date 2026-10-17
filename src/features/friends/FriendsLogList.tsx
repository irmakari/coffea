import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';

import { Avatar, BottomSheet, CupMark, Icon, SectionHeader, Text } from '@/components/ui';
import { activityWhen, coffeeName } from '@/features/album/FriendsAlbum';
import { servedAs } from '@/features/album/FriendCoffeeSheet';
import { slotNumber } from '@/features/album/album';
import { MAX_RATING } from '@/features/entries/types';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, contentColumn, fonts, radii, sizes, spacing, themed } from '@/theme';

import { personName } from './friendsApi';
import { fetchFriendsLog, groupLog, type LogGroup, type LoggedCoffee } from './friendsLogApi';

type Status = 'loading' | 'ready' | 'error';

// Friends' coffees, loaded whenever the friends tab comes into view.
export function useFriendsLog() {
  const [coffees, setCoffees] = useState<LoggedCoffee[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const latest = await fetchFriendsLog();
      if (mine !== generation.current) return;
      setCoffees(latest);
      setStatus('ready');
    } catch {
      if (mine === generation.current) setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { coffees, groups: groupLog(coffees), status, reload };
}

// "2 Turkish Coffee · Latte": what was drunk, the most-had first.
function summary(coffees: LoggedCoffee[]) {
  const counts = new Map<string, number>();
  for (const coffee of coffees) {
    const name = coffee.type ? coffeeName(coffee.type) : coffee.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => (count > 1 ? `${formatNumber(count)} ${name}` : name))
    .join(' · ');
}

// Up to three cups, overlapping, for the drinks of one line.
function Cups({ coffees }: { coffees: LoggedCoffee[] }) {
  const shown = coffees.slice(0, 3);
  return (
    <View style={[styles.cups, { width: 40 + (shown.length - 1) * 18 }]}>
      {shown.map((coffee, index) => (
        <View key={coffee.id} style={[styles.cup, { left: index * 18, zIndex: shown.length - index }]}>
          <CupMark drink={coffee.type ?? coffee.name} size={40} />
        </View>
      ))}
    </View>
  );
}

function GroupRow({ group, last, onPress }: { group: LogGroup; last: boolean; onPress: () => void }) {
  const [latest] = group.coffees;
  const firsts = group.coffees.filter((coffee) => coffee.albumNumber !== null);
  const name = personName(group.person);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.pressed]}
    >
      <Avatar uri={group.person.avatarUrl} cacheKey={group.person.avatarPath} name={name} size={40} />
      <View style={styles.rowText}>
        <Text numberOfLines={2}>
          <Text style={styles.strong}>{name}</Text>
          {t('friendsLog.had')}
          <Text style={styles.strong}>{summary(group.coffees)}</Text>
        </Text>
        <View style={styles.meta}>
          <Text variant="caption" color="textMuted">
            {activityWhen(latest.consumedAt)} · {formatDate(latest.consumedAt, 'time')}
          </Text>
        </View>
        {firsts.length > 0 ? (
          <View style={styles.badge}>
            <Text variant="caption" color="boardAccent">
              {firsts.length === 1
                ? t('friendsLog.newCard', { number: slotNumber(firsts[0].albumNumber ?? 0) })
                : t('friendsLog.newCards', { count: formatNumber(firsts.length) })}
            </Text>
          </View>
        ) : null}
      </View>
      <Cups coffees={group.coffees} />
    </Pressable>
  );
}

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={styles.stars} accessibilityLabel={t('entry.rating.value', { count: rating })}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Icon
          key={index}
          name="star"
          size={size}
          filled={index < rating}
          color={index < rating ? 'text' : 'placeholder'}
          strokeWidth={1.25}
        />
      ))}
    </View>
  );
}

// One coffee among a day's, to pick for its details.
function CoffeeItem({ coffee, onPress }: { coffee: LoggedCoffee; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <CupMark drink={coffee.type ?? coffee.name} size={52} />
      <View style={styles.coffeeText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {coffee.name}
        </Text>
        <Text variant="caption" color="textSecondary">
          {formatDate(coffee.consumedAt, 'time')}
        </Text>
        {coffee.rating ? <Stars rating={coffee.rating} size={12} /> : null}
      </View>
      <Icon name="chevronRight" size={16} color="textMuted" />
    </Pressable>
  );
}

// One coffee as its owner filled it in: rating, how it was served, the note.
function CoffeeDetails({ coffee }: { coffee: LoggedCoffee }) {
  const rows = servedAs(coffee);
  return (
    <View style={styles.details}>
      <View style={styles.coffeeHead}>
        <CupMark drink={coffee.type ?? coffee.name} size={88} />
        <View style={styles.coffeeText}>
          {coffee.albumNumber !== null ? (
            <Text variant="caption" color="textSecondary">
              {t('friendsLog.newCard', { number: slotNumber(coffee.albumNumber) })}
            </Text>
          ) : null}
          <Text variant="title" numberOfLines={2}>
            {coffee.name}
          </Text>
          <Text variant="small" color="textSecondary">
            {formatDate(coffee.consumedAt, 'dayShort')} · {formatDate(coffee.consumedAt, 'time')}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        {coffee.rating ? (
          <View style={styles.tableRow}>
            <Text variant="label" color="textSecondary">
              {t('friendCoffee.rating')}
            </Text>
            <Stars rating={coffee.rating} size={18} />
          </View>
        ) : null}
        {rows.map((row) => (
          <View key={row.label} style={styles.tableRow}>
            <Text variant="label" color="textSecondary">
              {row.label}
            </Text>
            <Text variant="bodyStrong">{row.value}</Text>
          </View>
        ))}
      </View>

      {coffee.notes ? (
        <View style={styles.note}>
          <Text variant="label" color="textSecondary">
            {t('friendCoffee.note')}
          </Text>
          <Text>{coffee.notes}</Text>
        </View>
      ) : null}

      {!coffee.rating && rows.length === 0 && !coffee.notes ? (
        <Text color="textSecondary">{t('friendCoffee.plain')}</Text>
      ) : null}
    </View>
  );
}

// A friend's day: their coffees listed first, each opening on a tap, with a
// way back to the list.
function GroupSheet({
  group,
  coffees,
  onClose,
}: {
  group: LogGroup | null;
  coffees: LoggedCoffee[];
  onClose: () => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  // Read from the list, so a reload is shown.
  const shown = group ? coffees.filter((coffee) => group.coffees.some((item) => item.id === coffee.id)) : [];
  const picked = shown.find((coffee) => coffee.id === pickedId) ?? null;
  const name = group ? personName(group.person) : '';

  const close = () => {
    setPickedId(null);
    onClose();
  };

  return (
    <BottomSheet visible={!!group} onClose={close}>
      {group ? (
        <View style={[contentColumn, styles.sheet]}>
          <View style={styles.sheetHead}>
            {picked ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                onPress={() => setPickedId(null)}
                hitSlop={spacing.md}
              >
                <Icon name="chevronLeft" size={22} />
              </Pressable>
            ) : null}
            <Avatar uri={group.person.avatarUrl} cacheKey={group.person.avatarPath} name={name} size={36} />
            <View style={styles.coffeeText}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {name}
              </Text>
              <Text variant="caption" color="textSecondary">
                {formatDate(group.coffees[0].consumedAt, 'day')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                close();
                router.push({ pathname: '/friends/[id]', params: { id: group.person.id } });
              }}
              hitSlop={spacing.sm}
            >
              <Text variant="label" color="textSecondary">
                {t('friendsLog.profile')}
              </Text>
            </Pressable>
          </View>

          {picked ? (
            <Animated.View key={picked.id} entering={FadeInRight.duration(220)}>
              <CoffeeDetails coffee={picked} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInLeft.duration(220)}>
              {shown.map((coffee) => (
                <CoffeeItem key={coffee.id} coffee={coffee} onPress={() => setPickedId(coffee.id)} />
              ))}
            </Animated.View>
          )}

          <Text variant="caption" color="textMuted">
            {t('friendCoffee.privacy')}
          </Text>
        </View>
      ) : null}
    </BottomSheet>
  );
}

// Friends' coffees, newest first, a line per friend per day.
export function FriendsLogList({
  groups,
  coffees,
}: {
  groups: LogGroup[];
  coffees: LoggedCoffee[];
}) {
  const [openedKey, setOpenedKey] = useState<string | null>(null);
  // Looked up afresh, so a group gone after a reload closes its sheet.
  const opened = groups.find((group) => group.key === openedKey) ?? null;

  return (
    <View>
      <SectionHeader large title={t('activity.title')} />
      {groups.length === 0 ? (
        <Text color="textSecondary">{t('friendsLog.empty')}</Text>
      ) : (
        groups.map((group, index) => (
          <GroupRow key={group.key} group={group} last={index === groups.length - 1} onPress={() => setOpenedKey(group.key)} />
        ))
      )}
      <GroupSheet group={opened} coffees={coffees} onClose={() => setOpenedKey(null)} />
    </View>
  );
}

const styles = themed(() => ({
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
  pressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  strong: {
    fontFamily: fonts.sansStrong,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.pill,
    // The leaderboard's dark card, so a new album coffee reads as an award.
    backgroundColor: colors.boardCard,
  },
  cups: {
    height: 44,
  },
  cup: {
    position: 'absolute',
    top: 2,
  },
  sheet: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  details: {
    gap: spacing.lg,
  },
  coffeeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  coffeeText: {
    flex: 1,
    gap: 2,
  },
  table: {
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  note: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.frame,
    backgroundColor: colors.background,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
}));
