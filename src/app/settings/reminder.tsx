import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Linking, Switch, View } from 'react-native';

import { Button, PageHeader, Screen, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { useFavoriteCoffee } from '@/features/profile/favoriteCoffee';
import {
  allowReminders,
  reminderTime,
  saveReminderSettings,
  sendTestReminder,
  useReminderSettings,
} from '@/features/reminders/streakReminder';
import { formatDate, t } from '@/i18n';
import { colors, isDarkTheme, sizes, spacing, themed } from '@/theme';

export default function ReminderScreen() {
  const settings = useReminderSettings();
  // Set when the phone's settings have notifications for Coffea turned off.
  const [denied, setDenied] = useState(false);
  const time = reminderTime(settings);
  const { entries } = useEntries();
  const favorite = useFavoriteCoffee();
  const [testSent, setTestSent] = useState(false);

  const test = async () => {
    await sendTestReminder(entries, favorite).catch(() => {});
    setTestSent(true);
  };

  const toggle = async (enabled: boolean) => {
    if (!enabled) {
      setDenied(false);
      saveReminderSettings({ ...settings, enabled: false });
      return;
    }
    const allowed = await allowReminders().catch(() => false);
    setDenied(!allowed);
    if (allowed) saveReminderSettings({ ...settings, enabled: true });
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('reminder.settings.title')} subtitle={t('reminder.settings.body')} />

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text variant="bodyStrong">{t('reminder.settings.toggle')}</Text>
          <Text variant="small" color="textSecondary">
            {t('reminder.settings.toggleBody')}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t('reminder.settings.toggle')}
          value={settings.enabled}
          onValueChange={toggle}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      </View>

      {denied ? (
        <View style={styles.denied}>
          <Text color="textSecondary">{t('reminder.settings.denied')}</Text>
          <Button
            variant="secondary"
            label={t('reminder.settings.openSettings')}
            onPress={() => Linking.openSettings()}
          />
        </View>
      ) : null}

      {settings.enabled ? (
        <View style={styles.time}>
          <View style={styles.timeHeader}>
            <Text variant="label" color="textSecondary">
              {t('reminder.settings.time')}
            </Text>
            <Text variant="label">{formatDate(time, 'time')}</Text>
          </View>
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            minuteInterval={15}
            textColor={colors.text}
            themeVariant={isDarkTheme() ? 'dark' : 'light'}
            onValueChange={(_event, picked) =>
              saveReminderSettings({ ...settings, hour: picked.getHours(), minute: picked.getMinutes() })
            }
          />
          <Button variant="secondary" label={t('reminder.settings.test')} onPress={test} />
          {testSent ? (
            <Text variant="small" color="textSecondary" align="center" accessibilityLiveRegion="polite">
              {t('reminder.settings.testSent')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = themed(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  denied: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  time: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}));
