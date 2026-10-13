import { router } from 'expo-router';
import { useState } from 'react';

import { ModalHeader, Screen } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryForm } from '@/features/entries/EntryForm';
import { emptyDraft, type EntryDraft } from '@/features/entries/types';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';

export default function LogCoffeeScreen() {
  const { add } = useEntries();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (draft: EntryDraft) => {
    setError(null);
    setSubmitting(true);
    try {
      await add(draft);
      router.back();
    } catch {
      setError(t('entry.saveError'));
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t('entry.newTitle')} />
      <EntryForm
        initialValues={emptyDraft(profile.preferredCurrency)}
        submitLabel={t('entry.save')}
        onSubmit={save}
        submitting={submitting}
        error={error}
      />
    </Screen>
  );
}
