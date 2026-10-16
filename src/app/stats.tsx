import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button, Card, CupMark, PageHeader, Screen, SectionHeader, SegmentedControl, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryRow } from '@/features/entries/EntryCard';
import { isCoffeeType } from '@/features/entries/types';
import { totalCaffeine } from '@/features/stats/caffeine';
import { shelvesFor } from '@/features/stats/shelves';
import { ledgeColor, StickerShelf } from '@/features/stats/StickerShelf';
import {
  computeStats,
  entriesInPeriod,
  statsPeriods,
  type StatsPeriod,
  type Tally,
} from '@/features/stats/stats';
import { formatCurrency, formatNumber, t } from '@/i18n';
import { colors, fonts, radii, sizes, spacing, themed, withAlpha } from '@/theme';

function times(count: number) {
  return count === 1 ? t('stats.times.one') : t('stats.times.other', { count: formatNumber(count) });
}

function typeName(tally: Tally) {
  return isCoffeeType(tally.label) ? t(`coffeeTypes.${tally.label}`) : tally.label;
}

// A small figure in the summary: the number, and what it counts beneath.
function SummaryFigure({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryFigure}>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption" color="accentPressed" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// A number with its unit set smaller beside it, so a long figure never has
// to shrink to fit.
function Amount({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.amount}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={styles.amountLine}>
        <Text style={styles.amountValue} numberOfLines={1}>
          {value}
        </Text>
        {unit ? (
          <Text variant="bodyStrong" color="textSecondary">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// One of the usuals: a picture, what it is, and how often.
function Usual({
  visual,
  label,
  name,
  count,
  last = false,
}: {
  visual: ReactNode;
  label: string;
  name: string;
  count: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.usual, last && styles.usualLast]}>
      {visual}
      <View style={styles.usualText}>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
        <Text variant="subheading" numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text variant="label" color="textSecondary">
        {count}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const { entries } = useEntries();
  const [period, setPeriod] = useState<StatsPeriod>('month');

  const inPeriod = useMemo(() => entriesInPeriod(entries, period), [entries, period]);
  const stats = useMemo(() => computeStats(inPeriod), [inPeriod]);
  // One visit makes no café a usual.
  const topCafe = stats.topCafe && stats.topCafe.count > 1 ? stats.topCafe : null;

  const shelves = useMemo(() => shelvesFor(inPeriod, period), [inPeriod, period]);
  const caffeine = totalCaffeine(inPeriod);
  const favorites = inPeriod.filter((entry) => entry.isFavorite).length;
  const rated = inPeriod.filter((entry) => entry.rating !== null);
  const averageRating =
    rated.length > 0 ? rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / rated.length : null;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('stats.heading')} />

      <View style={styles.switch}>
        <SegmentedControl
          options={statsPeriods.map((option) => ({ value: option, label: t(`stats.periods.${option}`) }))}
          value={period}
          onChange={setPeriod}
        />
      </View>

      {stats.total === 0 ? (
        <Card outline style={styles.empty}>
          <Text color="textSecondary">{entries.length === 0 ? t('stats.empty.body') : t('stats.periodEmpty')}</Text>
        </Card>
      ) : (
        <>
          {/* The one number the page is about, then three that colour it in. */}
          <View style={styles.summary}>
            <Text variant="eyebrow" color="accentPressed">
              {t(`stats.summary.period.${period}`)}
            </Text>
            <View style={styles.totalLine}>
              <Text style={styles.total}>{formatNumber(stats.total)}</Text>
              <Text variant="heading" color="accentPressed">
                {stats.total === 1 ? t('stats.summary.coffees.one') : t('stats.summary.coffees.other')}
              </Text>
            </View>
            <View style={styles.summaryFigures}>
              <SummaryFigure
                value={formatNumber(stats.activeDays)}
                label={stats.activeDays === 1 ? t('stats.summary.days.one') : t('stats.summary.days.other')}
              />
              <View style={styles.summaryRule} />
              <SummaryFigure
                value={averageRating !== null ? averageRating.toFixed(1) : '–'}
                label={t('stats.averageRating')}
              />
              <View style={styles.summaryRule} />
              <SummaryFigure value={formatNumber(favorites)} label={t('stats.favorites')} />
            </View>
          </View>

          {shelves.length > 0 ? (
            <View style={styles.shelves}>
              {shelves.map((shelf, index) => (
                <StickerShelf
                  key={shelf.key}
                  title={shelf.title}
                  detail={shelf.detail}
                  entries={shelf.entries}
                  color={ledgeColor(index)}
                />
              ))}
            </View>
          ) : null}

          {period === 'year' ? (
            <Button variant="secondary" label={t('year.open')} onPress={() => router.push('/year')} style={styles.year} />
          ) : null}

          {stats.topType || topCafe ? (
            <View style={styles.section}>
              <SectionHeader large title={t('stats.usuals')} />
              <View>
                {stats.topType ? (
                  <Usual
                    visual={
                      <View style={styles.usualVisual}>
                        <CupMark drink={stats.topType.label} size={40} />
                      </View>
                    }
                    label={t('stats.topType')}
                    name={typeName(stats.topType)}
                    count={times(stats.topType.count)}
                    last={!topCafe}
                  />
                ) : null}
                {topCafe ? (
                  <Usual
                    visual={
                      <View style={styles.usualVisual}>
                        <Text variant="heading" color="accentPressed">
                          {topCafe.label.trim().charAt(0).toLocaleUpperCase()}
                        </Text>
                      </View>
                    }
                    label={t('stats.topCafe')}
                    name={topCafe.label}
                    count={times(topCafe.count)}
                    last
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader large title={t('stats.caffeine.total')} />
            <View style={styles.pair}>
              <Card outline style={styles.tile}>
                <Amount label={t('stats.caffeine.all')} value={formatNumber(caffeine)} unit={t('stats.caffeine.unit')} />
              </Card>
              <Card outline style={styles.tile}>
                <Amount
                  label={t('stats.caffeine.perDay')}
                  value={formatNumber(Math.round(caffeine / Math.max(stats.activeDays, 1)))}
                  unit={t('stats.caffeine.unit')}
                />
              </Card>
            </View>
            <Text variant="caption" color="textMuted" style={styles.note}>
              {t('stats.caffeine.note')}
            </Text>
          </View>

          {stats.spending.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader large title={t('stats.spending.title')} />
              <Card outline style={styles.spending}>
                {stats.spending.map((line, index) => (
                  <View key={line.currency} style={[styles.spendingRow, index > 0 && styles.spendingRowRule]}>
                    <Text style={styles.amountValue} numberOfLines={1}>
                      {formatCurrency(line.total, line.currency)}
                    </Text>
                    <Text variant="label" color="textSecondary">
                      {line.count === 1
                        ? t('stats.spending.count.one')
                        : t('stats.spending.count.other', { count: formatNumber(line.count) })}
                    </Text>
                  </View>
                ))}
              </Card>
              <Text variant="caption" color="textMuted" style={styles.note}>
                {t('stats.spending.note')}
              </Text>
            </View>
          ) : null}

          {stats.topRated.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader large title={t('stats.topRated')} />
              {/* Straight on the page, split by hairlines, like home's earlier coffees. */}
              <View>
                {stats.topRated.map((entry, index) => (
                  <EntryRow key={entry.id} entry={entry} rating last={index === stats.topRated.length - 1} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = themed(() => ({
  switch: {
    marginTop: spacing.lg,
  },
  empty: {
    marginTop: spacing.xl,
  },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    backgroundColor: colors.highlight,
  },
  totalLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  // The page's focal point: big, heavy and tightly set.
  total: {
    fontFamily: fonts.sansBold,
    fontSize: 72,
    lineHeight: 80,
    letterSpacing: -3,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryFigures: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: sizes.hairline,
    borderTopColor: withAlpha(colors.text, 0.18),
  },
  summaryFigure: {
    flex: 1,
    gap: 2,
  },
  summaryRule: {
    width: sizes.hairline,
    marginHorizontal: spacing.md,
    backgroundColor: withAlpha(colors.text, 0.18),
  },
  summaryValue: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  shelves: {
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  year: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xxl,
  },
  usual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  usualLast: {
    borderBottomWidth: 0,
  },
  usualVisual: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usualText: {
    flex: 1,
    gap: 1,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    padding: spacing.lg,
  },
  amount: {
    gap: spacing.xs,
  },
  amountLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amountValue: {
    flexShrink: 1,
    fontFamily: fonts.sansBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  note: {
    marginTop: spacing.sm,
  },
  spending: {
    paddingVertical: spacing.sm,
  },
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  spendingRowRule: {
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
}));
