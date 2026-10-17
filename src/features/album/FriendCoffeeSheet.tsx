import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomSheet, CupMark, Icon, Text } from '@/components/ui';
import { isMilkType, MAX_RATING } from '@/features/entries/types';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, contentColumn, radii, sizes, spacing, themed } from '@/theme';

import { slotNumber } from './album';
import { fetchFriendCoffee, type Activity, type FriendCoffee } from './albumFriendsApi';
import { coffeeName } from './FriendsAlbum';

// Room kept for the details while they load, so the sheet does not jump
// to a new height when they arrive.
const DETAILS_MIN = 150;

export function servedAs(coffee: Omit<FriendCoffee, 'name' | 'consumedAt'>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (coffee.size === 'small' || coffee.size === 'medium' || coffee.size === 'large') {
    rows.push({ label: t('entry.size.label'), value: t(`entry.size.${coffee.size}`) });
  }
  if (coffee.shots) {
    rows.push({
      label: t('entry.shots.label'),
      value: coffee.shots === 1 ? t('entry.shots.one') : t('entry.shots.other', { count: formatNumber(coffee.shots) }),
    });
  }
  if (isMilkType(coffee.milk)) {
    rows.push({ label: t('entry.milk.label'), value: t(`milkTypes.${coffee.milk}`) });
  }
  if (coffee.temperature === 'hot' || coffee.temperature === 'iced') {
    rows.push({ label: t('entry.temperature.label'), value: t(`entry.temperature.${coffee.temperature}`) });
  }
  if (coffee.venue === 'cafe' || coffee.venue === 'home' || coffee.venue === 'takeaway') {
    rows.push({ label: t('entry.venue.label'), value: t(`entry.venue.${coffee.venue}`) });
  }
  return rows;
}

type FriendCoffeeSheetProps = {
  friend: string;
  // The friend's first of one coffee, or null while the sheet is closed.
  item: Activity | null;
  onClose: () => void;
};

// A friend's first of one coffee, as they filled it in, over their page.
export function FriendCoffeeSheet({ friend, item, onClose }: FriendCoffeeSheetProps) {
  return (
    <BottomSheet visible={!!item} onClose={onClose}>
      {item ? <Details friend={friend} item={item} /> : null}
    </BottomSheet>
  );
}

type State = { status: 'loading' } | { status: 'ready'; coffee: FriendCoffee | null } | { status: 'error' };

function Details({ friend, item }: { friend: string; item: Activity }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    fetchFriendCoffee(friend, item.coffee)
      .then((coffee) => current && setState({ status: 'ready', coffee }))
      .catch(() => current && setState({ status: 'error' }));
    return () => {
      current = false;
    };
  }, [friend, item.coffee]);

  const coffee = state.status === 'ready' ? state.coffee : null;
  const rows = coffee ? servedAs(coffee) : [];

  return (
          <View style={[contentColumn, styles.body]}>
            <View style={styles.head}>
              <CupMark drink={item.coffee} size={88} />
              <View style={styles.headText}>
                <Text variant="caption" color="textMuted">
                  {slotNumber(item.collected)} · {t('friendCoffee.first')}
                </Text>
                <Text variant="title" numberOfLines={2}>
                  {coffee?.name ?? coffeeName(item.coffee)}
                </Text>
                <Text variant="small" color="textSecondary">
                  {formatDate(coffee?.consumedAt ?? item.collectedAt, 'day')}
                </Text>
              </View>
            </View>

            {state.status === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.textMuted} />
              </View>
            ) : state.status === 'error' ? (
              <View style={styles.loading}>
                <Text color="textSecondary" align="center">
                  {t('friendCoffee.error')}
                </Text>
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)} style={styles.details}>
                {coffee?.rating ? (
                  <View style={styles.row}>
                    <Text variant="label" color="textSecondary">
                      {t('friendCoffee.rating')}
                    </Text>
                    <View style={styles.stars} accessibilityLabel={t('entry.rating.value', { count: coffee.rating })}>
                      {Array.from({ length: MAX_RATING }, (_, index) => (
                        <Icon
                          key={index}
                          name="star"
                          size={18}
                          filled={index < (coffee.rating ?? 0)}
                          color={index < (coffee.rating ?? 0) ? 'text' : 'placeholder'}
                          strokeWidth={1.25}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
                {rows.map((row) => (
                  <View key={row.label} style={styles.row}>
                    <Text variant="label" color="textSecondary">
                      {row.label}
                    </Text>
                    <Text variant="bodyStrong">{row.value}</Text>
                  </View>
                ))}
                {coffee?.notes ? (
                  <View style={styles.note}>
                    <Text variant="label" color="textSecondary">
                      {t('friendCoffee.note')}
                    </Text>
                    <Text>{coffee.notes}</Text>
                  </View>
                ) : null}
                {!coffee?.rating && rows.length === 0 && !coffee?.notes ? (
                  <Text color="textSecondary">{t('friendCoffee.plain')}</Text>
                ) : null}
              </Animated.View>
            )}

            <Text variant="caption" color="textMuted">
              {t('friendCoffee.privacy')}
            </Text>
          </View>
  );
}

const styles = themed(() => ({
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  loading: {
    minHeight: DETAILS_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    minHeight: DETAILS_MIN,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  note: {
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.frame,
    backgroundColor: colors.background,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
}));
