import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, LoadingState, PageHeader, Screen, Text } from '@/components/ui';
import { confirm } from '@/features/friends/actions';
import { fetchBlocked, personName, unblockUser, type Person } from '@/features/friends/friendsApi';
import { PersonRow, RowButton } from '@/features/friends/PersonRow';
import { t } from '@/i18n';
import { colors, sizes, spacing, themed } from '@/theme';

export default function BlockedScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPeople(await fetchBlocked());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBlocked().then(
      (loaded) => {
        if (cancelled) return;
        setPeople(loaded);
        setStatus('ready');
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const unblock = (person: Person) =>
    confirm(
      t('friends.blocked.unblockTitle', { name: personName(person) }),
      t('friends.blocked.unblockBody'),
      t('friends.blocked.unblock'),
      async () => {
        setFailure(null);
        setBusy(person.id);
        try {
          await unblockUser(person.id);
          setPeople((current) => current.filter((other) => other.id !== person.id));
        } catch {
          setFailure(t('friends.updateError'));
        } finally {
          setBusy(null);
        }
      },
    );

  return (
    <Screen scroll edges={['top', 'bottom']} onRefresh={load}>
      <PageHeader padded={false} title={t('friends.blocked.title')} />

      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite" style={styles.failure}>
          {failure}
        </Text>
      ) : null}

      {people.length === 0 ? (
        status === 'loading' ? (
          <LoadingState />
        ) : status === 'error' ? (
          <EmptyState
            title={t('friends.loadError.title')}
            body={t('friends.loadError.body')}
            action={<Button variant="secondary" label={t('common.retry')} onPress={load} />}
          />
        ) : (
          <EmptyState title={t('friends.blocked.empty')} />
        )
      ) : (
        <View style={styles.rows}>
          {people.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              trailing={
                <RowButton
                  label={t('friends.blocked.unblock')}
                  loading={busy === person.id}
                  disabled={busy !== null && busy !== person.id}
                  onPress={() => unblock(person)}
                />
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = themed(() => ({
  failure: {
    marginTop: spacing.lg,
  },
  rows: {
    marginTop: spacing.xl,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
}));
