import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryForm } from '@/features/entries/EntryForm';
import { emptyDraft, isCoffeeType, type EntryDraft } from '@/features/entries/types';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { spacing } from '@/theme';

// A form that already knows what is being drunk, named after it so that it
// can be saved as it stands.
function draftOf(drink: string, currency: string): EntryDraft {
  const draft = emptyDraft(currency);
  return isCoffeeType(drink)
    ? { ...draft, name: t(`coffeeTypes.${drink}`), type: drink }
    : { ...draft, name: drink, type: 'other', customType: drink };
}

export default function LogCoffeeScreen() {
  const { add } = useEntries();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A tab stays mounted, so the form is swapped for an empty one after each
  // save. Leaving the tab halfway keeps what was typed.
  const [formKey, setFormKey] = useState(0);

  // Set by the tab bar when a coffee is picked from its long-press menu. `at`
  // changes with every pick; once that pick has been saved it is spent, and
  // the form after it starts empty.
  const { drink, at } = useLocalSearchParams<{ drink?: string; at?: string }>();
  const [spent, setSpent] = useState<string | null>(null);
  const startWith = drink && at && at !== spent ? drink : null;

  const save = async (draft: EntryDraft) => {
    setError(null);
    setSubmitting(true);
    try {
      await add(draft);
      setSpent(at ?? null);
      setFormKey((key) => key + 1);
      // The new coffee is waiting at the top of the home tab.
      router.navigate('/');
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
        initialValues={
          startWith ? draftOf(startWith, profile.preferredCurrency) : emptyDraft(profile.preferredCurrency)
        }
        submitLabel={t('entry.save')}
        onSubmit={save}
        submitting={submitting}
        error={error}
        aboveTabBar
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
