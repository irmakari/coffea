import { StyleSheet, View } from 'react-native';

import { Avatar, CupMark, SectionHeader, Text } from '@/components/ui';
import { isCoffeeType } from '@/features/entries/types';
import { personName } from '@/features/friends/friendsApi';
import type { Ranked } from '@/features/leaderboard/leaderboardApi';
import { StandingRow, standingName, valueLabel } from '@/features/leaderboard/StandingRow';
import { t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import type { Activity } from './albumFriendsApi';

const SHOWN = 3;

// Who has collected the most album coffees, ever: the top three, and the
// user below them when they are not among them.
export function AlbumBoardCard({ board, userId }: { board: Ranked[]; userId?: string }) {
  const leader = board[0];
  const me = board.find((standing) => standing.id === userId);
  const shown = board.slice(0, SHOWN);
  const meBelow = me && !shown.includes(me) ? me : null;

  const title =
    !leader || leader.value === 0
      ? t('activity.albumTitle.nobody')
      : leader.id === userId
        ? t('activity.albumTitle.youLead', { value: valueLabel('album', leader.value) })
        : t('activity.albumTitle.leads', {
            name: standingName(leader, userId),
            value: valueLabel('album', leader.value),
          });

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.topText}>
          <Text variant="eyebrow" color="accentPressed">
            {t('activity.albumEyebrow')}
          </Text>
          <Text variant="heading" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="small" color="accentPressed">
            {t('activity.albumBody')}
          </Text>
        </View>
        <CupMark size={56} />
      </View>
      {leader && leader.value > 0 ? (
        <View style={styles.rows}>
          {shown.map((standing) => (
            <StandingRow key={standing.id} standing={standing} metric="album" isMe={standing.id === userId} compact />
          ))}
          {meBelow ? (
            <>
              <View style={styles.gap} />
              <StandingRow standing={meBelow} metric="album" isMe compact />
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function coffeeName(coffee: string) {
  return isCoffeeType(coffee) ? t(`coffeeTypes.${coffee}`) : coffee;
}

// "Today", "Yesterday", "3 days ago", by the phone's calendar days.
function when(iso: string, now = new Date()) {
  const day = new Date(iso);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()) /
      86_400_000,
  );
  if (days <= 0) return t('activity.when.today');
  if (days === 1) return t('activity.when.yesterday');
  return t('activity.when.days', { count: days });
}

// Friends' latest firsts: one line each, no photos.
export function ActivityList({ items }: { items: Activity[] }) {
  return (
    <View>
      <SectionHeader title={t('activity.title')} />
      {items.length === 0 ? (
        <Text color="textSecondary">{t('activity.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View
              key={`${item.person.id}:${item.coffee}`}
              style={[styles.item, index === items.length - 1 && styles.lastItem]}
            >
              <Avatar
                uri={item.person.avatarUrl}
                cacheKey={item.person.avatarPath}
                name={personName(item.person)}
                size={40}
              />
              <View style={styles.itemText}>
                <Text numberOfLines={2}>
                  {t('activity.collected', { name: personName(item.person), coffee: coffeeName(item.coffee) })}
                </Text>
                <Text variant="caption" color="textMuted">
                  {when(item.collectedAt)} · {t('activity.progress', { count: item.collected })}
                </Text>
              </View>
              <CupMark drink={item.coffee} size={40} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl - 4,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    gap: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  topText: {
    flex: 1,
    gap: spacing.xs,
  },
  rows: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  gap: {
    height: sizes.hairline,
    marginVertical: spacing.xs,
    backgroundColor: colors.border,
  },
  list: {
    paddingHorizontal: spacing.lg,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
});
