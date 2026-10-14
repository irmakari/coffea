import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  BackButton,
  Button,
  Card,
  CoffeePhoto,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { typeLabel } from '@/features/entries/display';
import { useEntries, useEntry } from '@/features/entries/EntriesProvider';
import { isMilkType, MAX_RATING } from '@/features/entries/types';
import { formatCurrency, formatDate, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

// One labelled detail of the coffee. Two sit side by side; an odd one out
// takes the whole row.
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card style={styles.fact}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      {children}
    </Card>
  );
}

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntry(id);
  const { status, remove, toggleFavorite } = useEntries();
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!entry) {
    return (
      <Screen>
        <BackButton />
        {status === 'loading' ? <LoadingState /> : <EmptyState title={t('entry.notFound')} />}
      </Screen>
    );
  }

  const type = typeLabel(entry);
  const price = entry.price !== null && entry.currency ? formatCurrency(entry.price, entry.currency) : null;
  const milk = isMilkType(entry.milk) ? t(`milkTypes.${entry.milk}`) : entry.milk;
  const hasFacts = !!type || !!milk || !!entry.cafe || !!entry.rating || !!price;
  const incomplete = !type || !entry.cafe || !entry.rating || !price || !entry.notes;

  const edit = () => router.push({ pathname: '/entry/[id]/edit', params: { id: entry.id } });

  const confirmDelete = () => {
    Alert.alert(t('entry.delete.title'), t('entry.delete.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('entry.delete.confirm'),
        style: 'destructive',
        onPress: async () => {
          setFailure(null);
          setDeleting(true);
          try {
            await remove(entry);
            router.back();
          } catch {
            setFailure(t('entry.delete.error'));
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerActions}>
          <IconButton
            plain
            icon="share"
            label={t('share.open')}
            onPress={() => router.push({ pathname: '/entry/[id]/share', params: { id: entry.id } })}
          />
          <IconButton
            plain
            icon="heart"
            filled={entry.isFavorite}
            label={t(entry.isFavorite ? 'entry.favorite.remove' : 'entry.favorite.add')}
            // The provider puts the heart back if the save fails.
            onPress={() => toggleFavorite(entry).catch(() => {})}
          />
          <Pressable
            accessibilityRole="button"
            onPress={edit}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.edit, pressed && styles.editPressed]}
          >
            <Text variant="bodyStrong">{t('entry.edit')}</Text>
          </Pressable>
        </View>
      </View>

      {entry.photoUrl || entry.type ? (
        <CoffeePhoto
          uri={entry.photoUrl}
          cacheKey={entry.photoPath}
          drink={entry.type}
          // A drawing needs less room than a photograph, and the details
          // below should not be pushed off the first screen.
          ratio={entry.photoUrl ? 'square' : 'landscape'}
          accessibilityLabel={entry.name}
          style={styles.photo}
        />
      ) : null}

      <View style={styles.heading}>
        <Text variant="display" accessibilityRole="header">
          {entry.name}
        </Text>
        <Text color="textSecondary">
          {formatDate(entry.consumedAt, 'day')} · {formatDate(entry.consumedAt, 'time')}
        </Text>
      </View>

      {hasFacts ? (
        <View style={styles.facts}>
          {type ? (
            <Fact label={t('entry.type.label')}>
              <Text variant="subheading" numberOfLines={2}>
                {type}
              </Text>
            </Fact>
          ) : null}
          {milk ? (
            <Fact label={t('entry.milk.label')}>
              <Text variant="subheading" numberOfLines={1}>
                {milk}
              </Text>
            </Fact>
          ) : null}
          {entry.cafe ? (
            <Fact label={t('entry.cafe.label')}>
              <Text variant="subheading" numberOfLines={2}>
                {entry.cafe}
              </Text>
            </Fact>
          ) : null}
          {entry.rating ? (
            <Fact label={t('entry.rating.label')}>
              <View style={styles.rating} accessibilityLabel={t('entry.rating.value', { count: entry.rating })}>
                {Array.from({ length: MAX_RATING }, (_, index) => {
                  const active = index < (entry.rating ?? 0);
                  return (
                    <Icon
                      key={index}
                      name="star"
                      size={18}
                      filled={active}
                      strokeWidth={1.25}
                      color={active ? 'text' : 'placeholder'}
                    />
                  );
                })}
              </View>
            </Fact>
          ) : null}
          {price ? (
            <Fact label={t('entry.price.label')}>
              <Text variant="subheading" numberOfLines={1}>
                {price}
              </Text>
            </Fact>
          ) : null}
        </View>
      ) : null}

      {entry.notes ? (
        <Card style={styles.notes}>
          <Text variant="label" color="textSecondary">
            {t('entry.notes.label')}
          </Text>
          <Text>{entry.notes}</Text>
        </Card>
      ) : null}

      {incomplete ? (
        <Pressable
          accessibilityRole="button"
          onPress={edit}
          style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
        >
          <Text variant="bodyStrong">{t('entry.details.add')}</Text>
          <Icon name="plus" size={20} color="textSecondary" />
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        {failure ? (
          <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
            {failure}
          </Text>
        ) : null}
        <Button variant="quiet" label={t('entry.delete.action')} loading={deleting} onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editPressed: {
    opacity: 0.5,
  },
  // The word ends on the page's edge, in line with the photo below.
  edit: {
    height: sizes.chip,
    paddingLeft: spacing.sm,
    justifyContent: 'center',
  },
  photo: {
    marginTop: spacing.xl,
  },
  heading: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  fact: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
  },
  // As tall as a line of the text values beside it.
  rating: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notes: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  more: {
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl - 4,
    borderRadius: radii.frame,
    borderWidth: sizes.hairline,
    borderColor: colors.borderStrong,
  },
  morePressed: {
    backgroundColor: colors.surfacePressed,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.xxxl,
  },
});
