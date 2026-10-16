import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  Text,
} from '@/components/ui';
import { albumSlots } from '@/features/album/album';
import { ActivityRow } from '@/features/album/FriendsAlbum';
import { openFriendMenu } from '@/features/friends/friendMenu';
import { personName } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { useFriendPage } from '@/features/friends/useFriendPage';
import { valueLabel } from '@/features/leaderboard/StandingRow';
import { formatNumber, t } from '@/i18n';
import { colors, radii, spacing, themed } from '@/theme';

// A friend's page, opened from their row or from one of their firsts: who
// they are, their week, their album, and the coffees they tried for the
// first time lately, the tapped one first.
export default function FriendScreen() {
  const { id, coffee } = useLocalSearchParams<{ id: string; coffee?: string }>();
  const { friends, remove, block } = useFriends();
  const page = useFriendPage(id);
  const [failure, setFailure] = useState<string | null>(null);
  const person = friends.find((friend) => friend.id === id);

  if (!person) {
    return (
      <Screen edges={['top', 'bottom']}>
        <PageHeader padded={false} title={t('friendPage.title')} />
        <EmptyState title={t('friendPage.gone.title')} body={t('friendPage.gone.body')} />
      </Screen>
    );
  }

  const name = personName(person);
  const handle = person.displayName && person.username ? `@${person.username}` : null;
  const focus = coffee ? page.firsts.find((item) => item.coffee === coffee) : undefined;
  const firsts = focus ? [focus, ...page.firsts.filter((item) => item !== focus)] : page.firsts;
  const total = albumSlots().length;
  // Someone off the leaderboard shares no totals, here or anywhere.
  const hidden = !page.week && !page.album;

  const openMenu = () =>
    openFriendMenu(person, {
      remove,
      block,
      run: async (action) => {
        setFailure(null);
        try {
          await action();
          router.back();
        } catch {
          setFailure(t('friends.updateError'));
        }
      },
      onError: () => setFailure(t('friends.updateError')),
    });

  return (
    <Screen scroll edges={['top', 'bottom']} onRefresh={page.reload} contentStyle={styles.content}>
      <PageHeader
        padded={false}
        // The name is the page's own heading, just below.
        title=""
        trailing={<IconButton icon="more" plain label={t('friends.more', { name })} onPress={openMenu} />}
      />

      {/* Laid out as the user's own profile is, so the two read as one kind of page. */}
      <View style={styles.identity}>
        <Avatar uri={person.avatarUrl} cacheKey={person.avatarPath} name={name} size={84} />
        <View style={styles.identityText}>
          <Text variant="title" accessibilityRole="header" numberOfLines={2}>
            {name}
          </Text>
          {handle ? (
            <Text variant="small" color="textSecondary" numberOfLines={1}>
              {handle}
            </Text>
          ) : null}
        </View>
      </View>

      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {failure}
        </Text>
      ) : null}

      {page.status === 'loading' ? (
        <LoadingState />
      ) : page.status === 'error' ? (
        <EmptyState
          title={t('common.loadError.title')}
          body={t('common.loadError.body')}
          action={<Button variant="secondary" label={t('common.retry')} onPress={page.reload} />}
        />
      ) : hidden ? (
        <View style={styles.card}>
          <Text color="textSecondary">{t('friendPage.hidden')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.cards}>
            <View style={styles.card}>
              <Text variant="eyebrow" color="textSecondary">
                {t('friendPage.week.title')}
              </Text>
              <View style={styles.figure}>
                <Text variant="display">{formatNumber(page.week?.cups ?? 0)}</Text>
                <Text variant="small" color="textSecondary">
                  {t(page.week?.cups === 1 ? 'friendPage.week.cup' : 'friendPage.week.cups')}
                </Text>
              </View>
              <Text variant="caption" color="textMuted" numberOfLines={2}>
                {valueLabel('days', page.week?.days ?? 0)} · {valueLabel('cafes', page.week?.cafes ?? 0)}
              </Text>
            </View>

            <View style={styles.card}>
              <Text variant="eyebrow" color="textSecondary">
                {t('friendPage.album.title')}
              </Text>
              <View style={styles.figure}>
                <Text variant="display">{formatNumber(page.album?.value ?? 0)}</Text>
                <Text variant="small" color="textSecondary">
                  {t('friendPage.album.of', { total: formatNumber(total) })}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(((page.album?.value ?? 0) / Math.max(total, 1)) * 100, 100)}%` },
                  ]}
                />
              </View>
              {page.album ? (
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {t('friendPage.album.rank', { rank: formatNumber(page.album.rank) })}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('friendPage.firsts')} />
            {firsts.length === 0 ? (
              <Text color="textSecondary">{t('friendPage.noFirsts')}</Text>
            ) : (
              <View>
                {firsts.map((item, index) => (
                  <ActivityRow key={item.coffee} item={item} last={index === firsts.length - 1} />
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <Text variant="small" color="textMuted" style={styles.privacy}>
        {t('friendPage.privacy')}
      </Text>
    </Screen>
  );
}

const styles = themed(() => ({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  identityText: {
    flex: 1,
    gap: spacing.xs,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    // Only an outline, so no pale block sits on the page.
    borderWidth: 1,
    borderColor: colors.border,
  },
  // The number with its unit beside it, sharing a baseline.
  figure: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: spacing.xs + 2,
  },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  section: {
    gap: spacing.xs,
  },
  privacy: {
    marginTop: spacing.sm,
  },
}));
