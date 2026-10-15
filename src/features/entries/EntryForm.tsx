import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Icon, KeyboardAvoider, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { currencies } from '@/features/profile/currencies';
import { t } from '@/i18n';
import { colors, sizes, spacing } from '@/theme';

import { DateField } from './DateField';
import { MoreCoffeesSheet } from './MoreCoffeesSheet';
import { PhotoField } from './PhotoField';
import { cancelUpload, isLocalPhoto, startUpload } from './photoStorage';
import { RatingInput } from './RatingInput';
import { coffeeTypes, milkTypes, parsePrice, takesMilk, type EntryDraft } from './types';

type EntryFormProps = {
  initialValues: EntryDraft;
  submitLabel: string;
  onSubmit: (draft: EntryDraft) => void;
  submitting?: boolean;
  // Shown above the save button when saving failed.
  error?: string | null;
  // Scrolls away with the fields, for screens without a header of their own.
  header?: ReactNode;
  // On a tab the bar below already clears the bottom of the screen.
  aboveTabBar?: boolean;
  // Told whenever the form starts or stops differing from what it opened
  // with, so the screen can ask before unsaved changes are thrown away.
  onDirtyChange?: (dirty: boolean) => void;
  // Lets the coffee be shared. Someone with nobody to share with sees the
  // switch turned off, and the way to add a friend.
  canShare?: boolean;
};

function hasDetails(draft: EntryDraft) {
  return draft.cafe !== '' || draft.rating !== null || draft.price !== '' || draft.notes !== '';
}

function differs(draft: EntryDraft, initial: EntryDraft) {
  return (Object.keys(initial) as (keyof EntryDraft)[]).some((key) => draft[key] !== initial[key]);
}

export function EntryForm({
  initialValues,
  submitLabel,
  onSubmit,
  submitting = false,
  error,
  header,
  aboveTabBar = false,
  onDirtyChange,
  canShare = false,
}: EntryFormProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  // What the form opened with. A saved photo's link is renewed whenever the
  // journal reloads, so later values would look like a change that is not one.
  const [initial] = useState(initialValues);
  const [draft, setDraft] = useState(initial);
  const [detailsOpen, setDetailsOpen] = useState(() => hasDetails(initialValues));
  const [moreOpen, setMoreOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const update = (changes: Partial<EntryDraft>) => setDraft((current) => ({ ...current, ...changes }));

  // A picked photo starts uploading at once, while the rest is filled in.
  // One that is swapped out, removed or left unsaved is taken back down.
  const photo = useRef(initialValues.photoUri);
  const changePhoto = (photoUri: string | null) => {
    if (photo.current) cancelUpload(photo.current);
    if (userId && isLocalPhoto(photoUri)) startUpload(userId, photoUri);
    photo.current = photoUri;
    update({ photoUri });
  };
  useEffect(
    () => () => {
      if (photo.current) cancelUpload(photo.current);
    },
    [],
  );
  const dirty = differs(draft, initial);
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  // A coffee with a type and no name of its own goes by its type.
  const typeName =
    draft.type === 'other' ? draft.customType : draft.type ? t(`coffeeTypes.${draft.type}`) : '';
  const name = draft.name.trim() || typeName;
  const priceInvalid = Number.isNaN(parsePrice(draft.price));
  const canSave = name !== '' && !priceInvalid;

  return (
    <KeyboardAvoider>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: aboveTabBar ? spacing.xl : Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {header}
        <PhotoField
          uri={draft.photoUri}
          drink={draft.type === 'other' ? draft.customType || draft.type : draft.type}
          onChange={changePhoto}
        />

        <TextField
          label={t('entry.name.label')}
          placeholder={typeName || t('entry.name.placeholder')}
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
            {coffeeTypes.map((type) =>
              type === 'other' ? (
                // Opens the longer list, and afterwards carries what was picked.
                <Chip
                  key={type}
                  label={(draft.type === 'other' && draft.customType) || t('coffeeTypes.other')}
                  selected={draft.type === 'other'}
                  onPress={() => setMoreOpen(true)}
                />
              ) : (
                <Chip
                  key={type}
                  label={t(`coffeeTypes.${type}`)}
                  selected={draft.type === type}
                  onPress={() => update({ type: draft.type === type ? null : type })}
                />
              ),
            )}
          </View>
        </View>

        {takesMilk(draft.type) ? (
          <View style={styles.group}>
            <Text variant="label" color="textSecondary">
              {t('entry.milk.label')}
            </Text>
            <View style={styles.chips}>
              {milkTypes.map((milk) => (
                <Chip
                  key={milk}
                  label={t(`milkTypes.${milk}`)}
                  selected={draft.milk === milk}
                  onPress={() => update({ milk: draft.milk === milk ? null : milk })}
                />
              ))}
            </View>
          </View>
        ) : null}

        <DateField
          label={t('entry.date.label')}
          value={draft.consumedAt ? new Date(draft.consumedAt) : new Date()}
          onChange={(date) => update({ consumedAt: date.toISOString() })}
        />

        <View style={styles.share}>
          <View style={styles.shareText}>
            <Text variant="bodyStrong" color={canShare ? 'text' : 'textMuted'}>
              {t('entry.share.label')}
            </Text>
            {canShare ? (
              <Text variant="small" color="textSecondary">
                {t('entry.share.hint')}
              </Text>
            ) : (
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/friends/add')}
                hitSlop={spacing.sm}
                style={({ pressed }) => pressed && styles.disclosurePressed}
              >
                <Text variant="small" color="textSecondary">
                  {t('entry.share.noFriends')} <Text variant="small" style={styles.link}>{t('entry.share.addFriends')}</Text>
                </Text>
              </Pressable>
            )}
          </View>
          <Switch
            accessibilityLabel={t('entry.share.label')}
            accessibilityHint={canShare ? undefined : t('entry.share.noFriends')}
            disabled={!canShare}
            value={canShare && draft.isShared}
            onValueChange={(isShared) => update({ isShared })}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

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
              suffixLabel={`${t('entry.price.currency')}, ${draft.currency}`}
              onSuffixPress={() => setCurrencyOpen((open) => !open)}
              keyboardType="decimal-pad"
              maxLength={10}
            />
            {/* For the one coffee paid for in another currency, as on a trip. */}
            {currencyOpen ? (
              <View style={styles.chips} accessibilityRole="radiogroup">
                {currencies.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    selected={draft.currency === code}
                    onPress={() => {
                      update({ currency: code });
                      setCurrencyOpen(false);
                    }}
                  />
                ))}
              </View>
            ) : null}
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

        {/* The last thing on the page, after the details, rather than pinned over it. */}
        <View style={styles.footer}>
          {error ? (
            <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            label={submitLabel}
            disabled={!canSave}
            loading={submitting}
            onPress={() => onSubmit({ ...draft, name })}
          />
        </View>
      </ScrollView>

      <MoreCoffeesSheet
        visible={moreOpen}
        value={draft.type === 'other' ? draft.customType : ''}
        onDone={(customType) => {
          if (customType) {
            update({ type: 'other', customType });
          } else if (draft.type === 'other') {
            // Left empty, the sheet takes back the coffee it had given.
            update({ type: null, customType: '' });
          }
          setMoreOpen(false);
        }}
      />

    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
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
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  shareText: {
    flex: 1,
    gap: 2,
  },
  link: {
    textDecorationLine: 'underline',
  },
  disclosurePressed: {
    opacity: 0.6,
  },
  footer: {
    gap: spacing.sm,
  },
});
