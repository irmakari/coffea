import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, Button, Icon, Text } from '@/components/ui';
import { searchPeople, type Person, type Relation } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { shareInvite } from '@/features/friends/invite';
import { PersonRow, RowButton } from '@/features/friends/PersonRow';
import { normalizeUsername } from '@/features/friends/username';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import { colors, contentColumn, radii, sizes, spacing, themed, typography } from '@/theme';

// Long enough that a search is not sent for every letter typed.
const SEARCH_DELAY_MS = 300;
const MIN_QUERY = 2;

export default function AddFriendsScreen() {
  const { profile } = useProfile();
  const { request, respond } = useFriends();
  const [query, setQuery] = useState('');
  // Each answer remembers its query, so one that arrives late for an older
  // query is never shown under a newer one.
  const [answer, setAnswer] = useState<{ query: string; people: Person[] | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const needle = normalizeUsername(query);
  const searching = needle.length >= MIN_QUERY;
  const current = answer?.query === needle ? answer : null;
  const results = current?.people ?? null;
  const searchFailed = current !== null && current.people === null;

  useEffect(() => {
    if (needle.length < MIN_QUERY) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPeople(needle).then(
        (people) => {
          if (!cancelled) setAnswer({ query: needle, people });
        },
        () => {
          if (!cancelled) setAnswer({ query: needle, people: null });
        },
      );
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needle]);

  const mark = (person: Person, relation: Relation) =>
    setAnswer((last) =>
      last?.people
        ? { ...last, people: last.people.map((other) => (other.id === person.id ? { ...other, relation } : other)) }
        : last,
    );

  const add = async (person: Person) => {
    setFailure(null);
    setBusy(person.id);
    try {
      mark(person, person.relation === 'incoming' ? await respond(person, true) : await request(person));
      successFeedback();
    } catch {
      setFailure(t('friends.updateError'));
    } finally {
      setBusy(null);
    }
  };

  const action = (person: Person) => {
    if (person.relation === 'friend') {
      return (
        <Text variant="label" color="textSecondary">
          {t('friends.isFriend')}
        </Text>
      );
    }
    if (person.relation === 'outgoing') {
      return (
        <Text variant="label" color="textSecondary">
          {t('friends.requested')}
        </Text>
      );
    }
    return (
      <RowButton
        variant="primary"
        label={person.relation === 'incoming' ? t('friends.accept') : t('friends.addOne')}
        loading={busy === person.id}
        disabled={busy !== null && busy !== person.id}
        onPress={() => add(person)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[contentColumn, styles.header]}>
        <BackButton />
        <View style={styles.field}>
          <Icon name="search" size={18} color="textMuted" />
          <TextInput
            accessibilityLabel={t('friends.search.label')}
            placeholder={t('friends.search.placeholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            maxFontSizeMultiplier={1.4}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
          />
          {query !== '' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('friends.search.clear')}
              onPress={() => setQuery('')}
              hitSlop={spacing.md}
            >
              <Icon name="close" size={18} color="textMuted" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[contentColumn, styles.content]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {failure ? (
          <Text variant="small" color="danger" accessibilityLiveRegion="polite" style={styles.failure}>
            {failure}
          </Text>
        ) : null}

        {!searching ? (
          <>
            <Text color="textSecondary">{t('friends.search.hint')}</Text>
            {profile.username ? (
              <Button
                variant="secondary"
                label={t('friends.invite.action')}
                onPress={() => shareInvite(profile.username!).catch(() => {})}
                style={styles.invite}
              />
            ) : null}
          </>
        ) : searchFailed ? (
          <Text color="textSecondary">{t('friends.search.error')}</Text>
        ) : results === null ? null : results.length === 0 ? (
          <Text color="textSecondary">{t('friends.search.none', { query: needle })}</Text>
        ) : (
          <View style={styles.rows}>
            {results.map((person) => (
              <PersonRow key={person.id} person={person} trailing={action(person)} />
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  // The same field as the journal search.
  field: {
    flex: 1,
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  failure: {
    marginBottom: spacing.md,
  },
  invite: {
    marginTop: spacing.xl,
  },
  rows: {
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
}));
