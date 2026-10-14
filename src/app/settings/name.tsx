import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, KeyboardAvoider, ModalHeader, Screen, Text, TextField } from '@/components/ui';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { spacing } from '@/theme';

export default function NameScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setDisplayName } = useProfile();
  const [name, setName] = useState(profile.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await setDisplayName(name);
      router.back();
    } catch {
      setError(t('settings.name.error'));
      setSaving(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t('settings.name.title')} />
      <KeyboardAvoider>
        <View style={styles.content}>
          <TextField
            label={t('auth.name.label')}
            placeholder={t('auth.name.placeholder')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={save}
          />
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {error ? (
            <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button label={t('settings.name.save')} loading={saving} onPress={save} />
        </View>
      </KeyboardAvoider>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
  },
});
