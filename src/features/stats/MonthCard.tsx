import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { CupMark, Icon, Text } from '@/components/ui';
import { isCoffeeType, type Entry } from '@/features/entries/types';
import { formatCurrency, formatDate, formatNumber, t } from '@/i18n';
import { colors, radii, spacing, themed, withAlpha } from '@/theme';

import { computeStats, countByThisTimeLastMonth, entriesInPeriod } from './stats';

const FIGURES = 3;

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.figure}>
      <Text variant="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function comparison(now: number, before: number): string | null {
  // With nothing to compare against there is nothing to say.
  if (before === 0) return null;
  const difference = Math.abs(now - before);
  if (difference === 0) return t('stats.month.same');
  const key = now > before ? 'more' : 'fewer';
  return difference === 1
    ? t(`stats.month.${key}.one`)
    : t(`stats.month.${key}.other`, { count: formatNumber(difference) });
}

// The month so far in one tan block: the coffee drunk most often, drawn, and
// a few numbers. Opens the full statistics.
export function MonthCard({ entries }: { entries: Entry[] }) {
  const { month, stats, lastMonth } = useMemo(() => {
    const now = new Date();
    return {
      month: formatDate(now, 'monthName'),
      stats: computeStats(entriesInPeriod(entries, 'month', now)),
      lastMonth: countByThisTimeLastMonth(entries, now),
    };
  }, [entries]);

  const top = stats.topType;
  // The currency most of this month's prices are in. Others are left to the
  // statistics page, since amounts in different currencies are never added.
  const spent = stats.spending[0];
  const versus = comparison(stats.total, lastMonth);

  const title = top
    ? isCoffeeType(top.label)
      ? t(`coffeeTypes.${top.label}`)
      : top.label
    : t(stats.total === 0 ? 'stats.month.empty.title' : 'stats.month.noType.title');
  const line = top
    ? top.count === 1
      ? t('stats.month.coffeeOfTheMonth.one')
      : t('stats.month.coffeeOfTheMonth.other', { count: formatNumber(top.count) })
    : t(stats.total === 0 ? 'stats.month.empty.body' : 'stats.month.noType.body');

  const counted = (key: 'cups' | 'cafes' | 'types' | 'days', count: number) => ({
    value: formatNumber(count),
    label: t(count === 1 ? `stats.month.${key}.one` : `stats.month.${key}.other`),
  });
  // Always three across, so a single figure never stretches over the whole
  // card. Money and cafés come first when the month has them; the rest are
  // numbers every month has.
  const figures = [
    counted('cups', stats.total),
    ...(spent ? [{ value: formatCurrency(spent.total, spent.currency), label: t('stats.month.spent') }] : []),
    ...(stats.distinctCafes > 0 ? [counted('cafes', stats.distinctCafes)] : []),
    ...(stats.distinctTypes > 0 ? [counted('types', stats.distinctTypes)] : []),
    counted('days', stats.activeDays),
  ].slice(0, FIGURES);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('stats.month.open')}
      onPress={() => router.push('/stats')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.topText}>
          <Text variant="eyebrow" color="accentPressed">
            {t('stats.month.eyebrow', { month })}
          </Text>
          <Text variant="title" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="small" color="accentPressed">
            {line}
          </Text>
        </View>
        <CupMark drink={top?.label} size={88} />
      </View>

      {stats.total > 0 ? (
        <View style={styles.figures}>
          {figures.map((figure) => (
            <Figure key={figure.label} value={figure.value} label={figure.label} />
          ))}
          {/* A month without a type has only two; the gap keeps their width. */}
          {figures.length < FIGURES ? <View style={styles.figureGap} /> : null}
        </View>
      ) : null}

      {/* Always there, so the card always shows that it opens something. */}
      <View style={styles.footer}>
        <View style={styles.footerText}>
          {!stats.topCafe && !versus ? (
            <Text variant="small" color="accentPressed">
              {t('stats.month.open')}
            </Text>
          ) : null}
          {stats.topCafe ? (
            <Text variant="small" numberOfLines={1}>
              {t('stats.month.topCafe', { cafe: stats.topCafe.label })}
            </Text>
          ) : null}
          {versus ? (
            <Text variant="small" color="accentPressed">
              {versus}
            </Text>
          ) : null}
        </View>
        <Icon name="chevronRight" size={16} color="accentPressed" />
      </View>
    </Pressable>
  );
}

const styles = themed(() => ({
  card: {
    padding: spacing.xl - 4,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    gap: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  topText: {
    flex: 1,
    gap: spacing.xs,
  },
  figures: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  figure: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    // Drawn in, not laid over: an outline in the card's own ink.
    borderWidth: 1,
    borderColor: withAlpha(colors.text, 0.14),
  },
  figureGap: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerText: {
    flex: 1,
    gap: 2,
  },
}));
