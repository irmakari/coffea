import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { t, type TranslationKey } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

const tabs: Record<string, { icon: IconName; label: TranslationKey }> = {
  index: { icon: 'home', label: 'tabs.home' },
  diary: { icon: 'diary', label: 'tabs.diary' },
  collections: { icon: 'collections', label: 'tabs.collections' },
  profile: { icon: 'profile', label: 'tabs.profile' },
};

// Logging is an action, not a destination, so it sits in the middle of the
// bar and opens a modal instead of switching tabs.
const LOG_ACTION_POSITION = 2;

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;

        const focused = state.index === index;
        const tint = focused ? 'text' : 'textMuted';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Fragment key={route.key}>
            {index === LOG_ACTION_POSITION ? <LogAction /> : null}
            <Pressable
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
          </Fragment>
        );
      })}
    </View>
  );
}

function LogAction() {
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('tabs.log')}
        onPress={() => router.push('/log')}
        hitSlop={spacing.sm}
        style={({ pressed }) => [styles.logAction, pressed && styles.logActionPressed]}
      >
        <Icon name="plus" size={22} color="textOnAccent" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    minHeight: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logAction: {
    width: sizes.touch,
    height: sizes.touch,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  logActionPressed: {
    backgroundColor: colors.accentPressed,
  },
});
