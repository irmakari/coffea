import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Icon, Text } from '@/components/ui';
import { personName } from '@/features/friends/friendsApi';
import { formatNumber, t } from '@/i18n';
import { fonts, palette, radii, sizes, spacing } from '@/theme';

import { rank, type Metric, type Ranked, type Standing } from './leaderboardApi';
import { standingName, valueLabel } from './StandingRow';

const SHOWN = 3;

export const boardTabs = ['week', 'album'] as const;
type BoardTab = (typeof boardTabs)[number];

export const ink = {
  card: palette.espresso,
  raised: palette.darkRoast,
  text: palette.softWhite,
  muted: palette.oatTaupe,
  accent: palette.latte,
  track: 'rgba(255, 252, 248, 0.12)',
};

// The place in a circle: the leader's filled in latte, the rest outlined.
export function Place({ rank: place }: { rank: number }) {
  const first = place === 1;
  return (
    <View style={[styles.place, first ? styles.placeFirst : styles.placeOther]}>
      <Text style={[styles.placeText, { color: first ? ink.card : ink.muted }]} maxFontSizeMultiplier={1}>
        {place}
      </Text>
    </View>
  );
}

export function Row({ standing, unit, leaderValue, isMe }: { standing: Ranked; unit: Metric; leaderValue: number; isMe: boolean }) {
  const name = isMe ? t('feed.you') : personName(standing);
  const share = leaderValue > 0 ? standing.value / leaderValue : 0;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('leaderboard.rowLabel', { rank: standing.rank, name, value: valueLabel(unit, standing.value) })}
    >
      <Place rank={standing.rank} />
      <Avatar uri={standing.avatarUrl} cacheKey={standing.avatarPath} name={personName(standing)} size={36} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={[styles.name, isMe && styles.nameMe]}>
            {name}
          </Text>
          <Text style={styles.value}>{formatNumber(standing.value)}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(share * 100, standing.value > 0 ? 4 : 0)}%` }, isMe && styles.fillMe]} />
        </View>
      </View>
    </View>
  );
}

type FriendsBoardProps = {
  week: Standing[] | null;
  album: Ranked[] | null;
  userId?: string;
};

// The week's cups and the album, ever, on one dark card the rest of the
// app's pale pages set off. The user's place leads, then the top three.
export function FriendsBoard({ week, album, userId }: FriendsBoardProps) {
  const [tab, setTab] = useState<BoardTab>('week');
  const weekRanked = useMemo(
    () => (week ? rank(week, 'cups', (standing) => standingName(standing, userId)) : null),
    [week, userId],
  );
  const ranked = tab === 'week' ? weekRanked : album;
  const unit = tab === 'week' ? 'cups' : 'album';

  const leader = ranked?.[0];
  const me = ranked?.find((standing) => standing.id === userId);
  const shown = ranked?.slice(0, SHOWN) ?? [];
  const meBelow = me && !shown.includes(me) ? me : null;
  const anyone = !!leader && leader.value > 0;

  return (
    <View style={styles.card}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {boardTabs.map((option) => {
          const selected = tab === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setTab(option)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, { color: selected ? ink.card : ink.muted }]}>
                {t(`leaderboard.board.tabs.${option}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.headline}>
        <Text style={styles.bigRank}>{me && anyone ? `#${me.rank}` : '—'}</Text>
        <View style={styles.headlineText}>
          <Text style={styles.headlineValue}>
            {me ? valueLabel(unit, me.value) : t('leaderboard.board.none')}
          </Text>
          <Text style={styles.headlineHint} numberOfLines={2}>
            {t(`leaderboard.board.hint.${tab}`)}
          </Text>
        </View>
      </View>

      {!ranked ? null : anyone ? (
        <View style={styles.rows}>
          {shown.map((standing) => (
            <Row key={standing.id} standing={standing} unit={unit} leaderValue={leader.value} isMe={standing.id === userId} />
          ))}
          {meBelow ? (
            <>
              <View style={styles.divider} />
              <Row standing={meBelow} unit={unit} leaderValue={leader.value} isMe />
            </>
          ) : null}
        </View>
      ) : (
        <Text style={styles.headlineHint}>
          {t(tab === 'week' ? 'leaderboard.card.nobody' : 'activity.albumTitle.nobody')}
        </Text>
      )}

      {tab === 'week' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/leaderboard')}
          style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
        >
          <Text style={styles.footerText}>{t('leaderboard.open')}</Text>
          <Icon name="chevronRight" size={16} color="placeholder" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl - 4,
    gap: spacing.lg,
    borderRadius: radii.frame,
    backgroundColor: ink.card,
    shadowColor: palette.espresso,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: ink.raised,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  tabSelected: {
    backgroundColor: ink.accent,
  },
  tabText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bigRank: {
    fontFamily: fonts.sansBold,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -1.6,
    color: ink.accent,
    fontVariant: ['tabular-nums'],
  },
  headlineText: {
    flex: 1,
    gap: 2,
  },
  headlineValue: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    color: ink.text,
  },
  headlineHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: ink.muted,
  },
  rows: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  place: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeFirst: {
    backgroundColor: ink.accent,
  },
  placeOther: {
    borderWidth: 1,
    borderColor: ink.track,
  },
  placeText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  rowBody: {
    flex: 1,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: ink.text,
  },
  nameMe: {
    fontFamily: fonts.sansStrong,
  },
  value: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: ink.text,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: ink.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: ink.muted,
  },
  fillMe: {
    backgroundColor: ink.accent,
  },
  divider: {
    height: sizes.hairline,
    backgroundColor: ink.track,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: sizes.hairline,
    borderTopColor: ink.track,
  },
  footerText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: ink.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
