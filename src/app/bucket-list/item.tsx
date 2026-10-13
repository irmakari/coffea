import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, ModalHeader, Screen, Text, TextField } from '@/components/ui';
import { emptyBucketDraft, type BucketDraft } from '@/features/bucketList/bucketListApi';
import { useBucketList } from '@/features/bucketList/BucketListProvider';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

// One screen for both adding (no `id`) and editing a bucket-list item.
export default function BucketItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { items, add, update, remove } = useBucketList();
  const existing = id ? items.find((item) => item.id === id) : undefined;

  const [draft, setDraft] = useState<BucketDraft>(
    existing
      ? { name: existing.name, cafe: existing.cafe ?? '', notes: existing.notes ?? '' }
      : emptyBucketDraft,
  );
  const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (id && !existing) {
    return (
      <Screen padded={false} edges={['top']}>
        <ModalHeader title={t('bucketList.form.editTitle')} />
        <EmptyState title={t('bucketList.form.notFound')} />
      </Screen>
    );
  }

  const change = (changes: Partial<BucketDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const save = async () => {
    setError(null);
    setBusy('saving');
    try {
      await (id ? update(id, draft) : add(draft));
      router.back();
    } catch {
      setError(t('bucketList.form.saveError'));
      setBusy(null);
    }
  };

  const removeItem = async () => {
    if (!id) return;
    setError(null);
    setBusy('deleting');
    try {
      await remove(id);
      router.back();
    } catch {
      setError(t('bucketList.form.deleteError'));
      setBusy(null);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t(id ? 'bucketList.form.editTitle' : 'bucketList.form.newTitle')} />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label={t('bucketList.form.name.label')}
            placeholder={t('bucketList.form.name.placeholder')}
            value={draft.name}
            onChangeText={(name) => change({ name })}
            autoCapitalize="words"
            autoFocus={!id}
            maxLength={80}
          />
          <TextField
            label={t('bucketList.form.cafe.label')}
            placeholder={t('bucketList.form.cafe.placeholder')}
            value={draft.cafe}
            onChangeText={(cafe) => change({ cafe })}
            autoCapitalize="words"
            maxLength={80}
          />
          <TextField
            label={t('bucketList.form.notes.label')}
            placeholder={t('bucketList.form.notes.placeholder')}
            value={draft.notes}
            onChangeText={(notes) => change({ notes })}
            multiline
            maxLength={1000}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {error ? (
            <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            label={t(id ? 'bucketList.form.saveChanges' : 'bucketList.form.save')}
            disabled={draft.name.trim() === '' || busy === 'deleting'}
            loading={busy === 'saving'}
            onPress={save}
          />
          {id ? (
            <Button
              variant="quiet"
              label={t('bucketList.form.delete')}
              disabled={busy === 'saving'}
              loading={busy === 'deleting'}
              onPress={() =>
                Alert.alert(t('bucketList.form.deleteTitle'), undefined, [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('bucketList.form.deleteConfirm'), style: 'destructive', onPress: removeItem },
                ])
              }
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
});
