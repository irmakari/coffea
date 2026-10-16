import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CupMark, Text } from "@/components/ui";
import { formatDate, weekdayInitials } from "@/i18n";
import { colors, radii, spacing, themed, withAlpha } from "@/theme";

import { useSticker } from "./sticker";
import type { Entry } from "./types";

type MonthCalendarProps = {
  // Any date inside the month to show.
  month: Date;
  // The entries of that month, keyed by day of the month.
  entriesByDay: Map<number, Entry[]>;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
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

// A month at a glance, like a sticker album: each day you had a coffee
// shows the cup lifted out of its photo, else the photo or a drawing.
export function MonthCalendar({
  month,
  entriesByDay,
  selectedDay,
  onSelectDay,
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
                  accessibilityLabel={date}
                  accessibilityState={{
                    selected: selectedDay === day,
                    disabled: future,
                  }}
                  disabled={future}
                  // Every day is picked the same way; the list below offers to
                  // log a coffee on it, so a tap never opens the form by surprise.
                  onPress={() => onSelectDay(selectedDay === day ? null : day)}
                  style={({ pressed }) => [
                    styles.day,
                    today === day && !hasCoffee && styles.today,
                    selectedDay === day &&
                      (hasCoffee ? styles.selected : styles.selectedEmpty),
                    future && styles.future,
                    pressed && !hasCoffee && styles.pressed,
                  ]}
                >
                  {hasCoffee ? (
                    <DayFace
                      photo={photo}
                      drink={entries.find((entry) => entry.type)?.type}
                      cupSize={cupSize}
                    />
                  ) : (
                    <Text
                      variant="label"
                      color={selectedDay === day ? "textOnAccent" : "text"}
                      maxFontSizeMultiplier={1.1}
                      style={styles.dayNumber}
                    >
                      {day}
                    </Text>
                  )}
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

// A day with a coffee: the sticker, else the photo, else a drawing. None of
// them carries the day's number, so the month reads as one album page.
function DayFace({
  photo,
  drink,
  cupSize,
}: {
  photo: Entry | undefined;
  drink: string | null | undefined;
  cupSize: number;
}) {
  const sticker = useSticker(photo?.photoUrl ?? null, photo?.photoPath ?? null);

  if (sticker) {
    return (
      <Image
        source={{ uri: sticker }}
        contentFit="contain"
        transition={200}
        style={styles.sticker}
      />
    );
  }

  return photo ? (
    <Image
      source={
        photo.photoPath
          ? { uri: photo.photoUrl ?? undefined, cacheKey: photo.photoPath }
          : { uri: photo.photoUrl ?? undefined }
      }
      contentFit="cover"
      transition={150}
      style={StyleSheet.absoluteFill}
    />
  ) : (
    <CupMark drink={drink} size={cupSize} />
  );
}

const styles = themed(() => ({
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
    aspectRatio: 0.86,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: radii.control - 2,
    // A shade darker than the page the calendar sits on.
    backgroundColor: withAlpha(colors.border, 0.6),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  today: {
    borderColor: colors.borderStrong,
  },
  // Picked: a dark ring round a coffee's picture, or the day filled dark,
  // so it never reads as today's lighter outline.
  selected: {
    borderWidth: 3,
    borderColor: colors.accent,
  },
  selectedEmpty: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  future: {
    opacity: 0.35,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  sticker: {
    position: "absolute",
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
  },
  dayNumber: {
    fontSize: 14,
  },
  // How many coffees the day had, in a corner of its picture.
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
}));
