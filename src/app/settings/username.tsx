import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscardGuard } from '@/components/navigation/useDiscardGuard';
import { Button, KeyboardAvoider, ModalHeader, Screen, Text, TextField } from '@/components/ui';
import { isValidUsername, normalizeUsername, USERNAME_MAX } from '@/features/friends/username';
import { UsernameTakenError, useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { spacing } from '@/theme';

export default function UsernameScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setUsername } = useProfile();
  const [initial] = useState(profile.username ?? '');
  const [value, setValue] = useState(initial);
  const username = normalizeUsername(value);
  const leave = useDiscardGuard(username !== initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (username === initial) {
      router.back();
      return;
    }
    if (!isValidUsername(username)) {
      setError(t('settings.username.invalid'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setUsername(username);
      leave();
      router.back();
    } catch (failure) {
      setError(t(failure instanceof UsernameTakenError ? 'settings.username.taken' : 'settings.username.error'));
      setSaving(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t('settings.username.title')} />
      <KeyboardAvoider>
        <View style={styles.content}>
          <TextField
            label={t('settings.username.label')}
            placeholder={t('settings.username.placeholder')}
            value={value}
            // Shown as it will be saved, so there are no surprises.
            onChangeText={(text) => {
              setValue(normalizeUsername(text));
              setError(null);
            }}
            error={error ?? undefined}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username-new"
            textContentType="username"
            autoFocus
            // Leaves room for a pasted "@".
            maxLength={USERNAME_MAX + 1}
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <Text variant="small" color="textSecondary">
            {t('settings.username.hint')}
          </Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button label={t('settings.username.save')} loading={saving} onPress={save} />
        </View>
      </KeyboardAvoider>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.screen,
  },
});
