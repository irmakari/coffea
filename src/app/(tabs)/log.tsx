import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryForm } from '@/features/entries/EntryForm';
import { isLogDraftDirty, setLogDraftDirty } from '@/features/entries/logDraft';
import { emptyDraft, isCoffeeType, type EntryDraft } from '@/features/entries/types';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import { spacing } from '@/theme';

// A form that already knows what is being drunk, named after it so that it
// can be saved as it stands.
function draftOf(drink: string, currency: string): EntryDraft {
  const draft = emptyDraft(currency);
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
  const { add } = useEntries();
  const { profile } = useProfile();
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

  let initialValues = emptyDraft(profile.preferredCurrency);
  if (started && drink) initialValues = draftOf(drink, profile.preferredCurrency);
  if (started && day) initialValues = onDay(initialValues, day);
  if (started && name) initialValues = { ...initialValues, name, cafe: cafe ?? '' };

  const save = async (draft: EntryDraft) => {
    setError(null);
    setSubmitting(true);
    try {
      const created = await add(draft);
      successFeedback();
      setSpent(at ?? null);
      setFormKey((key) => key + 1);
      // The saved coffee is shown as it now stands in the journal, which a
      // backdated one would not be at the top of the home tab. Home goes
      // underneath, so that is where the way back leads.
      router.navigate('/');
      router.push({ pathname: '/entry/[id]', params: { id: created.id } });
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
