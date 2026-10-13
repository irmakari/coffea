import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState, ModalHeader, Screen } from '@/components/ui';
import { useEntries, useEntry } from '@/features/entries/EntriesProvider';
import { EntryForm } from '@/features/entries/EntryForm';
import { draftFromEntry, type EntryDraft } from '@/features/entries/types';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';

export default function EditCoffeeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntry(id);
  const { update } = useEntries();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (draft: EntryDraft) => {
    if (!entry) return;
    setError(null);
    setSubmitting(true);
    try {
      await update(entry, draft);
      router.back();
    } catch {
      setError(t('entry.saveError'));
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t('entry.editTitle')} />
      {entry ? (
        <EntryForm
          initialValues={draftFromEntry(entry, profile.preferredCurrency)}
          submitLabel={t('entry.saveChanges')}
          onSubmit={save}
          submitting={submitting}
          error={error}
        />
      ) : (
        <EmptyState title={t('entry.notFound')} />
      )}
    </Screen>
  );
}
