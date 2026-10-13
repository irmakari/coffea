import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, CoffeePhoto, IconButton, Screen, SectionHeader, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryRow } from '@/features/entries/EntryCard';
import { isCoffeeType } from '@/features/entries/types';
import {
  computeStats,
  entriesInPeriod,
  statsPeriods,
  type StatsPeriod,
  type Tally,
} from '@/features/stats/stats';
import { formatCurrency, formatNumber, t } from '@/i18n';
import { colors, fonts, spacing } from '@/theme';

const SHELF_COUNT = 12;

function times(count: number) {
  return count === 1 ? t('stats.times.one') : t('stats.times.other', { count: formatNumber(count) });
}

function typeName(tally: Tally) {
  return isCoffeeType(tally.label) ? t(`coffeeTypes.${tally.label}`) : tally.label;
}

// One figure with its label, sized to share a card with a second one.
function Figure({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={styles.figure}>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
      <Text style={styles.figureValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      {detail ? (
        <Text variant="caption" color="textMuted">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export default function StatsScreen() {
  const { entries } = useEntries();
  const [period, setPeriod] = useState<StatsPeriod>('month');

  const inPeriod = useMemo(() => entriesInPeriod(entries, period), [entries, period]);
  const stats = useMemo(() => computeStats(inPeriod), [inPeriod]);

  const withPhoto = inPeriod.filter((entry) => entry.photoUrl).slice(0, SHELF_COUNT);
  const favorites = inPeriod.filter((entry) => entry.isFavorite).length;
  const rated = inPeriod.filter((entry) => entry.rating !== null);
  const averageRating =
    rated.length > 0 ? rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / rated.length : null;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
        <Text variant="display" accessibilityRole="header">
          {t('stats.heading')}
        </Text>
      </View>

      <View style={styles.periods} accessibilityRole="radiogroup">
        {statsPeriods.map((option) => (
          <Chip
            key={option}
            label={t(`stats.periods.${option}`)}
            selected={period === option}
            onPress={() => setPeriod(option)}
          />
        ))}
      </View>

      {stats.total === 0 ? (
        <Card style={styles.card}>
          <Text color="textSecondary">{entries.length === 0 ? t('stats.empty.body') : t('stats.periodEmpty')}</Text>
        </Card>
      ) : (
        <>
          {withPhoto.length > 0 ? (
            <Card padded={false} style={styles.card}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelf}
              >
                {withPhoto.map((entry) => (
                  <CoffeePhoto
                    key={entry.id}
                    uri={entry.photoUrl}
                    cacheKey={entry.photoPath}
                    ratio="portrait"
                    style={styles.shelfPhoto}
                  />
                ))}
              </ScrollView>
            </Card>
          ) : null}

          <Card style={styles.card}>
            <View style={styles.pair}>
              <Figure label={t('stats.cups')} value={formatNumber(stats.total)} />
              {averageRating !== null ? (
                <Figure label={t('stats.averageRating')} value={averageRating.toFixed(1)} />
              ) : (
                <Figure label={t('stats.favorites')} value={formatNumber(favorites)} />
              )}
            </View>
          </Card>

          {stats.topType || stats.topCafe ? (
            <Card style={styles.card}>
              <View style={styles.pair}>
                {stats.topType ? (
                  <Figure
                    label={t('stats.topType')}
                    value={typeName(stats.topType)}
                    detail={times(stats.topType.count)}
                  />
                ) : null}
                {stats.topCafe ? (
                  <Figure
                    label={t('stats.topCafe')}
                    value={stats.topCafe.label}
                    detail={times(stats.topCafe.count)}
                  />
                ) : null}
              </View>
            </Card>
          ) : null}

          {stats.spending.length > 0 ? (
            <Card style={styles.card}>
              <Text variant="small" color="textSecondary">
                {t('stats.spending.title')}
              </Text>
              {stats.spending.map((line) => (
                <View key={line.currency} style={styles.spendingRow}>
                  <Text style={styles.figureValue}>{formatCurrency(line.total, line.currency)}</Text>
                  <Text variant="caption" color="textMuted">
                    {line.count === 1
                      ? t('stats.spending.count.one')
                      : t('stats.spending.count.other', { count: formatNumber(line.count) })}
                  </Text>
                </View>
              ))}
              <Text variant="caption" color="textMuted" style={styles.note}>
                {t('stats.spending.note')}
              </Text>
            </Card>
          ) : null}

          {stats.topRated.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('stats.topRated')} />
              <Card style={styles.listCard}>
                {stats.topRated.map((entry, index) => (
                  <EntryRow key={entry.id} entry={entry} last={index === stats.topRated.length - 1} />
                ))}
              </Card>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
  },
  periods: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    marginTop: spacing.md,
  },
  shelf: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  shelfPhoto: {
    width: 76,
    borderRadius: 16,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  figure: {
    flex: 1,
    gap: spacing.xs,
  },
  // The big numbers, in the mocha accent the rest of the app keeps quiet.
  figureValue: {
    fontFamily: fonts.sansBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: colors.textSecondary,
  },
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  note: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.xl + 4,
  },
  listCard: {
    paddingVertical: spacing.xs,
  },
});
