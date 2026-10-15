import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryForm } from '@/features/entries/EntryForm';
import { isLogDraftDirty, setLogDraftDirty } from '@/features/entries/logDraft';
import { askForReviewAfterSaving } from '@/features/entries/reviewPrompt';
import { useFriends } from '@/features/friends/FriendsProvider';
import { emptyDraft, isCoffeeType, type EntryDraft } from '@/features/entries/types';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import { spacing } from '@/theme';

// A form that already knows what is being drunk, named after it so that it
// can be saved as it stands.
function draftOf(drink: string, currency: string, isShared: boolean): EntryDraft {
  const draft = emptyDraft(currency, isShared);
  return isCoffeeType(drink)
    ? { ...draft, name: t(`coffeeTypes.${drink}`), type: drink }
    : { ...draft, name: drink, type: 'other', customType: drink };
}

// The same form, dated to a day picked in the diary. It keeps the time of
// day it is now, and never lands in the future.
function onDay(draft: EntryDraft, day: string): EntryDraft {
  const date = new Date(Number(day));
  if (Number.isNaN(date.getTime())) return draft;
  const now = new Date();
  date.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return { ...draft, consumedAt: (date > now ? now : date).toISOString() };
}

export default function LogCoffeeScreen() {
  const { add, entries } = useEntries();
  const { profile, setShareByDefault } = useProfile();
  const { friends } = useFriends();
  const canShare = friends.length > 0;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A tab stays mounted, so the form is swapped for an empty one after each
  // save. Leaving the tab halfway keeps what was typed.
  const [formKey, setFormKey] = useState(0);

  // Set when a coffee is picked from the tab bar's long-press menu, a day
  // from the diary, or a coffee ticked off the bucket list. `at` changes with
  // every such start; once that start has been saved it is spent, and the
  // form after it starts empty.
  const { drink, day, name, cafe, at } = useLocalSearchParams<{
    drink?: string;
    day?: string;
    name?: string;
    cafe?: string;
    at?: string;
  }>();
  const [spent, setSpent] = useState<string | null>(null);
  const started = !!at && at !== spent;

  // A start that was walked away from untouched is spent too. Otherwise the
  // next coffee logged here would quietly carry its day.
  useFocusEffect(
    useCallback(
      () => () => {
        if (!at || isLogDraftDirty()) return;
        setSpent(at);
        setFormKey((key) => key + 1);
      },
      [at],
    ),
  );

  let initialValues = emptyDraft(profile.preferredCurrency, profile.shareByDefault);
  if (started && drink) initialValues = draftOf(drink, profile.preferredCurrency, profile.shareByDefault);
  if (started && day) initialValues = onDay(initialValues, day);
  if (started && name) initialValues = { ...initialValues, name, cafe: cafe ?? '' };

  const save = async (draft: EntryDraft) => {
    setError(null);
    setSubmitting(true);
    try {
      // With no friends yet, nothing is shared, so friends added later do
      // not find old coffees in their feed.
      const created = await add({ ...draft, isShared: canShare && draft.isShared });
      successFeedback();
      // The next coffee starts the way this one was saved.
      if (canShare && draft.isShared !== profile.shareByDefault) {
        setShareByDefault(draft.isShared).catch(() => {});
      }
      setSpent(at ?? null);
      setFormKey((key) => key + 1);
      // The saved coffee is shown as it now stands in the journal, which a
      // backdated one would not be at the top of the home tab. Home goes
      // underneath, so that is where the way back leads.
      router.navigate('/');
      router.push({ pathname: '/entry/[id]', params: { id: created.id } });
      // The coffee just saved is not in `entries` yet, hence the one added.
      askForReviewAfterSaving(entries.length + 1);
    } catch {
      setError(t('entry.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <EntryForm
        key={`${formKey}:${at ?? ''}`}
        header={
          <View style={styles.header}>
            <ScreenHeader title={t('entry.newTitle')} />
          </View>
        }
        initialValues={initialValues}
        submitLabel={t('entry.save')}
        onSubmit={save}
        submitting={submitting}
        error={error}
        aboveTabBar
        onDirtyChange={setLogDraftDirty}
        canShare={canShare}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Lines the title up with the other tabs, whose screens pad the top.
  header: {
    paddingTop: spacing.sm,
  },
});
