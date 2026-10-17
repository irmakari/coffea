import type { MaterialTopTabNavigationEventMap } from 'expo-router/js-top-tabs';
import type { NavigationHelpers, ParamListBase, TabNavigationState } from 'expo-router/react-navigation';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CupMark, Icon, Text, type IconName } from '@/components/ui';
import { coffeeName } from '@/features/album/FriendsAlbum';
import { DrinkArc, pointedAt } from '@/features/entries/DrinkArc';
import { useEntries } from '@/features/entries/EntriesProvider';
import { startLog } from '@/features/entries/logDraft';
import { coffeeTypes } from '@/features/entries/types';
import { QuickLogPicker } from '@/features/entries/QuickLogPicker';
import { markQuickLogTipSeen, quickLogTipSeen } from '@/features/entries/quickLogTip';
import { useTabCup } from '@/features/profile/tabCup';
import { t, type TranslationKey } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';
import { colors, contentColumn, radii, sizes, spacing, themed } from '@/theme';

const tabs: Record<string, { icon: IconName; label: TranslationKey }> = {
  index: { icon: 'home', label: 'tabs.home' },
  diary: { icon: 'diary', label: 'tabs.diary' },
  friends: { icon: 'friends', label: 'tabs.friends' },
  profile: { icon: 'profile', label: 'tabs.profile' },
};

// Logging is the one thing the app is for, so its tab sits in the middle of
// the bar as the app's cup instead of an icon and a label.
const LOG_ROUTE = 'log';

// How many drinks fan out over the cup when it is held and dragged.
const ARC_DRINKS = 7;

// The drinks most logged, then the usual ones, for the arc over the cup.
function useArcDrinks() {
  const { entries } = useEntries();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.type && entry.type !== 'other') counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([type]) => type);
    const usual = coffeeTypes.filter((type) => type !== 'other' && !ranked.includes(type));
    return [...ranked, ...usual].slice(0, ARC_DRINKS);
  }, [entries]);
}

// How far the tip's tail shows below its bubble.
const TIP_TAIL = 5;

// The pager's own type for these props is loose, hence the two it is used for.
export type TabBarProps = {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap>;
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
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

  // Holding the cup fans the drinks out over it. Dragging onto one and
  // letting go starts a log of it; letting go without dragging opens the
  // full list, as a plain long press always has.
  const drinks = useArcDrinks();
  const arcOpen = useSharedValue(0);
  const pointed = useSharedValue(-1);
  const travelled = useSharedValue(0);
  const [label, setLabel] = useState<string | null>(null);
  const point = (index: number) => {
    setLabel(index >= 0 ? coffeeName(drinks[index]) : null);
    if (index >= 0) tapFeedback();
  };
  const hold = () => {
    dismissTip();
    tapFeedback();
  };
  const release = (index: number, moved: number) => {
    setLabel(null);
    if (index >= 0) startLog({ drink: drinks[index] });
    else if (moved < 24) setPicking(true);
  };
  const logRoute = state.routes.find((route) => route.name === LOG_ROUTE);
  const openLog = () => {
    dismissTip();
    if (!logRoute) return;
    const event = navigation.emit({ type: 'tabPress', target: logRoute.key, canPreventDefault: true });
    if (!onLog && !event.defaultPrevented) navigation.navigate(logRoute.name, logRoute.params);
  };
  const cupGesture = Gesture.Exclusive(
    Gesture.Pan()
      .activateAfterLongPress(280)
      .onStart(() => {
        pointed.set(-1);
        travelled.set(0);
        arcOpen.set(withSpring(1, { damping: 16, stiffness: 180 }));
        scheduleOnRN(hold);
      })
      .onUpdate((event) => {
        travelled.set(Math.max(travelled.value, Math.hypot(event.translationX, event.translationY)));
        const index = pointedAt(event.translationX, event.translationY, drinks.length);
        if (index !== pointed.value) {
          pointed.set(index);
          scheduleOnRN(point, index);
        }
      })
      .onEnd(() => {
        scheduleOnRN(release, pointed.value, travelled.value);
      })
      .onFinalize(() => {
        arcOpen.set(withTiming(0, { duration: 180 }));
        pointed.set(-1);
      }),
    Gesture.Tap()
      .maxDuration(270)
      .onEnd(() => {
        scheduleOnRN(openLog);
      }),
  );

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
              <GestureDetector key={route.key} gesture={cupGesture}>
                <View
                  accessible
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={t('tabs.log')}
                  accessibilityHint={t('quickLog.hint')}
                  accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
                  onAccessibilityAction={(event) => {
                    dismissTip();
                    if (event.nativeEvent.actionName === 'longpress') setPicking(true);
                    else onPress();
                  }}
                  style={[styles.item, styles.log]}
                >
                  <CupMark tan drink={cup} size={54} />
                  <DrinkArc drinks={drinks} open={arcOpen} selected={pointed} label={label} />
                </View>
              </GestureDetector>
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

const styles = themed(() => ({
  bar: {
    paddingTop: spacing.md,
    // The page's own cream, so the bar reads as the end of the page; the
    // hairline marks where it starts.
    backgroundColor: colors.background,
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
    // Above the tabs after it, so the veil of its drink arc covers them too.
    zIndex: 10,
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
}));
