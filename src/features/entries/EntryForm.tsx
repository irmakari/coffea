import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Icon, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { colors, sizes, spacing } from '@/theme';

import { DateField } from './DateField';
import { PhotoField } from './PhotoField';
import { RatingInput } from './RatingInput';
import { coffeeTypes, parsePrice, type EntryDraft } from './types';

type EntryFormProps = {
  initialValues: EntryDraft;
  submitLabel: string;
  onSubmit: (draft: EntryDraft) => void;
  submitting?: boolean;
  // Shown above the save button when saving failed.
  error?: string | null;
};

function hasDetails(draft: EntryDraft) {
  return draft.cafe !== '' || draft.rating !== null || draft.price !== '' || draft.notes !== '';
}

export function EntryForm({
  initialValues,
  submitLabel,
  onSubmit,
  submitting = false,
  error,
}: EntryFormProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialValues);
  const [detailsOpen, setDetailsOpen] = useState(() => hasDetails(initialValues));

  const update = (changes: Partial<EntryDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const priceInvalid = Number.isNaN(parsePrice(draft.price));
  const canSave = draft.name.trim() !== '' && !priceInvalid;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <PhotoField uri={draft.photoUri} drink={draft.type} onChange={(photoUri) => update({ photoUri })} />

        <TextField
          label={t('entry.name.label')}
          placeholder={t('entry.name.placeholder')}
          value={draft.name}
          onChangeText={(name) => update({ name })}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={80}
        />

        <View style={styles.group}>
          <Text variant="label" color="textSecondary">
            {t('entry.type.label')}
          </Text>
          <View style={styles.chips}>
            {coffeeTypes.map((type) => (
              <Chip
                key={type}
                label={t(`coffeeTypes.${type}`)}
                selected={draft.type === type}
                onPress={() => update({ type: draft.type === type ? null : type })}
              />
            ))}
          </View>
        </View>

        {draft.type === 'other' ? (
          <TextField
            label={t('entry.type.customLabel')}
            placeholder={t('entry.type.customPlaceholder')}
            value={draft.customType}
            onChangeText={(customType) => update({ customType })}
            maxLength={40}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: detailsOpen }}
          onPress={() => setDetailsOpen((open) => !open)}
          style={({ pressed }) => [styles.disclosure, pressed && styles.disclosurePressed]}
        >
          <Text variant="bodyStrong">{t(detailsOpen ? 'entry.details.hide' : 'entry.details.show')}</Text>
          <Icon name={detailsOpen ? 'minus' : 'plus'} size={20} color="textSecondary" />
        </Pressable>

        {detailsOpen ? (
          <>
            <TextField
              label={t('entry.cafe.label')}
              placeholder={t('entry.cafe.placeholder')}
              value={draft.cafe}
              onChangeText={(cafe) => update({ cafe })}
              autoCapitalize="words"
              maxLength={80}
            />
            <View style={styles.group}>
              <Text variant="label" color="textSecondary">
                {t('entry.rating.label')}
              </Text>
              <RatingInput value={draft.rating} onChange={(rating) => update({ rating })} />
            </View>
            <TextField
              label={t('entry.price.label')}
              placeholder={t('entry.price.placeholder')}
              value={draft.price}
              onChangeText={(price) => update({ price })}
              error={priceInvalid ? t('entry.price.invalid') : undefined}
              suffix={draft.currency}
              keyboardType="decimal-pad"
              maxLength={10}
            />
            <DateField
              label={t('entry.date.label')}
              value={draft.consumedAt ? new Date(draft.consumedAt) : new Date()}
              onChange={(date) => update({ consumedAt: date.toISOString() })}
            />
            <TextField
              label={t('entry.notes.label')}
              placeholder={t('entry.notes.placeholder')}
              value={draft.notes}
              onChangeText={(notes) => update({ notes })}
              multiline
              maxLength={1000}
            />
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {error ? (
          <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <Button
          label={submitLabel}
          disabled={!canSave}
          loading={submitting}
          onPress={() => onSubmit({ ...draft, name: draft.name.trim() })}
        />
      </View>
    </KeyboardAvoidingView>
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
  group: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  disclosure: {
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: sizes.hairline,
    borderBottomWidth: sizes.hairline,
    borderColor: colors.border,
  },
  disclosurePressed: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
});
