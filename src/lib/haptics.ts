import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Small physical answers to a touch. They are never waited for and never
// allowed to fail what they accompany: a phone with haptics off, or without
// any, simply stays still. Android has its own set, which needs no
// permission and feels closer to the system's.

// For a toggle or a pick: a heart, a tick, a star.
export function tapFeedback() {
  const feedback =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  feedback.catch(() => {});
}

// For something that has been saved.
export function successFeedback() {
  const feedback =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  feedback.catch(() => {});
}
