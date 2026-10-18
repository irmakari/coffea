import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, Icon, IconButton, ScreenHeader, Text } from '@/components/ui';
import { ActivityList } from '@/features/album/FriendsAlbum';
import { useFriendsAlbum } from '@/features/album/useFriendsAlbum';
import { useAuth } from '@/features/auth/AuthProvider';
import { useFriends } from '@/features/friends/FriendsProvider';
import { FriendsLogList, useFriendsLog } from '@/features/friends/FriendsLogList';
import { FriendsBoard } from '@/features/leaderboard/FriendsBoard';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import { useProfile } from '@/features/profile/ProfileProvider';
import { formatNumber, t } from '@/i18n';
import { colors, contentColumn, radii, spacing, themed } from '@/theme';

export default function FriendsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { profile } = useProfile();
  const { friends, incoming, reload: reloadFriends } = useFriends();
  const board = useLeaderboard(0);
  const album = useFriendsAlbum();
  const log = useFriendsLog();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([reloadFriends(), board.reload(), album.reload(), log.reload()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} />}
        contentContainerStyle={[contentColumn, styles.content]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.title}>
            <ScreenHeader title={t('feed.title')} />
          </View>
          <View style={styles.headerActions}>
            <IconButton plain icon="addFriend" label={t('friends.add')} onPress={() => router.push('/friends/add')} />
            <View>
              <IconButton plain icon="friends" label={t('feed.manage')} onPress={() => router.push('/friends/manage')} />
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

        {!profile.username ? (
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
          <>
            {board.status === 'ready' || album.status === 'ready' ? (
              <FriendsBoard
                week={board.status === 'ready' ? board.standings : null}
                album={album.status === 'ready' ? album.board : null}
                userId={userId}
              />
            ) : null}
            {/* Every coffee friends log, once the server offers it; until then
                only their album firsts. */}
            {log.status === 'ready' ? (
              <FriendsLogList groups={log.groups} coffees={log.coffees} me={log.me} />
            ) : log.status === 'loading' ? null : album.status === 'ready' ? (
              <ActivityList items={album.activity} />
            ) : album.status === 'error' ? (
              <Text variant="small" color="textSecondary">
                {t('activity.error')}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
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
}));
