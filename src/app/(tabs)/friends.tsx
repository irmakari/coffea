import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, Icon, IconButton, LoadingState, ScreenHeader, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import type { FeedItem } from '@/features/feed/feedApi';
import { FeedCard } from '@/features/feed/FeedCard';
import { useFeed } from '@/features/feed/useFeed';
import { confirm, showActions } from '@/features/friends/actions';
import { personName } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { askToReport } from '@/features/friends/report';
import { LeaderboardCard } from '@/features/leaderboard/LeaderboardCard';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import { useProfile } from '@/features/profile/ProfileProvider';
import { formatNumber, t } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';
import { colors, contentColumn, radii, spacing } from '@/theme';

export default function FriendsFeedScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { profile } = useProfile();
  const { friends, incoming, block, reload: reloadFriends } = useFriends();
  const feed = useFeed();
  const board = useLeaderboard(0);
  const [refreshing, setRefreshing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([feed.reload(), reloadFriends(), board.reload()]);
    } finally {
      setRefreshing(false);
    }
  };

  const cheer = (item: FeedItem) => {
    setFailure(null);
    tapFeedback();
    feed.cheer(item).catch(() => setFailure(t('friends.updateError')));
  };

  const blockAuthor = (item: FeedItem) => {
    const name = personName(item.author);
    confirm(t('friends.block.title', { name }), t('friends.block.body'), t('friends.block.confirm'), async () => {
      setFailure(null);
      try {
        await block(item.author);
        feed.dropAuthor(item.author.id);
      } catch {
        setFailure(t('friends.updateError'));
      }
    });
  };

  const openMenu = (item: FeedItem) => {
    const name = personName(item.author);
    showActions(name, [
      {
        label: t('report.coffee'),
        onPress: () =>
          askToReport({
            person: { id: item.author.id, name },
            entryId: item.id,
            onBlock: () => blockAuthor(item),
            onError: () => setFailure(t('friends.updateError')),
          }),
      },
      { label: t('friends.menu.block'), destructive: true, onPress: () => blockAuthor(item) },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.title}>
          <ScreenHeader title={t('feed.title')} />
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="addFriend" label={t('friends.add')} onPress={() => router.push('/friends/add')} />
          <View>
            <IconButton icon="friends" label={t('feed.manage')} onPress={() => router.push('/friends/manage')} />
            {incoming.length > 0 ? <View style={styles.badge} pointerEvents="none" /> : null}
          </View>
        </View>
      </View>

      {incoming.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/friends/manage')}
          style={({ pressed }) => [styles.requests, pressed && styles.pressed]}
        >
          <Icon name="friends" size={20} />
          <Text variant="bodyStrong" style={styles.requestsText}>
            {incoming.length === 1
              ? t('feed.requests.one')
              : t('feed.requests.other', { count: formatNumber(incoming.length) })}
          </Text>
          <Icon name="chevronRight" size={16} color="textMuted" />
        </Pressable>
      ) : null}

      {friends.length > 0 && board.status === 'ready' ? (
        <LeaderboardCard standings={board.standings} userId={userId} />
      ) : null}

      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {failure}
        </Text>
      ) : null}
    </View>
  );

  const empty =
    feed.status === 'loading' ? (
      <LoadingState />
    ) : feed.status === 'error' ? (
      <EmptyState
        title={t('feed.loadError.title')}
        body={t('feed.loadError.body')}
        action={<Button variant="secondary" label={t('common.retry')} onPress={feed.reload} />}
      />
    ) : !profile.username ? (
      <EmptyState
        title={t('friends.needsUsername.title')}
        body={t('friends.needsUsername.body')}
        action={<Button label={t('friends.needsUsername.action')} onPress={() => router.push('/settings/username')} />}
      />
    ) : friends.length === 0 ? (
      <EmptyState
        title={t('friends.empty.title')}
        body={t('friends.empty.body')}
        action={<Button label={t('friends.add')} onPress={() => router.push('/friends/add')} />}
      />
    ) : (
      <EmptyState title={t('feed.empty.title')} body={t('feed.empty.body')} />
    );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            mine={item.author.id === userId}
            onOpen={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
            onCheer={() => cheer(item)}
            onMore={() => openMenu(item)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          feed.loadingMore ? <ActivityIndicator color={colors.textMuted} style={styles.more} /> : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} />}
        contentContainerStyle={[contentColumn, styles.content]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },
  requests: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.highlight,
  },
  requestsText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  separator: {
    height: spacing.lg,
  },
  more: {
    marginTop: spacing.lg,
  },
});
