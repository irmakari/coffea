import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { BucketListProvider } from '@/features/bucketList/BucketListProvider';
import { EntriesProvider } from '@/features/entries/EntriesProvider';
import { ProfileProvider } from '@/features/profile/ProfileProvider';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <EntriesProvider>
        <BucketListProvider>
          <ProfileProvider>
            <RootNavigator />
          </ProfileProvider>
        </BucketListProvider>
      </EntriesProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { session, loading } = useAuth();
  // The splash screen stays up until we know which side of sign-in to show.
  const ready = (fontsLoaded || !!fontError) && !loading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = session !== null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="log" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entry/[id]/index" />
          <Stack.Screen name="entry/[id]/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entry/[id]/share" options={{ presentation: 'modal' }} />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="settings/currency" />
          <Stack.Screen name="settings/name" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bucket-list/index" />
          <Stack.Screen name="bucket-list/item" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
