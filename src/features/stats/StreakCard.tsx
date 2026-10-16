import { Image } from 'expo-image';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Card, CupMark, Text } from '@/components/ui';
import { useSticker } from '@/features/entries/sticker';
import type { Entry } from '@/features/entries/types';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, radii, sizes, spacing, themed } from '@/theme';

import { computeStreak, recentDays } from './stats';

const DAYS_SHOWN = 7;
const DAY_SIZE = 36;

function plural(key: 'days' | 'best', count: number) {
  return count === 1 ? t(`stats.streak.${key}.one`) : t(`stats.streak.${key}.other`, { count: formatNumber(count) });
}

// What fills a day that has a coffee: its sticker, else its photo, else
// the drawing of the drink. Nothing while a sticker is still being made, so
// the photo does not flash up and give way.
function DayCoffee({ entry }: { entry: Entry }) {
  const sticker = useSticker(entry.photoUrl, entry.photoPath);
  if (sticker) {
    return <Image source={{ uri: sticker }} contentFit="contain" transition={200} style={styles.sticker} />;
  }
  if (sticker === undefined) return null;
  if (entry.photoUrl) {
    return (
      <Image
        source={entry.photoPath ? { uri: entry.photoUrl, cacheKey: entry.photoPath } : { uri: entry.photoUrl }}
        contentFit="cover"
        transition={200}
        style={styles.photo}
      />
    );
  }
  return <CupMark drink={entry.type} size={DAY_SIZE - 6} />;
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
    <Card outline style={styles.card}>
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
                {entry ? <DayCoffee entry={entry} /> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = themed(() => ({
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
    overflow: 'hidden',
  },
  sticker: {
    width: DAY_SIZE - 4,
    height: DAY_SIZE - 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  markLogged: {
    borderColor: colors.highlight,
    backgroundColor: colors.highlight,
  },
  // Today's empty place is the one that can still be filled.
  markToday: {
    borderColor: colors.borderStrong,
  },
}));
