import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  IconButton,
  ListRow,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  Text,
} from '@/components/ui';
import { openFriendMenu } from '@/features/friends/friendMenu';
import { personName, type Connection, type Person } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { shareInvite } from '@/features/friends/invite';
import { PersonRow, RowButton } from '@/features/friends/PersonRow';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import { spacing, themed } from '@/theme';

export default function FriendsScreen() {
  const { profile } = useProfile();
  const { friends, incoming, outgoing, status, reload, respond, remove, block } = useFriends();
  // The person whose row is waiting on the server, so its buttons hold still.
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const run = async (person: Person, action: () => Promise<void>) => {
    setFailure(null);
    setBusy(person.id);
    try {
      await action();
    } catch {
      setFailure(t('friends.updateError'));
    } finally {
      setBusy(null);
    }
  };

  const accept = (person: Person) =>
    run(person, async () => {
      await respond(person, true);
      successFeedback();
    });

  const decline = (person: Person) =>
    run(person, async () => {
      await respond(person, false);
    });

  const openMenu = (person: Person) =>
    openFriendMenu(person, {
      remove,
      block,
      run: (action) => run(person, action),
      onError: () => setFailure(t('friends.updateError')),
    });

  const section = (title: string, people: Connection[], trailing: (person: Connection) => ReactNode) =>
    people.length > 0 ? (
      <View style={styles.section}>
        <SectionHeader title={title} />
        <View style={styles.rows}>
          {people.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              trailing={trailing(person)}
              onPress={person.relation === 'friend' ? () => openFriend(person.id) : undefined}
            />
          ))}
        </View>
      </View>
    ) : null;

  const openFriend = (id: string) => router.push({ pathname: '/friends/[id]', params: { id } });

  const nobody = friends.length + incoming.length + outgoing.length === 0;

  return (
    <Screen scroll edges={['top', 'bottom']} onRefresh={reload}>
      <PageHeader
        padded={false}
        title={t('friends.title')}
        trailing={<IconButton icon="addFriend" label={t('friends.add')} onPress={() => router.push('/friends/add')} />}
      />

      {profile.username ? (
        <View style={styles.invite}>
          <Button
            variant="secondary"
            label={t('friends.invite.action')}
            onPress={() => shareInvite(profile.username!).catch(() => {})}
          />
        </View>
      ) : (
        <Card style={styles.prompt}>
          <Text variant="heading">{t('friends.needsUsername.title')}</Text>
          <Text color="textSecondary">{t('friends.needsUsername.body')}</Text>
          <Button
            label={t('friends.needsUsername.action')}
            onPress={() => router.push('/settings/username')}
            style={styles.promptButton}
          />
        </Card>
      )}

      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite" style={styles.failure}>
          {failure}
        </Text>
      ) : null}

      {nobody ? (
        status === 'loading' ? (
          <LoadingState />
        ) : status === 'error' ? (
          <EmptyState
            title={t('friends.loadError.title')}
            body={t('friends.loadError.body')}
            action={<Button variant="secondary" label={t('common.retry')} onPress={reload} />}
          />
        ) : (
          <EmptyState
            title={t('friends.empty.title')}
            body={t('friends.empty.body')}
            action={<Button label={t('friends.add')} onPress={() => router.push('/friends/add')} />}
          />
        )
      ) : (
        <>
          {section(t('friends.requests'), incoming, (person) => (
            <>
              <RowButton
                label={t('friends.decline')}
                disabled={busy !== null}
                onPress={() => decline(person)}
              />
              <RowButton
                variant="primary"
                label={t('friends.accept')}
                loading={busy === person.id}
                disabled={busy !== null && busy !== person.id}
                onPress={() => accept(person)}
              />
            </>
          ))}
          {section(t('friends.list'), friends, (person) => (
            <IconButton
              icon="more"
              plain
              label={t('friends.more', { name: personName(person) })}
              onPress={() => openMenu(person)}
            />
          ))}
          {section(t('friends.sent'), outgoing, (person) => (
            <RowButton
              label={t('friends.cancel')}
              loading={busy === person.id}
              disabled={busy !== null && busy !== person.id}
              onPress={() => run(person, () => remove(person))}
            />
          ))}
        </>
      )}

      <View style={styles.footer}>
        <ListRow label={t('friends.blocked.title')} onPress={() => router.push('/friends/blocked')} />
      </View>
    </Screen>
  );
}

const styles = themed(() => ({
  invite: {
    marginTop: spacing.lg,
  },
  prompt: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  promptButton: {
    marginTop: spacing.md,
  },
  failure: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xxl,
  },
  // Straight under their heading and split by the rows' own hairlines, like
  // the profile tab's lists, so no empty band of lines opens between groups.
  rows: {},
  footer: {
    marginTop: spacing.xxl,
  },
}));
