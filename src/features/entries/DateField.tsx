import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { formatDate, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
};

// The days offered at a tap, ending with today. Anything older goes through
// the calendar in the last place of the row.
const RECENT_DAYS = 6;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayName(day: Date, today: Date) {
  if (sameDay(day, today)) return t('entry.date.today');
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (sameDay(day, yesterday)) return t('entry.date.yesterday');
  return formatDate(day, day.getFullYear() === today.getFullYear() ? 'day' : 'short');
}

// Most coffees are logged the day they are drunk or soon after, so the last
// few days are one tap each and the time sits beside them. A coffee can be
// backdated but not logged in the future.
export function DateField({ label, value, onChange }: DateFieldProps) {
  // iOS opens its pickers in place, under the row; Android uses dialogs.
  const [open, setOpen] = useState<'day' | 'time' | null>(null);

  const today = new Date();
  const recent = Array.from(
    { length: RECENT_DAYS },
    (_, index) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (RECENT_DAYS - 1 - index)),
  );
  const earlier = !recent.some((day) => sameDay(day, value));

  const commit = (picked: Date) => {
    const now = new Date();
    onChange(picked > now ? now : picked);
  };
  // The pickers hand back a whole date; only the half that was asked for is
  // taken from it.
  const pickDay = (day: Date) =>
    commit(new Date(day.getFullYear(), day.getMonth(), day.getDate(), value.getHours(), value.getMinutes()));
  const pickTime = (time: Date) =>
    commit(new Date(value.getFullYear(), value.getMonth(), value.getDate(), time.getHours(), time.getMinutes()));

  const choose = (what: 'day' | 'time') => {
    if (Platform.OS === 'ios') {
      setOpen((current) => (current === what ? null : what));
    } else if (what === 'day') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate: new Date(),
        onValueChange: (_event, day) => pickDay(day),
      });
    } else {
      DateTimePickerAndroid.open({ value, mode: 'time', onValueChange: (_event, time) => pickTime(time) });
    }
  };

  return (
    <View style={styles.field}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>

      <View style={styles.days}>
        {recent.map((day) => {
          const selected = sameDay(day, value);
          return (
            <Pressable
              key={day.getTime()}
              accessibilityRole="button"
              accessibilityLabel={dayName(day, today)}
              accessibilityState={{ selected }}
              onPress={() => {
                setOpen(null);
                pickDay(day);
              }}
              style={styles.day}
            >
              <Text variant="caption" color={sameDay(day, today) ? 'text' : 'textMuted'}>
                {formatDate(day, 'weekdayInitial')}
              </Text>
              <View style={[styles.mark, selected && styles.markSelected]}>
                <Text variant="label" color={selected ? 'textOnAccent' : 'text'} maxFontSizeMultiplier={1.1}>
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('entry.date.earlier')}
          accessibilityState={{ selected: earlier, expanded: open === 'day' }}
          onPress={() => choose('day')}
          style={styles.day}
        >
          {/* Keeps the calendar level with the days beside it. */}
          <Text variant="caption"> </Text>
          <View style={[styles.mark, earlier && styles.markSelected]}>
            <Icon name="calendar" size={18} color={earlier ? 'textOnAccent' : 'text'} />
          </View>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text variant="bodyStrong" numberOfLines={1} style={styles.summaryDay}>
          {dayName(value, today)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('entry.date.time')}
          accessibilityValue={{ text: formatDate(value, 'time') }}
          accessibilityState={{ expanded: open === 'time' }}
          onPress={() => choose('time')}
          style={({ pressed }) => [styles.time, (pressed || open === 'time') && styles.timeActive]}
        >
          <Text variant="label">{formatDate(value, 'time')}</Text>
        </Pressable>
      </View>

      {open === 'day' ? (
        <View style={styles.picker}>
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            maximumDate={today}
            accentColor={colors.accent}
            themeVariant="light"
            onValueChange={(_event, day) => pickDay(day)}
          />
        </View>
      ) : null}
      {open === 'time' ? (
        <View style={styles.picker}>
          <DateTimePicker
            value={value}
            mode="time"
            display="spinner"
            textColor={colors.text}
            themeVariant="light"
            onValueChange={(_event, time) => pickTime(time)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.md,
  },
  days: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  mark: {
    width: sizes.chip,
    height: sizes.chip,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSelected: {
    backgroundColor: colors.accent,
  },
  summary: {
    minHeight: sizes.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  summaryDay: {
    flexShrink: 1,
  },
  time: {
    minHeight: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  timeActive: {
    backgroundColor: colors.surfacePressed,
  },
  picker: {
    paddingHorizontal: spacing.sm,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
