import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Button,
  Card,
  Chip,
  CoffeePhoto,
  EmptyState,
  Icon,
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
import { formatDate, formatNumber, t } from "@/i18n";
import { colors, contentColumn, radii, sizes, spacing } from "@/theme";

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
  const [view, setView] = useState<DiaryView>(readDiaryView);
  // Home's album card picks the view before it opens this tab.
  useFocusEffect(
    useCallback(() => {
      setView(readDiaryView());
    }, []),
  );
  const chooseView = (next: DiaryView) => {
    saveDiaryView(next);
    setView(next);
  };
  const album = useMemo(() => buildAlbum(entries), [entries]);

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

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[contentColumn, styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.textMuted}
          />
        }
      >
        <View style={styles.views} accessibilityRole="radiogroup">
          {diaryViews.map((option) => (
            <Chip
              key={option}
              label={t(`diary.views.${option}`)}
              selected={view === option}
              onPress={() => chooseView(option)}
            />
          ))}
        </View>

        {view === "album" ? (
          <>
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
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text
                variant="display"
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={styles.monthName}
              >
                {formatDate(month, "monthName")}
              </Text>
              <View style={styles.switcher}>
                <IconButton
                  icon="chevronLeft"
                  label={t("diary.previousMonth")}
                  onPress={() => changeMonth(-1)}
                />
                <View style={styles.monthPill}>
                  <Text variant="label">{formatDate(month, "year")}</Text>
                </View>
                <View
                  style={isCurrentMonth && styles.disabled}
                  pointerEvents={isCurrentMonth ? "none" : "auto"}
                >
                  <IconButton
                    icon="chevronRight"
                    label={t("diary.nextMonth")}
                    onPress={() => changeMonth(1)}
                  />
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="search"
              accessibilityLabel={t("search.open")}
              onPress={() => router.push("/search")}
              style={({ pressed }) => [
                styles.search,
                pressed && styles.pressed,
              ]}
            >
              <Icon name="search" size={18} color="textMuted" />
              <Text color="textMuted">{t("search.open")}</Text>
            </Pressable>

            <Card style={styles.calendarCard}>
              <MonthCalendar
                month={month}
                entriesByDay={entriesByDay}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onLogDay={logOn}
              />
            </Card>

            <View style={styles.list}>
              <SectionHeader title={listTitle} />
              {shown.length > 0 ? (
                <Card style={styles.listCard}>
                  {shown.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      last={index === shown.length - 1}
                    />
                  ))}
                </Card>
              ) : null}
              {selectedDay !== null ? (
                <Button
                  variant="quiet"
                  label={t("diary.logOnThisDay")}
                  onPress={() => logOn(selectedDay)}
                  style={styles.logOn}
                />
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  views: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
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
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  // Looks like the field it leads to.
  search: {
    minHeight: sizes.control,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  logOn: {
    marginTop: spacing.xs,
  },
  calendarCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  list: {
    marginTop: spacing.xl + 4,
  },
  listCard: {
    paddingVertical: spacing.xs,
  },
  emptyFrame: {
    width: 148,
  },
});
