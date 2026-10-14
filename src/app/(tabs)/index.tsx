import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
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
import { useEntries } from "@/features/entries/EntriesProvider";
import { EntryCard, EntryRow, EntryTile } from "@/features/entries/EntryCard";
import { useProfile } from "@/features/profile/ProfileProvider";
import { formatDate, formatNumber, t, type TranslationKey } from "@/i18n";
import { colors, contentColumn, radii, spacing } from "@/theme";

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
    <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
      {/* Pulling the page down would otherwise open a pale gap above the tan. */}
      <View style={styles.heroOverscroll} />
      <View style={contentColumn}>
        <View style={styles.masthead}>
          <Text variant="subheading">{t("brand.name")}</Text>
          <Text variant="caption">{formatDate(now, "day")}</Text>
        </View>

        <View style={styles.heroBody}>
          <View style={styles.heroText}>
            <Text variant="display" accessibilityRole="header">
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
          label={t("home.logAction")}
          onPress={() => router.push("/log")}
          style={styles.heroAction}
        />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { entries, status, reload } = useEntries();

  const [latest, ...rest] = entries;
  const earlier = rest.slice(0, EARLIER_COUNT);
  const favorites = entries
    .filter((entry) => entry.isFavorite)
    .slice(0, FAVORITES_COUNT);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // The hero is tan to the very top, behind the status bar.
        contentInsetAdjustmentBehavior="never"
      >
        <Hero count={entries.length} />

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
              <SectionHeader title={t("home.latest")} />
              <EntryCard entry={latest} />
            </View>

            {favorites.length > 0 ? (
              <View>
                <SectionHeader title={t("home.favorites")} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
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
                <SectionHeader title={t("home.earlier")} />
                <Card style={styles.listCard}>
                  {earlier.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      last={index === earlier.length - 1}
                    />
                  ))}
                </Card>
                {rest.length > EARLIER_COUNT ? (
                  <Button
                    variant="quiet"
                    label={t("home.openDiary")}
                    onPress={() => router.navigate("/diary")}
                    style={styles.openDiary}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      {/* Keeps the clock and battery readable once content scrolls beneath them. */}
      <View style={[styles.statusBar, { height: insets.top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.highlight,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    backgroundColor: colors.highlight,
    borderBottomLeftRadius: radii.frame + 6,
    borderBottomRightRadius: radii.frame + 6,
  },
  heroOverscroll: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "100%",
    height: 600,
    backgroundColor: colors.highlight,
  },
  masthead: {
    flexDirection: "row",
    alignItems: "baseline",
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
    color: colors.accentPressed,
  },
  heroAction: {
    marginTop: spacing.xl,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl + 4,
    gap: spacing.xl + 4,
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
  listCard: {
    paddingVertical: spacing.xs,
  },
  openDiary: {
    marginTop: spacing.xs,
  },
});
