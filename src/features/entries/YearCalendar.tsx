import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, radii, spacing, themed } from '@/theme';

import type { Entry } from './types';

export const YEAR_COLUMNS = 3;
const COLUMN_GAP = spacing.lg;
const ROW_GAP = spacing.xl;
const DAY_GAP = 2;

// Where a month's tile sits in the year, as a share of the grid's width and
// height from its middle: what a zoom into or out of that month is centred on.
export function monthOffset(month: number) {
  const rows = 12 / YEAR_COLUMNS;
  return {
    x: ((month % YEAR_COLUMNS) + 0.5) / YEAR_COLUMNS - 0.5,
    y: (Math.floor(month / YEAR_COLUMNS) + 0.5) / rows - 0.5,
  };
}

// The month whose tile lies under a point in the grid.
export function monthAt(x: number, y: number, width: number, height: number) {
  const column = Math.min(YEAR_COLUMNS - 1, Math.max(0, Math.floor((x / width) * YEAR_COLUMNS)));
  const row = Math.min(12 / YEAR_COLUMNS - 1, Math.max(0, Math.floor((y / height) * (12 / YEAR_COLUMNS))));
  return row * YEAR_COLUMNS + column;
}

// Monday-first cells for one month, with empty slots before the first day.
function cellsOf(year: number, month: number) {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array.from({ length: leading }, () => 0), ...Array.from({ length: days }, (_, day) => day + 1)];
}

function dayKey(month: number, day: number) {
  return month * 100 + day;
}

type MiniMonthProps = {
  width: number;
  year: number;
  month: number;
  counts: Map<number, number>;
  today: number | null;
  onPress: () => void;
};

function MiniMonth({ width, year, month, counts, today, onPress }: MiniMonthProps) {
  const cells = useMemo(() => cellsOf(year, month), [year, month]);
  const total = cells.reduce((sum, day) => sum + (counts.get(dayKey(month, day)) ?? 0), 0);
  const label = formatDate(new Date(year, month, 1), 'monthShort');
  const future = new Date(year, month, 1) > new Date();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatDate(new Date(year, month, 1), 'month')}, ${total}`}
      onPress={onPress}
      disabled={future}
      style={({ pressed }) => [styles.month, { width }, future && styles.future, pressed && styles.pressed]}
    >
      <View style={styles.monthHead}>
        <Text variant="label">{label}</Text>
        {total > 0 ? (
          <Text variant="caption" color="textMuted">
            {formatNumber(total)}
          </Text>
        ) : null}
      </View>
      <View style={styles.days}>
        {cells.map((day, index) => {
          const count = day ? (counts.get(dayKey(month, day)) ?? 0) : 0;
          return (
            <View key={index} style={styles.dayCell}>
              {day ? (
                <View
                  style={[
                    styles.day,
                    count === 1 && styles.one,
                    count === 2 && styles.two,
                    count >= 3 && styles.many,
                    today === day && styles.today,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

type YearCalendarProps = {
  // The width it will be drawn at, when already known, so the months are
  // in place on the first frame of a zoom.
  width?: number;
  year: number;
  entries: Entry[];
  onPickMonth: (month: number) => void;
};

// A whole year at once: each day a dot, darker the more coffees were drunk
// on it. A month is opened from here with a tap or a pinch outwards.
export function YearCalendar({ width, year, entries, onPickMonth }: YearCalendarProps) {
  const counts = useMemo(() => {
    const byDay = new Map<number, number>();
    for (const entry of entries) {
      const at = new Date(entry.consumedAt);
      if (at.getFullYear() !== year) continue;
      const key = dayKey(at.getMonth(), at.getDate());
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return byDay;
  }, [entries, year]);

  // Three months to a row, sized from the grid's own width.
  const [measured, setMeasured] = useState(0);
  const gridWidth = width || measured;
  const monthWidth = Math.floor((gridWidth - COLUMN_GAP * (YEAR_COLUMNS - 1)) / YEAR_COLUMNS);

  const now = new Date();
  const days = counts.size;
  const cups = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return (
    <View style={styles.root}>
      <Text color="textSecondary">
        {t('diary.year.summary', { cups: formatNumber(cups), days: formatNumber(days) })}
      </Text>
      <View style={styles.grid} onLayout={(event) => setMeasured(event.nativeEvent.layout.width)}>
        {gridWidth > 0 && Array.from({ length: 12 }, (_, month) => (
          <MiniMonth
            key={month}
            width={monthWidth}
            year={year}
            month={month}
            counts={counts}
            today={now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null}
            onPress={() => onPickMonth(month)}
          />
        ))}
      </View>
      <View style={styles.legend}>
        <Text variant="caption" color="textMuted">
          {t('diary.year.less')}
        </Text>
        <View style={[styles.day, styles.legendDot]} />
        <View style={[styles.day, styles.one, styles.legendDot]} />
        <View style={[styles.day, styles.two, styles.legendDot]} />
        <View style={[styles.day, styles.many, styles.legendDot]} />
        <Text variant="caption" color="textMuted">
          {t('diary.year.more')}
        </Text>
      </View>
    </View>
  );
}

const styles = themed(() => ({
  root: {
    gap: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: ROW_GAP,
  },
  month: {
    gap: spacing.xs + 2,
  },
  future: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.6,
  },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: DAY_GAP / 2,
  },
  day: {
    flex: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  one: {
    backgroundColor: colors.highlight,
  },
  two: {
    backgroundColor: colors.textSecondary,
  },
  many: {
    backgroundColor: colors.text,
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  legendDot: {
    flex: 0,
    width: 10,
    height: 10,
  },
}));
