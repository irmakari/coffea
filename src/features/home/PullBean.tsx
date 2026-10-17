import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { tapFeedback } from '@/lib/haptics';
import { palette } from '@/theme';

// How far the page is pulled down for the bean to be whole.
const PULL_DISTANCE = 100;
const WIDTH = 30;
const HEIGHT = 39;

type PullBeanProps = {
  // The page's scroll position; below zero while it is pulled down.
  scrollY: SharedValue<number>;
  refreshing: boolean;
  // Keeps the bean out from under the clock and battery.
  topInset: number;
};

// The reload spinner: a coffee bean that grows into the gap as the page is
// pulled down, ticks once it is whole, and hops and turns while the journal
// reloads.
export function PullBean({ scrollY, refreshing, topInset }: PullBeanProps) {
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);
  const hop = useSharedValue(0);
  const busy = useSharedValue(0);

  useEffect(() => {
    if (refreshing) {
      busy.value = 1;
      if (reduceMotion) return;
      spin.value = withRepeat(withTiming(spin.value + 360, { duration: 800, easing: Easing.inOut(Easing.cubic) }), -1);
      hop.value = withRepeat(
        withSequence(withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })),
        -1,
      );
    } else {
      busy.value = 0;
      cancelAnimation(spin);
      cancelAnimation(hop);
      spin.value = withSpring(0);
      hop.value = withTiming(0, { duration: 150 });
    }
  }, [refreshing, reduceMotion, spin, hop, busy]);

  useAnimatedReaction(
    () => -scrollY.value >= PULL_DISTANCE,
    (whole, wasWhole) => {
      if (whole && wasWhole === false && busy.value === 0) scheduleOnRN(tapFeedback);
    },
  );

  const style = useAnimatedStyle(() => {
    const pulled = Math.max(0, -scrollY.value);
    const grown = busy.value === 1 ? 1 : Math.min(1, pulled / PULL_DISTANCE);
    // Sits in the middle of the gap the pull opens, below the status bar.
    const centre = Math.max(topInset + HEIGHT / 2 + 4, pulled / 2);
    return {
      opacity: grown < 0.15 ? grown / 0.15 : 1,
      transform: [
        { translateY: centre - HEIGHT / 2 - hop.value * 8 },
        { rotate: `${(reduceMotion ? 0 : grown * 200) + spin.value}deg` },
        { scale: 0.3 + grown * 0.7 },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, alignSelf: 'center' }, style]}>
      <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 14 18">
        <Ellipse cx={7} cy={9} rx={6.2} ry={8.2} fill={palette.darkRoast} />
        <Ellipse cx={5} cy={6.5} rx={1.6} ry={3} fill={palette.mocha} opacity={0.55} />
        <Path d="M7 1.5 C 4.2 6, 9.8 12, 7 16.5" stroke={palette.espresso} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
