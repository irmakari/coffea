import { useMemo, useState } from 'react';
import { Switch, View } from 'react-native';

import { Button, Chip, EmptyState, LoadingState, PageHeader, Screen, SegmentedControl, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { metrics, rank, weekRange, type BoardMetric, type Week } from '@/features/leaderboard/leaderboardApi';
import { Podium } from '@/features/leaderboard/Podium';
import { standingName } from '@/features/leaderboard/StandingRow';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import { useProfile } from '@/features/profile/ProfileProvider';
import { formatDate, t } from '@/i18n';
import { colors, sizes, spacing, themed } from '@/theme';

const weeks: { week: Week; label: () => string }[] = [
  { week: 0, label: () => t('leaderboard.weeks.this') },
  { week: -1, label: () => t('leaderboard.weeks.last') },
];

export default function LeaderboardScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { profile, setOnLeaderboard } = useProfile();
  const [week, setWeek] = useState<Week>(0);
  const [metric, setMetric] = useState<BoardMetric>('cups');
  const [failure, setFailure] = useState<string | null>(null);
  const board = useLeaderboard(week);

  const ranked = useMemo(
    () => rank(board.standings, metric, (standing) => standingName(standing, userId)),
    [board.standings, metric, userId],
  );
  const { start, end } = weekRange(week);
  const anyone = ranked.some((standing) => standing.value > 0);

  const toggleShown = async (value: boolean) => {
    setFailure(null);
    try {
      await setOnLeaderboard(value);
      await board.reload();
    } catch {
      setFailure(t('leaderboard.visibility.error'));
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} onRefresh={board.reload}>
      <PageHeader
        padded={false}
        title={t('leaderboard.title')}
        subtitle={t('leaderboard.range', { start: formatDate(start, 'dayShort'), end: formatDate(end, 'dayShort') })}
      />

      <View style={styles.controls}>
        <SegmentedControl
          options={weeks.map((option) => ({ value: option.week, label: option.label() }))}
          value={week}
          onChange={setWeek}
        />
        <View style={styles.chips} accessibilityRole="radiogroup">
          {metrics.map((option) => (
            <Chip
              key={option}
              label={t(`leaderboard.metrics.${option}`)}
              selected={metric === option}
              onPress={() => setMetric(option)}
              plain
            />
          ))}
        </View>
      </View>

      {board.status === 'loading' ? (
        <LoadingState />
      ) : board.status === 'error' ? (
        <EmptyState
          title={t('leaderboard.loadError.title')}
          body={t('leaderboard.loadError.body')}
          action={<Button variant="secondary" label={t('common.retry')} onPress={board.reload} />}
        />
      ) : !anyone ? (
        <EmptyState
          title={t(week === 0 ? 'leaderboard.empty.this' : 'leaderboard.empty.last')}
          body={t('leaderboard.empty.body')}
        />
      ) : (
        <View style={styles.rows}>
          <Podium ranked={ranked} metric={metric} userId={userId} />
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.visibility}>
          <View style={styles.visibilityText}>
            <Text variant="bodyStrong">{t('leaderboard.visibility.label')}</Text>
            <Text variant="small" color="textSecondary">
              {t(profile.onLeaderboard ? 'leaderboard.visibility.on' : 'leaderboard.visibility.off')}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t('leaderboard.visibility.label')}
            value={profile.onLeaderboard}
            onValueChange={toggleShown}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>
        {failure ? (
          <Text variant="small" color="danger" accessibilityLiveRegion="polite">
            {failure}
          </Text>
        ) : null}
        <Text variant="caption" color="textMuted">
          {t('leaderboard.rules')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = themed(() => ({
  controls: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rows: {
    marginTop: spacing.lg,
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  visibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  visibilityText: {
    flex: 1,
    gap: 2,
  },
}));
