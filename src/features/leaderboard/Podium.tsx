import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Icon, Text } from '@/components/ui';
import { personName } from '@/features/friends/friendsApi';
import { shareInvite } from '@/features/friends/invite';
import { useProfile } from '@/features/profile/ProfileProvider';
import { formatNumber, t } from '@/i18n';
import { fonts, radii, spacing, themed } from '@/theme';

import { ink, Row } from './FriendsBoard';
import type { Metric, Ranked } from './leaderboardApi';
import { valueLabel } from './StandingRow';

// One step of the podium: the person, their number and a block whose height
// follows the place.
function Step({ standing, metric, isMe, height }: { standing: Ranked; metric: Metric; isMe: boolean; height: number }) {
  const first = standing.rank === 1;
  const name = isMe ? t('feed.you') : personName(standing);
  return (
    <View
      style={styles.step}
      accessible
      accessibilityLabel={t('leaderboard.rowLabel', { rank: standing.rank, name, value: valueLabel(metric, standing.value) })}
    >
      <View style={[styles.ring, first && styles.ringFirst]}>
        <Avatar
          uri={standing.avatarUrl}
          cacheKey={standing.avatarPath}
          name={personName(standing)}
          size={first ? 68 : 52}
        />
      </View>
      <Text numberOfLines={1} style={[styles.name, isMe && styles.nameMe]}>
        {name}
      </Text>
      <Text style={styles.value}>{formatNumber(standing.value)}</Text>
      <View style={[styles.block, { height }, first && styles.blockFirst]}>
        <Text style={[styles.place, { color: first ? ink.card : ink.muted }]}>{standing.rank}</Text>
      </View>
    </View>
  );
}

// A step nobody stands on yet: an open seat that invites a friend to take
// it, so a small circle still reads as a podium rather than a gap.
function EmptyStep({ place, height }: { place: number; height: number }) {
  const { profile } = useProfile();
  const invite = () => {
    if (profile.username) shareInvite(profile.username).catch(() => {});
    else router.push('/friends/add');
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('friends.invite.action')}
      onPress={invite}
      style={({ pressed }) => [styles.step, pressed && styles.pressed]}
    >
      <View style={styles.seat}>
        <Icon name="plus" size={20} color="boardMuted" />
      </View>
      <Text numberOfLines={1} style={[styles.name, styles.nameEmpty]}>
        {t('leaderboard.invite')}
      </Text>
      <View style={[styles.block, styles.blockEmpty, { height }]}>
        <Text style={[styles.place, { color: ink.muted }]}>{place}</Text>
      </View>
    </Pressable>
  );
}

// The top three on steps, the leader in the middle, and everyone else in a
// list beneath, all on one espresso card.
export function Podium({ ranked, metric, userId }: { ranked: Ranked[]; metric: Metric; userId?: string }) {
  const [first, second, third] = ranked;
  const rest = ranked.slice(3);
  const leaderValue = first?.value ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.podium}>
        {second ? <Step standing={second} metric={metric} isMe={second.id === userId} height={56} /> : <EmptyStep place={2} height={56} />}
        {first ? <Step standing={first} metric={metric} isMe={first.id === userId} height={84} /> : null}
        {third ? <Step standing={third} metric={metric} isMe={third.id === userId} height={40} /> : <EmptyStep place={3} height={40} />}
      </View>
      {rest.length > 0 ? (
        <View style={styles.rest}>
          {rest.map((standing) => (
            <Row key={standing.id} standing={standing} unit={metric} leaderValue={leaderValue} isMe={standing.id === userId} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = themed(() => ({
  card: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    backgroundColor: ink.card,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  ring: {
    padding: 3,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: ink.track,
  },
  ringFirst: {
    borderColor: ink.accent,
  },
  name: {
    marginTop: spacing.xs,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: ink.text,
  },
  nameMe: {
    fontFamily: fonts.sansStrong,
  },
  value: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: ink.text,
    fontVariant: ['tabular-nums'],
  },
  block: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: ink.raised,
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  blockEmpty: {
    backgroundColor: ink.track,
  },
  // The size of a second-place avatar in its ring, drawn as an open seat.
  seat: {
    width: 62,
    height: 62,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: ink.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameEmpty: {
    color: ink.muted,
  },
  pressed: {
    opacity: 0.7,
  },
  blockFirst: {
    backgroundColor: ink.accent,
  },
  place: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  rest: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ink.track,
  },
}));
