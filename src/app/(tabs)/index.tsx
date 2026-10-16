import { router } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  Card,
  CupMark,
  EmptyState,
  Icon,
  LoadingState,
  SectionHeader,
  Text,
} from "@/components/ui";
import { buildAlbum, collectedCount } from "@/features/album/album";
import { saveDiaryView } from "@/features/album/diaryView";
import { useEntries } from "@/features/entries/EntriesProvider";
import {
  EntryCard,
  EntryRow,
  EntryTile,
  TILE_WIDTH,
} from "@/features/entries/EntryCard";
import { StreakCard } from "@/features/stats/StreakCard";
import { useProfile } from "@/features/profile/ProfileProvider";
import { useHeroStatusBar } from "@/features/theme/theme";
import { formatDate, formatNumber, t, type TranslationKey } from "@/i18n";
import {
  colors,
  contentColumn,
  isDarkHero,
  isDarkTheme,
  radii,
  spacing,
  themed,
} from "@/theme";

const EARLIER_COUNT = 3;
const FAVORITES_COUNT = 8;

function greetingKey(hour: number): TranslationKey {
  if (hour < 12) return "home.greeting.morning";
  if (hour < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
}

// The tan block that opens the app: who, when, and the one thing to do.
function Hero({ count, refreshing }: { count: number; refreshing: boolean }) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const now = new Date();
  const greeting = t(greetingKey(now.getHours()));

  return (
    // The page colour shows in the hero's rounded corners, in front of the
    // tan that lies behind the top of the page.
    <View style={styles.heroCorners}>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <View style={contentColumn}>
          <View style={styles.masthead}>
            <Text variant="subheading" color="heroText">
              {t("brand.name")}
            </Text>
            {/* iOS would spin behind the status bar, which the hero runs
                under, so the hero shows the reload itself. */}
            {refreshing && Platform.OS === "ios" ? (
              <ActivityIndicator size="small" color={colors.heroTextSecondary} />
            ) : (
              <Text variant="caption" color="heroText">
                {formatDate(now, "day")}
              </Text>
            )}
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroText}>
              <Text variant="display" color="heroText" accessibilityRole="header">
                {profile.displayName
                  ? t("home.greetingWithName", {
                      greeting,
                      name: profile.displayName,
                    })
                  : greeting}
              </Text>
              <Text style={styles.heroLine}>
                {count === 0
                  ? t("home.prompt")
                  : count === 1
                    ? t("home.summary.one")
                    : t("home.summary.other", { count: formatNumber(count) })}
              </Text>
            </View>
            <CupMark size={92} />
          </View>

          <Button
            variant="hero"
            label={t("home.logAction")}
            onPress={() => router.push("/log")}
            style={styles.heroAction}
          />
        </View>
      </View>
    </View>
  );
}

