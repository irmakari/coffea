import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, CupMark, Text } from '@/components/ui';
import type { Entry } from '@/features/entries/types';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import { computeStreak, recentDays } from './stats';

const DAYS_SHOWN = 7;
const DAY_SIZE = 36;

function plural(key: 'days' | 'best', count: number) {
  return count === 1 ? t(`stats.streak.${key}.one`) : t(`stats.streak.${key}.other`, { count: formatNumber(count) });
}

// How many days in a row have a coffee, with the past week drawn out: each
// day that has one shows the cup that was drunk.
export function StreakCard({ entries }: { entries: Entry[] }) {
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const week = useMemo(() => recentDays(entries, DAYS_SHOWN), [entries]);
  const logged = week.filter((day) => day.entry).length;

  const note = streak.loggedToday
    ? plural('best', streak.best)
    : t(streak.current > 0 ? 'stats.streak.keep' : 'stats.streak.start');

  return (
    <Card style={styles.card}>
      <View style={styles.text}>
        <Text variant="label" color="textSecondary">
          {t('stats.streak.title')}
        </Text>
        <Text variant="heading">{streak.current > 0 ? plural('days', streak.current) : t('stats.streak.days.none')}</Text>
        <Text variant="small" color="textSecondary">
          {note}
        </Text>
      </View>

      <View style={styles.week} accessible accessibilityLabel={t('stats.streak.week', { count: logged })}>
        {week.map(({ date, entry }, index) => {
          const today = index === week.length - 1;
          return (
            <View key={date.getTime()} style={styles.day}>
              <Text variant="caption" color={today ? 'text' : 'textMuted'}>
                {formatDate(date, 'weekdayInitial')}
              </Text>
              <View style={[styles.mark, entry ? styles.markLogged : today && styles.markToday]}>
                {entry ? <CupMark drink={entry.type} size={DAY_SIZE - 6} /> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  text: {
    gap: spacing.xs,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: radii.pill,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLogged: {
    borderColor: colors.highlight,
    backgroundColor: colors.highlight,
  },
  // Today's empty place is the one that can still be filled.
  markToday: {
    borderColor: colors.borderStrong,
  },
});
