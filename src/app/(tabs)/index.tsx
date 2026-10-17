import { router } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  Card,
  CupMark,
  EmptyState,
  LoadingState,
  SectionHeader,
  Text,
} from "@/components/ui";
import { AlbumGlance } from "@/features/album/AlbumGlance";
import { useEntries } from "@/features/entries/EntriesProvider";
import {
  EntryRow,
  EntryTile,
  TILE_WIDTH,
} from "@/features/entries/EntryCard";
import { PullBean } from "@/features/home/PullBean";
import { TodayInvite } from "@/features/home/TodayInvite";
import { CaffeineCard } from "@/features/stats/CaffeineCard";
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
function Hero({ count }: { count: number }) {
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
            <Text variant="caption" color="heroText">
              {formatDate(now, "day")}
            </Text>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroText}>
              {/* The greeting keeps to one line, shrinking a little where it
                  must, and the name sits under it, so "Good afternoon" is
                  never split. */}
              <View accessible accessibilityRole="header">
                <Text
                  variant="display"
                  color="heroText"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {profile.displayName ? `${greeting},` : greeting}
                </Text>
                {profile.displayName ? (
                  <Text variant="display" color="heroText" numberOfLines={1}>
                    {profile.displayName}
                  </Text>
                ) : null}
              </View>
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { entries, status, reload } = useEntries();
  const [refreshing, setRefreshing] = useState(false);

  useHeroStatusBar();

  // Once the hero has scrolled away, the strip behind the clock takes the
  // page's colour, so no band of tan is left floating over the list.
  const heroHeight = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const [pastHero, setPastHero] = useState(false);
  const onPastHero = (past: boolean) => {
    setPastHero(past);
    if (isDarkHero()) setStatusBarStyle(past && !isDarkTheme() ? "dark" : "light");
  };
  const topInset = insets.top;
  useAnimatedReaction(
    () => heroHeight.value > 0 && scrollY.value > heroHeight.value - topInset,
    (past, wasPast) => {
      if (wasPast !== null && past !== wasPast) scheduleOnRN(onPastHero, past);
    },
  );
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const [latest] = entries;
  // Today's coffees lead the page; the ones before them follow as earlier.
  const now = new Date();
  const today = entries.filter((entry) => {
    const at = new Date(entry.consumedAt);
    return (
      at.getFullYear() === now.getFullYear() &&
      at.getMonth() === now.getMonth() &&
      at.getDate() === now.getDate()
    );
  });
  const earlier = entries.slice(today.length, today.length + EARLIER_COUNT);
  const favorites = entries
    .filter((entry) => entry.isFavorite)
    .slice(0, FAVORITES_COUNT);

  return (
    <View style={styles.root}>
      {/* Pulling the page down would otherwise open a pale gap above the tan.
          It lies behind the list, so the refresh spinner shows on top of it. */}
      <View style={styles.backdrop} />
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // The hero is tan to the very top, behind the status bar.
        contentInsetAdjustmentBehavior="never"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
            heroHeight.value = event.nativeEvent.layout.height;
          }}
        >
          <Hero count={entries.length} />
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
                title={t("home.today.title")}
                action={{
                  label: t("home.seeAll"),
                  onPress: () => router.navigate("/diary"),
                }}
              />
              {/* A plain list, like Earlier below it, with each coffee's time. */}
              {today.length > 0 ? (
                <View>
                  {today.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      time
                      last={index === today.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <TodayInvite />
              )}
            </View>

            <CaffeineCard entries={entries} />

            <StreakCard entries={entries} />

            <AlbumGlance />

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
      </Animated.ScrollView>
      {/* iOS would spin behind the status bar, which the hero runs under,
          so a bean in the gap the pull opens shows the reload instead. */}
      <PullBean scrollY={scrollY} refreshing={refreshing} topInset={insets.top} />
      {/* Keeps the clock and battery readable once content scrolls beneath them. */}
      <View style={[styles.statusBar, pastHero && styles.statusBarPage, { height: insets.top }]} />
    </View>
  );
}

// Home sits a little wider than other pages, so its cards and photos get
// more of the screen.
const GUTTER = spacing.lg;

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
    paddingHorizontal: GUTTER,
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
    paddingHorizontal: GUTTER,
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
    marginHorizontal: -GUTTER,
  },
  shelfContent: {
    paddingHorizontal: GUTTER,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
}));
