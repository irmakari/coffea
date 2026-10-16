import { TopTabs } from 'expo-router/js-top-tabs';

import { TabBar, type TabBarProps } from '@/components/navigation/TabBar';
import { useReminderTaps } from '@/features/reminders/streakReminder';
import { colors } from '@/theme';

// A pager under the bar rather than plain tabs, so the tabs can also be
// swiped between, side to side, the way they are on Instagram.
export default function TabsLayout() {
  useReminderTaps();
  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={(props: TabBarProps) => <TabBar {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        // A tap still jumps straight to its tab; only a swipe slides.
        animationEnabled: false,
        // Mounted as they are first reached, plus the tabs either side, so
        // there is a page waiting under a swipe.
        lazy: true,
        lazyPreloadDistance: 1,
      }}
    >
      <TopTabs.Screen name="index" />
      <TopTabs.Screen name="diary" />
      <TopTabs.Screen name="log" />
      <TopTabs.Screen name="friends" />
      <TopTabs.Screen name="profile" />
    </TopTabs>
  );
}
