import type { Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CupMark } from '@/components/ui';
import { isCoffeeType } from '@/features/entries/types';
import { formatNumber, t } from '@/i18n';
import { fonts, palette } from '@/theme';

import type { Stats } from '@/features/stats/stats';

// Drawn in the same 360 x 640 story space as the coffee cards.
const BASE_WIDTH = 360;

type YearCardProps = {
  year: number;
  stats: Stats;
  caffeine: number;
  width: number;
  ref?: Ref<View>;
};

// The year's numbers on one dark story card, made to be shared.
export function YearCard({ year, stats, caffeine, width, ref }: YearCardProps) {
  const u = width / BASE_WIDTH;
  const topType = stats.topType;
  const topTypeName = topType ? (isCoffeeType(topType.label) ? t(`coffeeTypes.${topType.label}`) : topType.label) : null;

  const figures = [
    { value: stats.total, label: t(stats.total === 1 ? 'year.cups.one' : 'year.cups.other') },
    { value: stats.activeDays, label: t(stats.activeDays === 1 ? 'year.days.one' : 'year.days.other') },
    { value: stats.distinctCafes, label: t(stats.distinctCafes === 1 ? 'year.cafes.one' : 'year.cafes.other') },
    { value: caffeine, label: t('year.caffeine') },
  ];

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { width, height: width * (16 / 9), padding: 28 * u, gap: 22 * u }]}
    >
      <Text style={[styles.eyebrow, { fontSize: 12 * u, letterSpacing: 1.2 * u }]}>
        {t('year.eyebrow', { year }).toUpperCase()}
      </Text>
      <Text style={[styles.heading, { fontSize: 36 * u, lineHeight: 40 * u, letterSpacing: -1.1 * u }]}>
        {t('year.heading')}
      </Text>

      <View style={[styles.grid, { gap: 10 * u }]}>
        {figures.map((figure) => (
          <View key={figure.label} style={[styles.figure, { padding: 14 * u, borderRadius: 16 * u }]}>
            <Text
              style={[styles.value, { fontSize: 30 * u, lineHeight: 36 * u }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatNumber(figure.value)}
            </Text>
            <Text style={[styles.label, { fontSize: 12 * u }]}>{figure.label}</Text>
          </View>
        ))}
      </View>

      {topType ? (
        <View style={[styles.row, { gap: 14 * u, padding: 14 * u, borderRadius: 16 * u }]}>
          <CupMark drink={topType.label} size={56 * u} />
          <View style={styles.rowText}>
            <Text style={[styles.label, { fontSize: 12 * u }]}>{t('year.topType')}</Text>
            <Text style={[styles.rowValue, { fontSize: 20 * u }]} numberOfLines={1}>
              {topTypeName}
            </Text>
          </View>
        </View>
      ) : null}

      {stats.topCafe ? (
        <View style={[styles.row, { gap: 14 * u, padding: 14 * u, borderRadius: 16 * u }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { fontSize: 12 * u }]}>{t('year.topCafe')}</Text>
            <Text style={[styles.rowValue, { fontSize: 20 * u }]} numberOfLines={1}>
              {stats.topCafe.label}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={[styles.brand, { fontSize: 14 * u }]}>{t('brand.name')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.espresso,
  },
  eyebrow: {
    fontFamily: fonts.sansStrong,
    color: palette.oatTaupe,
  },
  heading: {
    fontFamily: fonts.sansBold,
    color: palette.softWhite,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  figure: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: palette.darkRoast,
  },
  value: {
    fontFamily: fonts.sansBold,
    color: palette.softWhite,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: palette.oatTaupe,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.darkRoast,
  },
  rowText: {
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.sansBold,
    color: palette.softWhite,
  },
  brand: {
    marginTop: 'auto',
    fontFamily: fonts.sansBold,
    color: palette.latte,
  },
});
