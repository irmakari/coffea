import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CupMark, Icon, Text, type IconName } from '@/components/ui';
import { startLog } from '@/features/entries/logDraft';
import { QuickLogPicker } from '@/features/entries/QuickLogPicker';
import { markQuickLogTipSeen, quickLogTipSeen } from '@/features/entries/quickLogTip';
import { useTabCup } from '@/features/profile/tabCup';
import { t, type TranslationKey } from '@/i18n';
import { colors, contentColumn, radii, sizes, spacing } from '@/theme';

const tabs: Record<string, { icon: IconName; label: TranslationKey }> = {
  index: { icon: 'home', label: 'tabs.home' },
  diary: { icon: 'diary', label: 'tabs.diary' },
  collections: { icon: 'collections', label: 'tabs.collections' },
  profile: { icon: 'profile', label: 'tabs.profile' },
};

// Logging is the one thing the app is for, so its tab sits in the middle of
// the bar as the app's cup instead of an icon and a label.
const LOG_ROUTE = 'log';

// How far the tip's tail shows below its bubble.
const TIP_TAIL = 5;

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const cup = useTabCup();
  // A long press on the cup offers every coffee, drawn, to start a log from.
  const [picking, setPicking] = useState(false);
  // Shown until the cup has been tapped or held once, or the tip itself.
  const [tip, setTip] = useState(() => !quickLogTipSeen());
  const dismissTip = () => {
    if (!tip) return;
    setTip(false);
    markQuickLogTipSeen();
  };
  const onLog = state.routes[state.index]?.name === LOG_ROUTE;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {/* Kept off the log tab, where it would sit on the save button. */}
      {tip && !onLog ? (
        <Pressable accessibilityRole="button" onPress={dismissTip} style={styles.tip}>
          <View style={styles.tipBubble}>
            <Text variant="label" color="textOnAccent">
              {t('quickLog.tip')}
            </Text>
          </View>
          <View style={styles.tipTail} />
        </Pressable>
      ) : null}
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
                onPress={() => {
                  dismissTip();
                  onPress();
                }}
                onLongPress={() => {
                  dismissTip();
                  setPicking(true);
                }}
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
        onPick={(drink) => startLog({ drink }, () => setPicking(false))}
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
  // Floats just above the bar, pointing down at the cup.
  tip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -(sizes.chip + TIP_TAIL + spacing.xs),
    alignItems: 'center',
  },
  tipBubble: {
    height: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  tipTail: {
    width: 12,
    height: 12,
    marginTop: TIP_TAIL - 12,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
});
