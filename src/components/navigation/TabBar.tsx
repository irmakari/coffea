import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CupMark, Icon, Text, type IconName } from '@/components/ui';
import { QuickLogPicker } from '@/features/entries/QuickLogPicker';
import { useTabCup } from '@/features/profile/tabCup';
import { t, type TranslationKey } from '@/i18n';
import { colors, contentColumn, sizes, spacing } from '@/theme';

const tabs: Record<string, { icon: IconName; label: TranslationKey }> = {
  index: { icon: 'home', label: 'tabs.home' },
  diary: { icon: 'diary', label: 'tabs.diary' },
  collections: { icon: 'collections', label: 'tabs.collections' },
  profile: { icon: 'profile', label: 'tabs.profile' },
};

// Logging is the one thing the app is for, so its tab sits in the middle of
// the bar as the app's cup instead of an icon and a label.
const LOG_ROUTE = 'log';

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const cup = useTabCup();
  // A long press on the cup offers every coffee, drawn, to start a log from.
  const [picking, setPicking] = useState(false);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={[contentColumn, styles.items]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (route.name === LOG_ROUTE) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={t('tabs.log')}
                accessibilityHint={t('quickLog.hint')}
                onPress={onPress}
                onLongPress={() => setPicking(true)}
                delayLongPress={300}
                style={({ pressed }) => [styles.item, styles.log, pressed && styles.logPressed]}
              >
                <CupMark tan drink={cup} size={54} />
              </Pressable>
            );
          }

          const tab = tabs[route.name];
          if (!tab) return null;
          const tint = focused ? 'text' : 'textMuted';

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={t(tab.label)}
              onPress={onPress}
              style={styles.item}
            >
              <Icon name={tab.icon} size={22} color={tint} strokeWidth={focused ? 1.75 : 1.5} />
              <Text variant="caption" color={tint} maxFontSizeMultiplier={1.1}>
                {t(tab.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <QuickLogPicker
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={(drink) => {
          setPicking(false);
          // The time tells one pick from the next, so choosing the same
          // coffee twice fills the form in twice.
          router.navigate({ pathname: '/log', params: { drink, at: String(Date.now()) } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  items: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minHeight: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  // The cup is a little taller than a tab; this keeps the bar its height.
  log: {
    marginVertical: -3,
  },
  logPressed: {
    opacity: 0.7,
  },
});
