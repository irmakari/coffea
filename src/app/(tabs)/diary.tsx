import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Button,
  Chip,
  CoffeePhoto,
  EmptyState,
  IconButton,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
} from "@/components/ui";
import { buildAlbum, collectedCount } from "@/features/album/album";
import { AlbumGrid } from "@/features/album/AlbumGrid";
import {
  diaryViews,
  readDiaryView,
  saveDiaryView,
  type DiaryView,
} from "@/features/album/diaryView";
import { useEntries } from "@/features/entries/EntriesProvider";
import { EntryRow } from "@/features/entries/EntryCard";
import { startLog } from "@/features/entries/logDraft";
import { MonthCalendar } from "@/features/entries/MonthCalendar";
import type { Entry } from "@/features/entries/types";
import {
  monthAt,
  monthOffset,
  YearCalendar,
} from "@/features/entries/YearCalendar";
import { formatDate, formatNumber, t } from "@/i18n";
import { tapFeedback } from "@/lib/haptics";
import { colors, contentColumn, radii, sizes, spacing, themed } from "@/theme";

// How far a month is blown up while the year zooms out of it.
const ZOOM = 3;
// How far a pinch has to go to change between month and year.
const PINCH_IN = 0.85;
const PINCH_OUT = 1.2;

function countLabel(count: number) {
  if (count === 0) return t("diary.count.none");
  if (count === 1) return t("diary.count.one");
  return t("diary.count.other", { count: formatNumber(count) });
}

