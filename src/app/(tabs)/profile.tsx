import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Avatar,
  Button,
  Card,
  ListRow,
  Screen,
  SectionHeader,
  Text,
} from "@/components/ui";
import { signOut } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/AuthProvider";
import { pickPhoto } from "@/features/entries/pickPhoto";
import { useProfile } from "@/features/profile/ProfileProvider";
import { t } from "@/i18n";
import { spacing } from "@/theme";

export default function ProfileScreen() {
  const { session } = useAuth();
  const { profile, setAvatar } = useProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const version = Constants.expoConfig?.version;
  const email = session?.user.email;

  const changePhoto = async () => {
    setFailure(null);
    try {
      const picked = await pickPhoto();
      if (picked) await setAvatar(picked);
    } catch {
      setFailure(t("profile.photoError"));
    }
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

  return (
    <Screen scroll>
      <View style={styles.identity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("profile.changePhoto")}
          onPress={changePhoto}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Avatar
            uri={profile.avatarUrl}
            cacheKey={profile.avatarPath}
            name={profile.displayName}
            size={84}
          />
        </Pressable>
        <View style={styles.identityText}>
          <Text variant="title" accessibilityRole="header" numberOfLines={2}>
            {profile.displayName ?? t("profile.title")}
          </Text>
          {email ? (
            <Text variant="small" color="textSecondary" numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
      </View>

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
        <Card style={styles.rows}>
          <View style={styles.rowsInner}>
            <ListRow
              label={t("profile.stats")}
              onPress={() => router.push("/stats")}
            />
            <ListRow
              label={t("profile.currency")}
              value={profile.preferredCurrency}
              onPress={() => router.push("/settings/currency")}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("profile.account")} />
        <Card style={styles.rows}>
          <View style={styles.rowsInner}>
            <ListRow
              label={t("profile.name")}
              value={profile.displayName ?? undefined}
              onPress={() => router.push("/settings/name")}
            />
            <ListRow label={t("profile.photo")} onPress={changePhoto} />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("profile.about")} />
        <Card style={styles.rows}>
          <View style={styles.rowsInner}>
            <ListRow
              label={t("brand.name")}
              value={version ? `${t("profile.version")} ${version}` : undefined}
            />
          </View>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label={t("auth.signOut")}
          loading={signingOut}
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  failure: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xxl,
  },
  // The last row's divider is tucked under the card's edge.
  rows: {
    paddingVertical: 0,
    paddingBottom: 0,
  },
  rowsInner: {
    marginBottom: -1,
  },
  actions: {
    marginTop: spacing.xxxl,
  },
});
