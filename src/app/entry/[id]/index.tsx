import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, CoffeePhoto, EmptyState, Icon, IconButton, Screen, Text } from '@/components/ui';
import { typeAndCafe } from '@/features/entries/display';
import { useEntries, useEntry } from '@/features/entries/EntriesProvider';
import { MAX_RATING } from '@/features/entries/types';
import { formatCurrency, formatDate, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntry(id);
  const { remove, toggleFavorite } = useEntries();
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!entry) {
    return (
      <Screen>
        <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
        <EmptyState title={t('entry.notFound')} />
      </Screen>
    );
  }

  const subtitle = typeAndCafe(entry);

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
        <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
        <View style={styles.headerActions}>
          <IconButton
            icon="share"
            label={t('share.open')}
            onPress={() => router.push({ pathname: '/entry/[id]/share', params: { id: entry.id } })}
          />
          <IconButton
            icon="heart"
            filled={entry.isFavorite}
            label={t(entry.isFavorite ? 'entry.favorite.remove' : 'entry.favorite.add')}
            // The provider puts the heart back if the save fails.
            onPress={() => toggleFavorite(entry).catch(() => {})}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/entry/[id]/edit', params: { id: entry.id } })}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.edit, pressed && styles.editPressed]}
          >
            <Text variant="label">{t('entry.edit')}</Text>
          </Pressable>
        </View>
      </View>

      {entry.photoUrl || entry.type ? (
        <CoffeePhoto
          uri={entry.photoUrl}
          cacheKey={entry.photoPath}
          drink={entry.type}
          accessibilityLabel={entry.name}
          style={styles.photo}
        />
      ) : null}

      <View style={styles.heading}>
        <Text variant="eyebrow" color="textMuted">
          {formatDate(entry.consumedAt, 'day')} · {formatDate(entry.consumedAt, 'time')}
        </Text>
        <Text variant="display" accessibilityRole="header">
          {entry.name}
        </Text>
        {subtitle ? <Text color="textSecondary">{subtitle}</Text> : null}
        {entry.price !== null && entry.currency ? (
          <Text variant="label" color="textSecondary">
            {formatCurrency(entry.price, entry.currency)}
          </Text>
        ) : null}
      </View>

      {entry.rating ? (
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
      ) : null}

      {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}

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
    gap: spacing.sm,
  },
  editPressed: {
    backgroundColor: colors.surfacePressed,
  },
  edit: {
    height: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    marginTop: spacing.xl,
  },
  heading: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  notes: {
    marginTop: spacing.xl,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.xxxl,
  },
});