export default function DiaryScreen() {
  const { entries, status, reload } = useEntries();
  const [refreshing, setRefreshing] = useState(false);
  // The first day of the month on show, and an optional day picked within it.
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Where the day's list starts, so picking a day can bring it into view.
  const scrollRef = useRef<ScrollView>(null);
  const listY = useRef(0);
  const { height } = useWindowDimensions();
  // The month fills the screen, so the day's coffees and its log button
  // would sit out of sight below it. Brought up to the middle of the screen,
  // with the last weeks still above to pick another day. After the frame
  // that draws the day's list, since the page's height changes with it.
  useEffect(() => {
    if (selectedDay === null) return;
    const frame = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({
        y: Math.max(listY.current - height * 0.45, 0),
        animated: true,
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selectedDay, height]);
  const [view, setView] = useState<DiaryView>(readDiaryView);
  // The two views are pages of their own, so a swipe moves between them
  // before it moves on to the next tab, as Instagram's profile tabs do.
  const pagerRef = useRef<PagerView>(null);
  // Home's album card picks the view before it opens this tab.
  useFocusEffect(
    useCallback(() => {
      const saved = readDiaryView();
      setView(saved);
      pagerRef.current?.setPageWithoutAnimation(diaryViews.indexOf(saved));
    }, []),
  );
  const showView = (next: DiaryView) => {
    saveDiaryView(next);
    setView(next);
  };
  const chooseView = (next: DiaryView) => {
    showView(next);
    pagerRef.current?.setPage(diaryViews.indexOf(next));
  };
  const album = useMemo(() => buildAlbum(entries), [entries]);

  // The calendar shows one month, or zooms out to the whole year. Pinching
  // in on a month, or tapping its year, shows the year; pinching out on a
  // month in it, or tapping one, zooms back in.
  const [zoom, setZoom] = useState<"month" | "year">("month");
  const [yearShown, setYearShown] = useState(() => new Date().getFullYear());
  // The month the zoom is centred on.
  const [anchor, setAnchor] = useState(() => new Date().getMonth());
  const [grid, setGrid] = useState({ width: 0, height: 0 });
  // The month's width, which the year is drawn at from its first frame.
  const [calendarWidth, setCalendarWidth] = useState(0);
  // 0 while blown up on the anchor month, 1 with the whole year in view.
  const yearZoom = useSharedValue(0);
  // How far a pinch in progress has gone, followed a little on screen.
  const pinch = useSharedValue(1);

  const toYear = () => {
    tapFeedback();
    setSelectedDay(null);
    setAnchor(month.getMonth());
    setYearShown(month.getFullYear());
    setZoom("year");
    yearZoom.set(0);
    yearZoom.set(
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
  };
  const showMonth = (index: number) => {
    setMonth(new Date(yearShown, index, 1));
    setSelectedDay(null);
    setZoom("month");
  };
  const openMonth = (index: number) => {
    if (new Date(yearShown, index, 1) > new Date()) return;
    tapFeedback();
    setAnchor(index);
    yearZoom.set(
      withTiming(
        0,
        { duration: 340, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(showMonth, index);
        },
      ),
    );
  };
  const openMonthAt = (x: number, y: number) =>
    openMonth(monthAt(x, y, grid.width, grid.height));

  const monthPinch = Gesture.Pinch()
    .onUpdate((event) => {
      pinch.set(Math.max(0.7, Math.min(1.05, event.scale)));
    })
    .onEnd((event) => {
      if (event.scale < PINCH_IN) scheduleOnRN(toYear);
      pinch.set(withSpring(1, { damping: 15 }));
    });
  const yearPinch = Gesture.Pinch()
    .onUpdate((event) => {
      pinch.set(Math.max(0.95, Math.min(1.4, event.scale)));
    })
    .onEnd((event) => {
      if (event.scale > PINCH_OUT)
        scheduleOnRN(openMonthAt, event.focalX, event.focalY);
      pinch.set(withSpring(1, { damping: 15 }));
    });

  // The year grows out of, and shrinks back into, the anchor month's tile.
  const offset = monthOffset(anchor);
  const origin = `${(offset.x + 0.5) * 100}% ${(offset.y + 0.5) * 100}%`;
  const yearStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, yearZoom.value * 1.8),
    transform: [
      { scale: (ZOOM - (ZOOM - 1) * yearZoom.value) * pinch.value },
    ],
  }));
  const monthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinch.value }],
    opacity: 0.4 + 0.6 * Math.min(1, (pinch.value - 0.7) / 0.3),
  }));

  const { monthEntries, entriesByDay } = useMemo(() => {
    const inMonth: Entry[] = [];
    const byDay = new Map<number, Entry[]>();
    for (const entry of entries) {
      const date = new Date(entry.consumedAt);
      if (
        date.getFullYear() !== month.getFullYear() ||
        date.getMonth() !== month.getMonth()
      )
        continue;
      inMonth.push(entry);
      const day = date.getDate();
      byDay.set(day, [...(byDay.get(day) ?? []), entry]);
    }
    return { monthEntries: inMonth, entriesByDay: byDay };
  }, [entries, month]);

  if (entries.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t("diary.title")} />
        {status === "loading" ? (
          <LoadingState />
        ) : status === "error" ? (
          <EmptyState
            title={t("common.loadError.title")}
            body={t("common.loadError.body")}
            action={
              <Button
                variant="secondary"
                label={t("common.retry")}
                onPress={reload}
              />
            }
          />
        ) : (
          <EmptyState
            visual={<CoffeePhoto style={styles.emptyFrame} />}
            title={t("diary.empty.title")}
            body={t("diary.empty.body")}
            action={
              <Button
                label={t("diary.empty.action")}
                onPress={() => router.push("/log")}
              />
            }
          />
        )}
      </Screen>
    );
  }

  const now = new Date();
  const isCurrentMonth =
    month.getFullYear() === now.getFullYear() &&
    month.getMonth() === now.getMonth();

  const changeMonth = (step: number) => {
    setSelectedDay(null);
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + step, 1),
    );
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const logOn = (day: number) =>
    startLog({ day: new Date(month.getFullYear(), month.getMonth(), day) });

  const shown =
    selectedDay === null ? monthEntries : (entriesByDay.get(selectedDay) ?? []);
  const listTitle =
    selectedDay === null
      ? countLabel(monthEntries.length)
      : formatDate(
          new Date(month.getFullYear(), month.getMonth(), selectedDay),
          "day",
        );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      tintColor={colors.textMuted}
    />
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={[contentColumn, styles.bar]}>
        <View style={styles.views} accessibilityRole="radiogroup">
          {diaryViews.map((option) => (
            <Chip
              key={option}
              label={t(`diary.views.${option}`)}
              selected={view === option}
              onPress={() => chooseView(option)}
              plain
            />
          ))}
          <View style={styles.searchButton}>
            <IconButton
              plain
              icon="search"
              label={t("search.open")}
              onPress={() => router.push("/search")}
            />
          </View>
        </View>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={diaryViews.indexOf(view)}
        onPageSelected={(event) => {
          const next = diaryViews[event.nativeEvent.position];
          if (next && next !== view) showView(next);
        }}
      >
        <View key="calendar">
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[contentColumn, styles.content]}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            <View style={styles.header}>
              <Text
                variant="display"
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={styles.monthName}
              >
                {zoom === "year"
                  ? String(yearShown)
                  : formatDate(month, "monthName")}
              </Text>
              {zoom === "year" ? (
                <View style={styles.switcher}>
                  <IconButton
                    plain
                    icon="chevronLeft"
                    label={t("diary.year.previous")}
                    onPress={() => setYearShown((year) => year - 1)}
                  />
                  <View
                    style={yearShown >= now.getFullYear() && styles.disabled}
                    pointerEvents={
                      yearShown >= now.getFullYear() ? "none" : "auto"
                    }
                  >
                    <IconButton
                      plain
                      icon="chevronRight"
                      label={t("diary.year.next")}
                      onPress={() => setYearShown((year) => year + 1)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.switcher}>
                  <IconButton
                    plain
                    icon="chevronLeft"
                    label={t("diary.previousMonth")}
                    onPress={() => changeMonth(-1)}
                  />
                  {/* The year opens the whole year, as a pinch in does. */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("diary.year.open")}
                    onPress={toYear}
                    style={({ pressed }) => [
                      styles.monthPill,
                      styles.yearButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text variant="label">{formatDate(month, "year")}</Text>
                  </Pressable>
                  <View
                    style={isCurrentMonth && styles.disabled}
                    pointerEvents={isCurrentMonth ? "none" : "auto"}
                  >
                    <IconButton
                      plain
                      icon="chevronRight"
                      label={t("diary.nextMonth")}
                      onPress={() => changeMonth(1)}
                    />
                  </View>
                </View>
              )}
            </View>

            {zoom === "year" ? (
              <View style={styles.yearClip}>
                <GestureDetector gesture={yearPinch}>
                  <Animated.View
                    style={[
                      styles.calendarCard,
                      { transformOrigin: origin },
                      yearStyle,
                    ]}
                    onLayout={(event) =>
                      setGrid({
                        width: event.nativeEvent.layout.width,
                        height: event.nativeEvent.layout.height,
                      })
                    }
                  >
                    <YearCalendar
                      width={calendarWidth}
                      year={yearShown}
                      entries={entries}
                      onPickMonth={openMonth}
                    />
                  </Animated.View>
                </GestureDetector>
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(260)}>
                <GestureDetector gesture={monthPinch}>
                  <Animated.View
                    style={monthStyle}
                    onLayout={(event) =>
                      setCalendarWidth(event.nativeEvent.layout.width)
                    }
                  >
                    <View style={styles.calendarCard}>
                      <MonthCalendar
                        month={month}
                        entriesByDay={entriesByDay}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                      />
                    </View>
                  </Animated.View>
                </GestureDetector>

                <View
                  style={styles.list}
                  onLayout={(event) => {
                    listY.current = event.nativeEvent.layout.y;
                  }}
                >
                  <SectionHeader title={listTitle} />
                  {shown.length > 0 ? (
                    <View>
                      {shown.map((entry, index) => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          last={index === shown.length - 1}
                        />
                      ))}
                    </View>
                  ) : selectedDay !== null ? (
                    <Text color="textSecondary">{t("diary.noneOnDay")}</Text>
                  ) : null}
                  {selectedDay !== null ? (
                    <Button
                      variant="quiet"
                      label={t(
                        shown.length > 0
                          ? "diary.logOnThisDay"
                          : "diary.logFirstOnThisDay",
                      )}
                      onPress={() => logOn(selectedDay)}
                      style={styles.logOn}
                    />
                  ) : null}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </View>
        <View key="album">
          <ScrollView
            contentContainerStyle={[contentColumn, styles.content]}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            <View style={styles.header}>
              <Text
                variant="display"
                accessibilityRole="header"
                style={styles.monthName}
              >
                {t("album.title")}
              </Text>
              <View style={styles.monthPill}>
                <Text variant="label">
                  {t("album.progress", {
                    collected: formatNumber(collectedCount(album)),
                    total: formatNumber(album.length),
                  })}
                </Text>
              </View>
            </View>
            <Text color="textSecondary" style={styles.albumIntro}>
              {t("album.body")}
            </Text>
            <View style={styles.album}>
              <AlbumGrid cards={album} />
            </View>
          </ScrollView>
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // The view chips stay put while the pages under them slide.
  bar: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  pager: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxxl,
  },
  views: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  // Search covers every month and the album alike, so it sits by the views.
  searchButton: {
    marginLeft: "auto",
  },
  albumIntro: {
    marginTop: spacing.sm,
  },
  album: {
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  monthName: {
    flex: 1,
  },
  switcher: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  monthPill: {
    height: sizes.chip,
    paddingHorizontal: spacing.md + 2,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  yearButton: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // The year starts blown up on one month; it is kept inside the page.
  yearClip: {
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.7,
  },
  logOn: {
    marginTop: spacing.xs,
  },
  // Straight on the page, like the lists below it.
  calendarCard: {
    marginTop: spacing.xl,
  },
  list: {
    marginTop: spacing.xl + 4,
  },
  emptyFrame: {
    width: 148,
  },
}));