// How far the album has come, and the way into it.
function AlbumCard() {
  const { entries } = useEntries();
  const album = useMemo(() => buildAlbum(entries), [entries]);
  const collected = collectedCount(album);

  const open = () => {
    saveDiaryView("album");
    router.navigate("/diary");
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card outline style={styles.albumCard}>
        <View style={styles.albumText}>
          <Text variant="subheading">{t("album.home.title")}</Text>
          <Text variant="small" color="textSecondary">
            {collected === 0
              ? t("album.home.empty")
              : t("album.home.progress", {
                  collected: formatNumber(collected),
                  total: formatNumber(album.length),
                })}
          </Text>
          <View style={styles.albumTrack}>
            <View
              style={[
                styles.albumFill,
                { width: `${(collected / album.length) * 100}%` },
              ]}
            />
          </View>
        </View>
        <Icon name="chevronRight" size={16} color="textMuted" />
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { entries, status, reload } = useEntries();
  const [refreshing, setRefreshing] = useState(false);

  useHeroStatusBar();

  // Once the hero has scrolled away, the strip behind the clock takes the
  // page's colour, so no band of tan is left floating over the list.
  const heroHeight = useRef(0);
  const [pastHero, setPastHero] = useState(false);
  const onScroll = (y: number) => {
    const past = heroHeight.current > 0 && y > heroHeight.current - insets.top;
    if (past === pastHero) return;
    setPastHero(past);
    if (isDarkHero()) setStatusBarStyle(past && !isDarkTheme() ? "dark" : "light");
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const [latest, ...rest] = entries;
  const earlier = rest.slice(0, EARLIER_COUNT);
  const favorites = entries
    .filter((entry) => entry.isFavorite)
    .slice(0, FAVORITES_COUNT);

  return (
    <View style={styles.root}>
      {/* Pulling the page down would otherwise open a pale gap above the tan.
          It lies behind the list, so the refresh spinner shows on top of it. */}
      <View style={styles.backdrop} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // The hero is tan to the very top, behind the status bar.
        contentInsetAdjustmentBehavior="never"
        onScroll={(event) => onScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            // Android's spinner drops in below the status bar. The iOS one
            // has no room of its own up there; the hero stands in for it.
            tintColor="transparent"
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
            progressViewOffset={insets.top}
          />
        }
      >
        <View
          onLayout={(event) => {
            heroHeight.current = event.nativeEvent.layout.height;
          }}
        >
          <Hero count={entries.length} refreshing={refreshing} />
        </View>

        {!latest ? (
          <View style={[contentColumn, styles.body]}>
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
              <Card style={styles.emptyCard}>
                <Text variant="title">{t("home.empty.title")}</Text>
                <Text color="textSecondary">{t("home.empty.body")}</Text>
              </Card>
            )}
          </View>
        ) : (
          <View style={[contentColumn, styles.body]}>
            <View>
              <SectionHeader
                large
                title={t("home.latest")}
                action={{
                  label: t("home.seeAll"),
                  onPress: () => router.navigate("/diary"),
                }}
              />
              <EntryCard flat entry={latest} />
            </View>

            <StreakCard entries={entries} />

            <AlbumCard />

            {favorites.length > 0 ? (
              <View>
                <SectionHeader
                  large
                  title={t("home.favorites")}
                  action={{
                    label: t("home.seeAll"),
                    onPress: () =>
                      router.push({
                        pathname: "/collection",
                        params: { kind: "favorites" },
                      }),
                  }}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={TILE_WIDTH + spacing.md}
                  decelerationRate="fast"
                  style={styles.shelf}
                  contentContainerStyle={styles.shelfContent}
                >
                  {favorites.map((entry) => (
                    <EntryTile key={entry.id} entry={entry} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {earlier.length > 0 ? (
              <View>
                <SectionHeader large title={t("home.earlier")} />
                {/* Straight on the page, split by hairlines, like a plain iOS list. */}
                <View>
                  {earlier.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      last={index === earlier.length - 1}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      {/* Keeps the clock and battery readable once content scrolls beneath them. */}
      <View style={[styles.statusBar, pastHero && styles.statusBarPage, { height: insets.top }]} />
    </View>
  );
}

const styles = themed(() => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.hero,
  },
  statusBarPage: {
    backgroundColor: colors.background,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: colors.hero,
  },
  content: {
    flexGrow: 1,
  },
  heroCorners: {
    backgroundColor: colors.background,
  },
  hero: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    backgroundColor: colors.hero,
    borderBottomLeftRadius: radii.frame + 6,
    borderBottomRightRadius: radii.frame + 6,
  },
  masthead: {
    // As tall as the spinner that takes the date's place during a reload.
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroLine: {
    color: colors.heroTextSecondary,
  },
  heroAction: {
    marginTop: spacing.xl,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl + 4,
    // Opaque down to the end of the page, to keep the tan behind it hidden.
    paddingBottom: spacing.xxxl,
    gap: spacing.xl + 4,
    backgroundColor: colors.background,
  },
  emptyCard: {
    gap: spacing.sm,
  },
  shelf: {
    marginHorizontal: -spacing.screen,
  },
  shelfContent: {
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  albumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  albumText: {
    flex: 1,
    gap: spacing.xs,
  },
  albumTrack: {
    height: 6,
    marginTop: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  albumFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
}));
