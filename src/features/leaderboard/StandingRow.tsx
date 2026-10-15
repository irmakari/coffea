import { StyleSheet, View } from 'react-native';

import { Avatar, Text } from '@/components/ui';
import { personName } from '@/features/friends/friendsApi';
import { formatNumber, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import type { Metric, Ranked } from './leaderboardApi';

const medals = ['🥇', '🥈', '🥉'];

// "7 cups", "1 day", "3 cafés".
export function valueLabel(metric: Metric, value: number) {
  return value === 1
    ? t(`leaderboard.units.${metric}.one`)
    : t(`leaderboard.units.${metric}.other`, { count: formatNumber(value) });
}

// What to call someone on the board: "You" for the user.
export function standingName(standing: Pick<Ranked, 'id' | 'displayName' | 'username'>, userId?: string) {
  return standing.id === userId ? t('feed.you') : personName(standing);
}

type StandingRowProps = {
  standing: Ranked;
  metric: Metric;
  isMe: boolean;
  // The summary card's rows are tighter and sit on tan.
  compact?: boolean;
};

export function StandingRow({ standing, metric, isMe, compact = false }: StandingRowProps) {
  const name = isMe ? t('feed.you') : personName(standing);
  // Nobody wins a medal for nothing.
  const medal = standing.value > 0 ? medals[standing.rank - 1] : undefined;

  return (
    <View
      style={[styles.row, compact ? styles.compact : styles.full, isMe && !compact && styles.mine]}
      accessible
      accessibilityLabel={t('leaderboard.rowLabel', {
        rank: standing.rank,
        name,
        value: valueLabel(metric, standing.value),
      })}
    >
      <View style={styles.place}>
        {medal ? (
          <Text variant="subheading">{medal}</Text>
        ) : (
          <Text variant="bodyStrong" color="textSecondary">
            {standing.rank}
          </Text>
        )}
      </View>
      <Avatar uri={standing.avatarUrl} cacheKey={standing.avatarPath} name={personName(standing)} size={compact ? 32 : 40} />
      <Text variant={isMe ? 'bodyStrong' : 'body'} numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Text variant="bodyStrong">{valueLabel(metric, standing.value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  full: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  compact: {
    minHeight: 44,
  },
  mine: {
    borderRadius: radii.control,
    borderBottomColor: 'transparent',
    backgroundColor: colors.surface,
  },
  place: {
    width: 28,
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
});
