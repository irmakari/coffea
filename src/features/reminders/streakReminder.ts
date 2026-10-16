import 'expo-sqlite/localStorage/install';

import * as Notifications from 'expo-notifications';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { useEntries } from '@/features/entries/EntriesProvider';
import { startLog } from '@/features/entries/logDraft';
import type { Entry } from '@/features/entries/types';
import { coffeeLabel, favoriteOf, useChosenFavorite } from '@/features/profile/favoriteCoffee';
import { computeStreak } from '@/features/stats/stats';
import { t } from '@/i18n';

// A nudge in the evening on a day without a coffee, so a streak is not lost
// by forgetting to log one. Scheduled on the phone itself, a week ahead, and
// planned again whenever the journal changes: a day with a coffee is left
// out, so the reminder never arrives once today's cup is in.
//
// Kept on this phone, like the tab bar cup: reminders are about this device.
const KEY = 'coffea.streakReminder';
const ID_PREFIX = 'streak-reminder-';
const DAYS_AHEAD = 7;
const CHANNEL = 'streak';

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULTS: ReminderSettings = { enabled: false, hour: 20, minute: 0 };

function read(): ReminderSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (stored && typeof stored === 'object') return { ...DEFAULTS, ...stored };
  } catch {
    // A broken value falls back to the defaults.
  }
  return DEFAULTS;
}

let current = read();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useReminderSettings(): ReminderSettings {
  return useSyncExternalStore(subscribe, () => current);
}

export function saveReminderSettings(next: ReminderSettings) {
  current = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

// The reminder's time of day on today's date. A fixed old date would carry
// that year's time zone rules, an hour off in places that have changed them.
export function reminderTime(settings: ReminderSettings, now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), settings.hour, settings.minute);
}

// Shows a reminder that arrives while the app is open as a banner too.
export function setUpNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Asks once; afterwards answers from what the user chose in Settings.
export async function allowReminders(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 13 only shows the prompt once a channel exists.
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: t('reminder.channel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

async function cancelPlanned() {
  const planned = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    planned
      .filter((request) => request.identifier.startsWith(ID_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

// What a reminder says. It offers the favorite coffee by name when there is
// one, and names the streak when it is the one at stake tonight.
function reminderContent(favorite: string | null, streak: number): Notifications.NotificationContentInput {
  const coffee = favorite ? coffeeLabel(favorite) : null;
  const body =
    streak > 0
      ? coffee
        ? t('reminder.body.streakCoffee', { count: streak, coffee })
        : t('reminder.body.streak', { count: streak })
      : coffee
        ? t('reminder.body.coffee', { coffee })
        : t('reminder.body.plain');
  // Tapping it opens the log on that coffee, ready to save.
  return { title: t('reminder.title'), body, data: { kind: 'streak-reminder', drink: favorite } };
}

// Plans the coming week's reminders from the journal as it is now.
export async function planReminders(
  entries: Entry[],
  settings: ReminderSettings,
  favorite: string | null,
  now = new Date(),
) {
  await cancelPlanned();
  if (!settings.enabled) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const logged = new Set(entries.map((entry) => dayKey(new Date(entry.consumedAt))));
  const streak = computeStreak(entries, now);

  for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, settings.hour, settings.minute);
    if (at <= now || logged.has(dayKey(at))) continue;
    // Only tonight's streak is known; later days start from wherever it ends.
    await Notifications.scheduleNotificationAsync({
      identifier: `${ID_PREFIX}${dayKey(at)}`,
      content: reminderContent(favorite, offset === 0 ? streak.current : 0),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL,
      },
    });
  }
}

// One reminder a few seconds from now, worded as tonight's would be if no
// coffee had been logged yet, to see how it looks.
export async function sendTestReminder(entries: Entry[], favorite: string | null) {
  const streak = computeStreak(entries);
  // Counted as if today were still open, the way tonight's reminder sees it.
  const atStake = streak.loggedToday ? Math.max(streak.current, 1) : streak.current;
  await Notifications.scheduleNotificationAsync({
    content: reminderContent(favorite, atStake),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL,
    },
  });
}

// Keeps the planned reminders in step with the journal, the setting and
// the favorite. Signed out, none are left waiting.
export function useStreakReminders(signedIn: boolean) {
  const { entries, status } = useEntries();
  const settings = useReminderSettings();
  const picked = useChosenFavorite();
  useEffect(() => {
    if (!signedIn) {
      cancelPlanned().catch(() => {});
      return;
    }
    if (status !== 'ready') return;
    planReminders(entries, settings, favoriteOf(entries, picked)).catch(() => {});
  }, [signedIn, entries, status, settings, picked]);
}

function openFromReminder(response: Notifications.NotificationResponse | null) {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const data = response.notification.request.content.data;
  if (data?.kind !== 'streak-reminder') return;
  startLog({ drink: typeof data.drink === 'string' ? data.drink : undefined });
  Notifications.clearLastNotificationResponseAsync().catch(() => {});
}

// A tapped reminder opens the log on the favorite, whether the tap started
// the app or found it running. Mounted with the tabs, so the log is there.
export function useReminderTaps() {
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then(openFromReminder)
      .catch(() => {});
    const subscription = Notifications.addNotificationResponseReceivedListener(openFromReminder);
    return () => subscription.remove();
  }, []);
}
