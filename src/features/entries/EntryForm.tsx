import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Icon, KeyboardAvoider, Text, TextField, showAlert } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { currencies } from '@/features/profile/currencies';
import { currencyLabel, t } from '@/i18n';
import { colors, sizes, spacing, themed } from '@/theme';

import { DateField } from './DateField';
import { useEntries } from './EntriesProvider';
import { hiddenCafes, hideCafe } from './hiddenCafes';
import { LogHero } from './LogHero';
import { MoreCoffeesSheet } from './MoreCoffeesSheet';
import { PhotoField } from './PhotoField';
import { cancelUpload, isLocalPhoto, startUpload } from './photoStorage';
import { RatingInput } from './RatingInput';
import {
  coffeeTypes,
  milkTypes,
  parsePrice,
  servingSizes,
  shotCounts,
  takesMilk,
  takesShots,
  takesSize,
  takesTemperature,
  temperatures,
  venues,
  type EntryDraft,
} from './types';

type EntryFormProps = {
  initialValues: EntryDraft;
  submitLabel: string;
  onSubmit: (draft: EntryDraft) => void;
  submitting?: boolean;
  // Shown above the save button when saving failed.
  error?: string | null;
  // Scrolls away with the fields, for screens without a header of their own.
  header?: ReactNode;
  // Opens the form under a tan header with this title, the photo picked
  // there, and the fields on a sheet rising over it.
  heroTitle?: string;
  // On a tab the bar below already clears the bottom of the screen.
  aboveTabBar?: boolean;
  // Told whenever the form starts or stops differing from what it opened
  // with, so the screen can ask before unsaved changes are thrown away.
  onDirtyChange?: (dirty: boolean) => void;
};

const CAFE_SUGGESTIONS = 6;

// Cafés from the journal, most recently visited first, written as they were
// first saved. Coffee at home is said with "Where" instead.
function cafeSuggestions(cafes: (string | null)[], typed: string, hidden: Set<string>): string[] {
  const seen = new Map<string, string>();
  for (const cafe of cafes) {
    const label = cafe?.trim();
    const key = label?.toLowerCase();
    if (label && key && !hidden.has(key) && !seen.has(key)) seen.set(key, label);
  }
  const query = typed.trim().toLowerCase();
  return [...seen.entries()]
    .filter(([key]) => key !== query && key.includes(query))
    .slice(0, CAFE_SUGGESTIONS)
    .map(([, label]) => label);
}

function hasDetails(draft: EntryDraft) {
  return (
    draft.cafe !== '' ||
    draft.rating !== null ||
    draft.price !== '' ||
    draft.notes !== '' ||
    draft.size !== null ||
    draft.shots !== null ||
    draft.temperature !== null ||
    draft.venue !== null
  );
}

// A row of chips where one may be picked, and picking it again clears it.
function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  labelOf,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  labelOf: (option: T) => string;
  onChange: (value: T | null) => void;
}) {
  return (
    <View style={styles.group}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {options.map((option) => (
          <Chip
            key={String(option)}
            label={labelOf(option)}
            selected={value === option}
            onPress={() => onChange(value === option ? null : option)}
          />
        ))}
      </View>
    </View>
  );
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
  heroTitle,
  aboveTabBar = false,
  onDirtyChange,
}: EntryFormProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { entries } = useEntries();
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
  const drink = draft.type === 'other' ? draft.customType || draft.type : draft.type;
  const cafes = useMemo(() => entries.map((entry) => entry.cafe), [entries]);
  const [hidden, setHidden] = useState(hiddenCafes);
  const suggestions = cafeSuggestions(cafes, draft.cafe, hidden);
  const askToHide = (cafe: string) =>
    showAlert(t('entry.cafe.hideTitle', { cafe }), t('entry.cafe.hideBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('entry.cafe.hideConfirm'),
        style: 'destructive',
        onPress: () => {
          hideCafe(cafe);
          setHidden(hiddenCafes());
        },
      },
    ]);
  const priceInvalid = Number.isNaN(parsePrice(draft.price));
  const canSave = name !== '' && !priceInvalid;

  return (
    <KeyboardAvoider>
      <ScrollView
        contentContainerStyle={[
          !heroTitle && styles.content,
          { paddingBottom: aboveTabBar ? spacing.xl : Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        // The tan header runs up behind the status bar.
        contentInsetAdjustmentBehavior={heroTitle ? 'never' : undefined}
      >
        {heroTitle ? (
          <LogHero title={heroTitle} name={name} uri={draft.photoUri} drink={drink} onChange={changePhoto} />
        ) : null}
        <View style={heroTitle ? styles.sheet : styles.fields}>
          {header}
          {heroTitle ? null : <PhotoField uri={draft.photoUri} drink={drink} onChange={changePhoto} />}

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
              {takesSize(draft.type) ? (
                <ChoiceGroup
                  label={t('entry.size.label')}
                  options={servingSizes}
                  value={draft.size}
                  labelOf={(size) => t(`entry.size.${size}`)}
                  onChange={(size) => update({ size })}
                />
              ) : null}
              {takesShots(draft.type) ? (
                <ChoiceGroup
                  label={t('entry.shots.label')}
                  options={shotCounts}
                  value={draft.shots}
                  labelOf={(shots) => String(shots)}
                  onChange={(shots) => update({ shots })}
                />
              ) : null}
              {takesTemperature(draft.type) ? (
                <ChoiceGroup
                  label={t('entry.temperature.label')}
                  options={temperatures}
                  value={draft.temperature}
                  labelOf={(temperature) => t(`entry.temperature.${temperature}`)}
                  onChange={(temperature) => update({ temperature })}
                />
              ) : null}
              <ChoiceGroup
                label={t('entry.venue.label')}
                options={venues}
                value={draft.venue}
                labelOf={(venue) => t(`entry.venue.${venue}`)}
                onChange={(venue) => update({ venue })}
              />
              <TextField
                label={t('entry.cafe.label')}
                placeholder={t('entry.cafe.placeholder')}
                value={draft.cafe}
                onChangeText={(cafe) => update({ cafe })}
                autoCapitalize="words"
                maxLength={80}
              />
              {suggestions.length > 0 ? (
                <View style={styles.suggestions}>
                  <View style={styles.chips}>
                    {suggestions.map((cafe) => (
                      <Chip
                        key={cafe}
                        label={cafe}
                        selected={false}
                        onPress={() => update({ cafe })}
                        onLongPress={() => askToHide(cafe)}
                        accessibilityHint={t('entry.cafe.hideHint')}
                      />
                    ))}
                  </View>
                  <Text variant="caption" color="textMuted">
                    {t('entry.cafe.suggestionHint')}
                  </Text>
                </View>
              ) : null}
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
                suffix={currencyLabel(draft.currency)}
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
                      label={currencyLabel(code)}
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
            {name === '' ? (
              <Text variant="small" color="textSecondary" align="center">
                {t('entry.saveHint')}
              </Text>
            ) : null}
            <Button
              label={submitLabel}
              disabled={!canSave}
              loading={submitting}
              onPress={() => onSubmit({ ...draft, name })}
            />
          </View>
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

const styles = themed(() => ({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  fields: {
    gap: spacing.xl,
  },
  // Carries on from the top of the sheet drawn by the header.
  sheet: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.sheet,
  },
  group: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestions: {
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
    gap: spacing.sm,
  },
}));
