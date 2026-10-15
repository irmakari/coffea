import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import { rank, type Standing } from './leaderboardApi';
import { StandingRow, standingName, valueLabel } from './StandingRow';

const SHOWN = 3;

type LeaderboardCardProps = {
  standings: Standing[];
  userId?: string;
};

// This week's cups at a glance, at the top of the feed. Opens the full board.
export function LeaderboardCard({ standings, userId }: LeaderboardCardProps) {
  const ranked = useMemo(
    () => rank(standings, 'cups', (standing) => standingName(standing, userId)),
    [standings, userId],
  );
  const leader = ranked[0];
  const me = ranked.find((standing) => standing.id === userId);
  const shown = ranked.slice(0, SHOWN);
  const meBelow = me && !shown.includes(me) ? me : null;

  const title = !leader || leader.value === 0
    ? t('leaderboard.card.nobody')
    : leader.id === userId
      ? t('leaderboard.card.youLead', { value: valueLabel('cups', leader.value) })
      : t('leaderboard.card.leads', { name: standingName(leader, userId), value: valueLabel('cups', leader.value) });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('leaderboard.open')}
      onPress={() => router.push('/leaderboard')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.topText}>
          <Text variant="eyebrow" color="accentPressed">
            {t('leaderboard.card.eyebrow')}
          </Text>
          <Text variant="heading" numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text style={styles.trophy}>🏆</Text>
      </View>

      {leader && leader.value > 0 ? (
        <View style={styles.rows}>
          {shown.map((standing) => (
            <StandingRow key={standing.id} standing={standing} metric="cups" isMe={standing.id === userId} compact />
          ))}
          {meBelow ? (
            <>
              <View style={styles.gap} />
              <StandingRow standing={meBelow} metric="cups" isMe compact />
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text variant="small" color="accentPressed" style={styles.footerText}>
          {t('leaderboard.open')}
        </Text>
        <Icon name="chevronRight" size={16} color="accentPressed" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl - 4,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.85,
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
  trophy: {
    fontSize: 40,
    lineHeight: 48,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerText: {
    flex: 1,
  },
});
