import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, EmptyState, LoadingState, ModalHeader, Screen, Text } from '@/components/ui';
import { findByUsername, personName, type Person } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { normalizeUsername } from '@/features/friends/username';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import { spacing } from '@/theme';

// Where an invite link lands: coffea://add/<username>.
export default function InviteScreen() {
  const params = useLocalSearchParams<{ username: string }>();
  const username = normalizeUsername(params.username ?? '');
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { request, respond } = useFriends();

  const [person, setPerson] = useState<Person | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setPerson(await findByUsername(username));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    findByUsername(username).then(
      (found) => {
        if (cancelled) return;
        setPerson(found);
        setStatus('ready');
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [username]);

  const isSelf = profile.username !== null && profile.username === username;

  const add = async () => {
    if (!person) return;
    setFailure(null);
    setSaving(true);
    try {
      const relation = person.relation === 'incoming' ? await respond(person, true) : await request(person);
      setPerson({ ...person, relation });
      successFeedback();
    } catch {
      setFailure(t('friends.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const body = () => {
    if (isSelf) return <EmptyState title={t('friends.invitePage.self')} />;
    if (status === 'loading') return <LoadingState />;
    if (status === 'error') {
      return (
        <EmptyState
          title={t('friends.loadError.title')}
          body={t('friends.loadError.body')}
          action={<Button variant="secondary" label={t('common.retry')} onPress={load} />}
        />
      );
    }
    if (!person) return <EmptyState title={t('friends.invitePage.notFound')} />;

    const name = personName(person);
    const note =
      person.relation === 'friend'
        ? t('friends.invitePage.friends')
        : person.relation === 'outgoing'
          ? t('friends.invitePage.requested')
          : person.relation === 'incoming'
            ? t('friends.invitePage.incoming', { name })
            : null;

    return (
      <>
        <View style={styles.person}>
          <Avatar uri={person.avatarUrl} cacheKey={person.avatarPath} name={name} size={96} />
          <View style={styles.names}>
            <Text variant="title" align="center" numberOfLines={2}>
              {name}
            </Text>
            {person.displayName && person.username ? (
              <Text color="textSecondary" align="center">
                @{person.username}
              </Text>
            ) : null}
          </View>
          {note ? (
            <Text color="textSecondary" align="center" accessibilityLiveRegion="polite" style={styles.note}>
              {note}
            </Text>
          ) : null}
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {failure ? (
            <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
              {failure}
            </Text>
          ) : null}
          {person.relation === 'none' || person.relation === 'incoming' ? (
            <Button
              label={person.relation === 'incoming' ? t('friends.invitePage.accept') : t('friends.invitePage.add')}
              loading={saving}
              onPress={add}
            />
          ) : (
            <Button variant="secondary" label={t('common.done')} onPress={() => router.back()} />
          )}
        </View>
      </>
    );
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t('friends.invitePage.title')} />
      <View style={styles.body}>{body()}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },
  person: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  names: {
    gap: spacing.xs,
  },
  note: {
    maxWidth: 300,
  },
  footer: {
    gap: spacing.sm,
  },
});
