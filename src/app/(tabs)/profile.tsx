import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  Avatar,
  Button,
  ListRow,
  Screen,
  SectionHeader,
  Text,
} from "@/components/ui";
import { deleteAccount, signOut } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildAlbum, collectedCount } from "@/features/album/album";
import { askPhotoSource } from "@/features/entries/askPhotoSource";
import { useEntries } from "@/features/entries/EntriesProvider";
import {
  CameraDeniedError,
  pickPhoto,
  type PhotoSource,
} from "@/features/entries/pickPhoto";
import { isCoffeeType } from "@/features/entries/types";
import { computeStreak } from "@/features/stats/stats";
import { AVATAR_SIZE, useProfile } from "@/features/profile/ProfileProvider";
import { useTabCup } from "@/features/profile/tabCup";
import { reminderTime, useReminderSettings } from "@/features/reminders/streakReminder";
import { useTheme } from "@/features/theme/theme";
import { currencyLabel, formatDate, formatNumber, t } from "@/i18n";
import { colors, radii, sizes, spacing, themed } from "@/theme";

export default function ProfileScreen() {
  const { session } = useAuth();
  const { profile, setAvatar, removeAvatar } = useProfile();
  const cup = useTabCup();
  const { entries } = useEntries();
  const streak = computeStreak(entries);
  const album = buildAlbum(entries);
  const theme = useTheme();
  const reminder = useReminderSettings();
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const version = Constants.expoConfig?.version;
  const email = session?.user.email;

  // From choosing a photo until it has been stored, or taken away.
  const [photoBusy, setPhotoBusy] = useState(false);

  const pickAvatar = async (source: PhotoSource) => {
    setFailure(null);
    setPhotoBusy(true);
    try {
      const picked = await pickPhoto(AVATAR_SIZE, source);
      if (picked) await setAvatar(picked);
    } catch (error) {
      setFailure(
        t(
          error instanceof CameraDeniedError
            ? "entry.photo.cameraDenied"
            : "profile.photoError",
        ),
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const clearAvatar = async () => {
    setFailure(null);
    setPhotoBusy(true);
    try {
      await removeAvatar();
    } catch {
      setFailure(t("profile.photoError"));
    } finally {
      setPhotoBusy(false);
    }
  };

  const changePhoto = () => {
    if (photoBusy) return;
    askPhotoSource(
      t("profile.changePhoto"),
      pickAvatar,
      profile.avatarPath ? clearAvatar : undefined,
    );
  };

  const handleSignOut = async () => {
    setFailure(null);
    setSigningOut(true);
    const result = await signOut();
    // On success this screen is replaced by sign-in, so only failure resets.
    if (!result.ok) {
      setFailure(t(result.message));
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(t("profile.signOut.title"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("auth.signOut"), onPress: handleSignOut },
    ]);
  };

  const handleDelete = async () => {
    const userId = session?.user.id;
    if (!userId) return;
    setFailure(null);
    setDeleting(true);
    const result = await deleteAccount(userId);
    // On success this screen is replaced by sign-in, as with signing out.
    if (!result.ok) {
      setFailure(t(result.message));
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t("profile.delete.title"), t("profile.delete.body"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.delete.confirm"),
        style: "destructive",
        onPress: handleDelete,
      },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.identity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("profile.changePhoto")}
          accessibilityState={{ busy: photoBusy }}
          onPress={changePhoto}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View style={photoBusy && styles.avatarBusy}>
            <Avatar
              uri={profile.avatarUrl}
              cacheKey={profile.avatarPath}
              name={profile.displayName}
              size={84}
            />
          </View>
          {photoBusy ? (
            <View style={styles.avatarSpinner}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : null}
        </Pressable>
        <View style={styles.identityText}>
          <Text variant="title" accessibilityRole="header" numberOfLines={2}>
            {profile.displayName ?? t("profile.title")}
          </Text>
          {profile.username ? (
            <Text variant="small" color="textSecondary" numberOfLines={1}>
              @{profile.username}
            </Text>
          ) : null}
          {email ? (
            <Text variant="small" color="textSecondary" numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      {/* The journal at a glance, the way a friend's page shows them. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("profile.stats")}
        onPress={() => router.push("/stats")}
        style={({ pressed }) => [styles.summary, pressed && styles.pressed]}
      >
        {[
          { value: formatNumber(entries.length), label: t("profile.summary.coffees") },
          { value: formatNumber(streak.current), label: t("profile.summary.streak") },
          {
            value: `${formatNumber(collectedCount(album))}/${formatNumber(album.length)}`,
            label: t("profile.summary.album"),
          },
        ].map((stat, index) => (
          <View key={stat.label} style={[styles.stat, index > 0 && styles.statDivided]}>
            <Text variant="heading">{stat.value}</Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
        ))}
      </Pressable>

      {failure ? (
        <Text
          variant="small"
          color="danger"
          accessibilityLiveRegion="polite"
          style={styles.failure}
        >
          {failure}
        </Text>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t("profile.journal")} />
        <View style={styles.rows}>
          <View style={styles.rowsInner}>
            <ListRow
              label={t("profile.collections")}
              onPress={() => router.push("/collections")}
            />
            <ListRow
              label={t("profile.stats")}
              onPress={() => router.push("/stats")}
            />
            <ListRow
              label={t("profile.wheel")}
              onPress={() => router.push("/wheel")}
            />
            <ListRow
              label={t("profile.reminder")}
              value={
                reminder.enabled
                  ? formatDate(reminderTime(reminder), "time")
                  : t("profile.reminderOff")
              }
              onPress={() => router.push("/settings/reminder")}
            />
            <ListRow
              label={t("profile.currency")}
              value={currencyLabel(profile.preferredCurrency)}
              onPress={() => router.push("/settings/currency")}
            />
            <ListRow
              label={t("profile.cup")}
              value={
                isCoffeeType(cup)
                  ? t(`coffeeTypes.${cup}`)
                  : t("settings.cup.classic")
              }
              onPress={() => router.push("/settings/cup")}
            />
            <ListRow
              label={t("profile.theme")}
              value={t(`settings.theme.names.${theme}`)}
              onPress={() => router.push("/settings/theme")}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("profile.account")} />
        <View style={styles.rows}>
          <View style={styles.rowsInner}>
            <ListRow
              label={t("profile.name")}
              value={profile.displayName ?? undefined}
              onPress={() => router.push("/settings/name")}
            />
            <ListRow
              label={t("profile.username")}
              value={profile.username ? `@${profile.username}` : undefined}
              onPress={() => router.push("/settings/username")}
            />
            <ListRow label={t("profile.photo")} onPress={changePhoto} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("profile.about")} />
        <View style={styles.rows}>
          <View style={styles.rowsInner}>
            <ListRow
              label={t("brand.name")}
              value={version ? `${t("profile.version")} ${version}` : undefined}
            />
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label={t("auth.signOut")}
          loading={signingOut}
          disabled={deleting}
          onPress={confirmSignOut}
        />
        <Button
          variant="quiet"
          label={t("profile.delete.action")}
          loading={deleting}
          disabled={signingOut}
          onPress={confirmDelete}
        />
      </View>
    </Screen>
  );
}

const styles = themed(() => ({
  summary: {
    flexDirection: "row",
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: "continuous",
    borderWidth: sizes.hairline,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivided: {
    borderLeftWidth: sizes.hairline,
    borderLeftColor: colors.border,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  identityText: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  avatarBusy: {
    opacity: 0.4,
  },
  avatarSpinner: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  failure: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xxl,
  },
  // Straight on the page, split by hairlines. The last row's divider is
  // tucked away, so a group ends without a line under it.
  rows: {
    overflow: "hidden",
  },
  rowsInner: {
    marginBottom: -1,
  },
  actions: {
    marginTop: spacing.xxxl,
    gap: spacing.sm,
  },
}));
