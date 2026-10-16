import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Avatar,
  Button,
  CupMark,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  Text,
} from '@/components/ui';
import { albumSlots } from '@/features/album/album';
import { activityWhen, coffeeName } from '@/features/album/FriendsAlbum';
import { openFriendMenu } from '@/features/friends/friendMenu';
import { personName } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { useFriendPage } from '@/features/friends/useFriendPage';
import { formatNumber, t } from '@/i18n';
import { colors, radii, sizes, spacing, themed } from '@/theme';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="heading">{value}</Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// A friend's page, opened from their row or from one of their firsts: who
// they are, their totals, and the coffees they tried for the first time
// lately, the tapped one on top.
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
  const rest = page.firsts.filter((item) => item !== focus);

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

      <View style={styles.hero}>
        <Avatar uri={person.avatarUrl} cacheKey={person.avatarPath} name={name} size={88} />
        <View style={styles.heroText}>
          <Text variant="title" numberOfLines={1}>
            {name}
          </Text>
          {handle ? <Text color="textSecondary">{handle}</Text> : null}
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
      ) : (
        <>
          {focus ? (
            <View style={styles.focus}>
              <CupMark drink={focus.coffee} size={72} />
              <View style={styles.focusText}>
                <Text variant="subheading">
                  {t('activity.collected', { name, coffee: coffeeName(focus.coffee) })}
                </Text>
                <Text variant="small" color="textSecondary">
                  {activityWhen(focus.collectedAt)} · {t('activity.progress', { count: focus.collected })}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.stats}>
            <Stat
              value={page.week ? formatNumber(page.week.cups) : '–'}
              label={t('friendPage.stats.week')}
            />
            <View style={styles.statRule} />
            <Stat
              value={t('friendPage.stats.albumValue', {
                count: formatNumber(page.album?.value ?? 0),
                total: formatNumber(albumSlots().length),
              })}
              label={t('friendPage.stats.album')}
            />
            <View style={styles.statRule} />
            <Stat
              value={page.album ? `#${formatNumber(page.album.rank)}` : '–'}
              label={t('friendPage.stats.rank')}
            />
          </View>

          <View>
            <SectionHeader title={t('friendPage.firsts')} />
            {rest.length === 0 ? (
              <Text color="textSecondary">{t(focus ? 'friendPage.noOtherFirsts' : 'friendPage.noFirsts')}</Text>
            ) : (
              rest.map((item, index) => (
                <View key={item.coffee} style={[styles.row, index === rest.length - 1 && styles.rowLast]}>
                  <CupMark drink={item.coffee} size={40} />
                  <View style={styles.rowText}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {coffeeName(item.coffee)}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {activityWhen(item.collectedAt)} · {t('activity.progress', { count: item.collected })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <Text variant="small" color="textMuted">
            {t('friendPage.privacy')}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = themed(() => ({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  // The coffee the user tapped to get here, on tan like the home hero.
  focus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    backgroundColor: colors.highlight,
  },
  focusText: {
    flex: 1,
    gap: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    borderWidth: sizes.hairline,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  statRule: {
    width: sizes.hairline,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
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
  rowText: {
    flex: 1,
    gap: 2,
  },
}));
