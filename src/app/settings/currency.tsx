import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconButton, Screen, ScreenHeader, Text } from '@/components/ui';
import { currencies } from '@/features/profile/currencies';
import { useProfile } from '@/features/profile/ProfileProvider';
import { t } from '@/i18n';
import { colors, sizes, spacing } from '@/theme';

export default function CurrencyScreen() {
  const { profile, setPreferredCurrency } = useProfile();
  const [failure, setFailure] = useState<string | null>(null);

  const choose = async (code: string) => {
    setFailure(null);
    try {
      await setPreferredCurrency(code);
    } catch {
      setFailure(t('settings.currency.error'));
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.back}>
        <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
      </View>
      <ScreenHeader title={t('settings.currency.title')} subtitle={t('settings.currency.body')} />

      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite" style={styles.failure}>
          {failure}
        </Text>
      ) : null}

      <View style={styles.rows}>
        {currencies.map((code) => {
          const selected = profile.preferredCurrency === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => choose(code)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowText}>
                <Text variant={selected ? 'bodyStrong' : 'body'}>{t(`currencies.${code}`)}</Text>
                <Text variant="caption" color="textMuted">
                  {code}
                </Text>
              </View>
              {selected ? <Icon name="check" size={20} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    marginBottom: spacing.lg,
  },
  failure: {
    marginTop: spacing.lg,
  },
  rows: {
    marginTop: spacing.xxl,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  rowText: {
    gap: 2,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
