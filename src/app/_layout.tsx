import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { NewCardHost } from '@/features/album/NewCardReveal';
import { CelebrationHost } from '@/features/celebrate/Celebration';
import { BucketListProvider } from '@/features/bucketList/BucketListProvider';
import { EntriesProvider } from '@/features/entries/EntriesProvider';
import { FriendsProvider } from '@/features/friends/FriendsProvider';
import { useStickerSharing } from '@/features/friends/stickerSharing';
import { ProfileProvider } from '@/features/profile/ProfileProvider';
import { setUpNotifications, useStreakReminders } from '@/features/reminders/streakReminder';
import { useTheme } from '@/features/theme/theme';
import { colors, fontAssets, isDarkTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
setUpNotifications();

// A page opened from a link, such as an invite, has the tabs beneath it, so
// closing it lands somewhere instead of nowhere.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <EntriesProvider>
        <BucketListProvider>
          <ProfileProvider>
            <FriendsProvider>
              <RootNavigator />
            </FriendsProvider>
          </ProfileProvider>
        </BucketListProvider>
      </EntriesProvider>
    </AuthProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { session, loading } = useAuth();
  const theme = useTheme();
  useStreakReminders(session !== null);
  useStickerSharing();
  // The splash screen stays up until we know which side of sign-in to show.
  const ready = (fontsLoaded || !!fontError) && !loading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = session !== null;

  return (
    // Styles are read as screens draw, so a new theme redraws every screen.
    <Fragment key={theme}>
      <StatusBar style={isDarkTheme() ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="entry/[id]/index" />
          <Stack.Screen name="entry/[id]/edit" />
          <Stack.Screen name="entry/[id]/share" options={{ presentation: 'modal' }} />
          <Stack.Screen name="collections" />
          <Stack.Screen name="collection" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="wheel" />
          <Stack.Screen name="year" />
          <Stack.Screen name="search" />
          <Stack.Screen name="settings/currency" />
          <Stack.Screen name="settings/cup" />
          <Stack.Screen name="settings/theme" />
          <Stack.Screen name="settings/reminder" />
          <Stack.Screen name="settings/favorite" />
          <Stack.Screen name="settings/name" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/username" options={{ presentation: 'modal' }} />
          <Stack.Screen name="friends/manage" />
          <Stack.Screen name="friends/add" />
          <Stack.Screen name="friends/blocked" />
          <Stack.Screen name="friends/[id]" />
          <Stack.Screen name="add/[username]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bucket-list/index" />
          <Stack.Screen name="fortune/[id]" />
          <Stack.Screen name="bucket-list/item" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <CelebrationHost />
      <NewCardHost />
      <AlertHost />
    </Fragment>
  );
}
