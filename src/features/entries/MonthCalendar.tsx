import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CupMark, Text } from "@/components/ui";
import { formatDate, t, weekdayInitials } from "@/i18n";
import { colors, radii, spacing } from "@/theme";

import type { Entry } from "./types";

type MonthCalendarProps = {
  // Any date inside the month to show.
  month: Date;
  // The entries of that month, keyed by day of the month.
  entriesByDay: Map<number, Entry[]>;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  // Called for a day without a coffee, to start one on it.
  onLogDay: (day: number) => void;
};

// Weeks run Monday to Sunday. Empty slots pad the first and last week.
function buildWeeks(month: Date): (number | null)[][] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const leading = (new Date(year, index, 1).getDay() + 6) % 7;
  const days = new Date(year, index + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, day) => day + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7)
    weeks.push(cells.slice(start, start + 7));
  return weeks;
}

const GAP = spacing.sm - 2;

// A month at a glance: each day you had a coffee shows its photograph, or
// failing that a drawing of what was drunk.
export function MonthCalendar({
  month,
  entriesByDay,
  selectedDay,
  onSelectDay,
  onLogDay,
}: MonthCalendarProps) {
  const weeks = useMemo(() => buildWeeks(month), [month]);
  const initials = useMemo(() => weekdayInitials(), []);
  // The cup is drawn to fit a day, whose size follows the calendar's width.
  const [width, setWidth] = useState(0);
  const cupSize = Math.max(0, Math.floor(((width - GAP * 6) / 7) * 0.8));

  const now = new Date();
  const today =
    now.getFullYear() === month.getFullYear() &&
    now.getMonth() === month.getMonth()
      ? now.getDate()
      : null;

  return (
    <View
      style={styles.calendar}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View style={styles.week}>
        {initials.map((initial, index) => (
          <Text
            key={index}
            variant="caption"
            color="textMuted"
            align="center"
            style={styles.weekday}
          >
            {initial}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => {
            if (day === null)
              return <View key={dayIndex} style={styles.slot} />;

            const entries = entriesByDay.get(day) ?? [];
            const photo = entries.find((entry) => entry.photoUrl);
            const hasCoffee = entries.length > 0;
            // A coffee cannot be logged ahead of time.
            const future = today !== null && day > today;
            const date = formatDate(
              new Date(month.getFullYear(), month.getMonth(), day),
              "day",
            );

            return (
              <View key={dayIndex} style={styles.slot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    hasCoffee ? date : t("diary.logOn", { day: date })
                  }
                  accessibilityState={{
                    selected: selectedDay === day,
                    disabled: future,
                  }}
                  disabled={future}
                  onPress={() =>
                    hasCoffee
                      ? onSelectDay(selectedDay === day ? null : day)
                      : onLogDay(day)
                  }
                  style={({ pressed }) => [
                    styles.day,
                    hasCoffee && !photo && styles.dayWithCoffee,
                    today === day && !hasCoffee && styles.today,
                    selectedDay === day && styles.selected,
                    future && styles.future,
                    pressed && !hasCoffee && styles.pressed,
                  ]}
                >
                  {photo?.photoUrl ? (
                    <Image
                      source={
                        photo.photoPath
                          ? { uri: photo.photoUrl, cacheKey: photo.photoPath }
                          : { uri: photo.photoUrl }
                      }
                      contentFit="cover"
                      transition={150}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : hasCoffee ? (
                    <CupMark
                      drink={entries.find((entry) => entry.type)?.type}
                      size={cupSize}
                    />
                  ) : (
                    <Text
                      variant="label"
                      maxFontSizeMultiplier={1.1}
                      style={styles.dayNumber}
                    >
                      {day}
                    </Text>
                  )}
                  {/* The picture takes the number's place, so it moves to a corner. */}
                  {hasCoffee ? (
                    <View style={styles.number}>
                      <Text
                        variant="caption"
                        maxFontSizeMultiplier={1}
                        style={styles.numberText}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : null}
                  {entries.length > 1 ? (
                    <View style={styles.count}>
                      <Text
                        variant="caption"
                        maxFontSizeMultiplier={1}
                        style={styles.countText}
                      >
                        {entries.length}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    gap: GAP,
  },
  week: {
    flexDirection: "row",
    gap: GAP,
  },
  weekday: {
    flex: 1,
    paddingBottom: spacing.xs,
  },
  // Every column is an equal slot; the day inside takes its shape from it.
  slot: {
    flex: 1,
  },
  day: {
    width: "100%",
    aspectRatio: 0.82,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: radii.control - 2,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayWithCoffee: {
    backgroundColor: colors.highlight,
  },
  today: {
    borderColor: colors.borderStrong,
  },
  selected: {
    borderColor: colors.accent,
  },
  future: {
    opacity: 0.35,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  dayNumber: {
    fontSize: 14,
  },
  number: {
    position: "absolute",
    left: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 10,
    lineHeight: 13,
  },
  // Opposite the day's number, so the two never meet in a narrow day.
  count: {
    position: "absolute",
    right: 2,
    bottom: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 10,
    lineHeight: 13,
    color: colors.textOnAccent,
  },
});
