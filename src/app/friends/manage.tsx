import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { confirm, showActions } from '@/features/friends/actions';
import { personName, type Connection, type Person } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { shareInvite } from '@/features/friends/invite';
import { PersonRow, RowButton } from '@/features/friends/PersonRow';
import { askToReport } from '@/features/friends/report';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import { colors, sizes, spacing } from '@/theme';

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

  const askToBlock = (person: Person) =>
    confirm(
      t('friends.block.title', { name: personName(person) }),
      t('friends.block.body'),
      t('friends.block.confirm'),
      () => run(person, () => block(person)),
    );

  const openMenu = (person: Person) =>
    showActions(personName(person), [
      {
        label: t('friends.menu.remove'),
        onPress: () =>
          confirm(t('friends.remove.title', { name: personName(person) }), undefined, t('friends.remove.confirm'), () =>
            run(person, () => remove(person)),
          ),
      },
      {
        label: t('report.person'),
        onPress: () =>
          askToReport({
            person: { id: person.id, name: personName(person) },
            onBlock: () => run(person, () => block(person)),
            onError: () => setFailure(t('friends.updateError')),
          }),
      },
      { label: t('friends.menu.block'), destructive: true, onPress: () => askToBlock(person) },
    ]);

  const section = (title: string, people: Connection[], trailing: (person: Connection) => ReactNode) =>
    people.length > 0 ? (
      <View style={styles.section}>
        <SectionHeader title={title} />
        <View style={styles.rows}>
          {people.map((person) => (
            <PersonRow key={person.id} person={person} trailing={trailing(person)} />
          ))}
        </View>
      </View>
    ) : null;

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

const styles = StyleSheet.create({
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
  rows: {
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  footer: {
    marginTop: spacing.xxxl,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
});
