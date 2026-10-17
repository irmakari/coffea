import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { CupMark, Text } from '@/components/ui';
import { tapFeedback } from '@/lib/haptics';
import { colors, palette, spacing, themed, withAlpha } from '@/theme';

export type Celebration = {
  // What was drunk, drawn as the cup at the middle.
  drink: string | null;
  title: string;
  line?: string;
};

let present: ((celebration: Celebration) => void) | null = null;

// A moment of applause for something just done, over whatever page is
// underneath. It clears itself, or at a tap.
export function celebrate(celebration: Celebration) {
  present?.(celebration);
}

const CUP = 150;
const HOLD = 1500;
const BEANS = 12;
const RIPPLES = 3;

// Each bean's flight, fixed for the session so the burst is never lopsided.
const flights = Array.from({ length: BEANS }, (_, index) => {
  const angle = (index / BEANS) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
  const distance = 120 + Math.random() * 60;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    spin: (Math.random() - 0.5) * 540,
    scale: 0.7 + Math.random() * 0.6,
  };
});

function Bean() {
  return (
    <Svg width={14} height={18} viewBox="0 0 14 18">
      <Ellipse cx={7} cy={9} rx={6.2} ry={8.2} fill={palette.darkRoast} />
      <Path d="M7 1.5 C 4 6, 10 12, 7 16.5" stroke={palette.latte} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FlyingBean({ index, burst }: { index: number; burst: SharedValue<number> }) {
  const flight = flights[index];
  const style = useAnimatedStyle(() => ({
    opacity: burst.value < 0.75 ? Math.min(1, burst.value * 6) : (1 - burst.value) * 4,
    transform: [
      { translateX: flight.x * burst.value },
      // A little gravity: the bean rises less and falls a touch at the end.
      { translateY: flight.y * burst.value + 50 * burst.value * burst.value },
      { rotate: `${flight.spin * burst.value}deg` },
      { scale: flight.scale },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.center, style]}>
      <Bean />
    </Animated.View>
  );
}

// Beans bursting out from the middle of whatever they are placed over, as
// `burst` runs from 0 to 1.
export function BeanBurst({ burst }: { burst: SharedValue<number> }) {
  return (
    <>
      {flights.map((_, index) => (
        <FlyingBean key={index} index={index} burst={burst} />
      ))}
    </>
  );
}

// A ring spreading over the coffee, as from a drop falling in.
function Ripple({ index, ripple }: { index: number; ripple: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const local = Math.max(0, Math.min(1, ripple.value * RIPPLES - index * 0.6));
    return { opacity: (1 - local) * 0.55 * (local > 0 ? 1 : 0), transform: [{ scale: 0.6 + local * 1.9 }] };
  });
  return <Animated.View pointerEvents="none" style={[styles.ripple, style]} />;
}

// Mounted once at the root, beside the alert host.
export function CelebrationHost() {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState<Celebration | null>(null);
  const page = useSharedValue(0);
  const cup = useSharedValue(0);
  const ripple = useSharedValue(0);
  const burst = useSharedValue(0);
  const words = useSharedValue(0);

  useEffect(() => {
    present = setShown;
    return () => {
      present = null;
    };
  }, []);

  const clear = () => setShown(null);

  const dismiss = () => {
    page.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) scheduleOnRN(clear);
    });
  };

  useEffect(() => {
    if (!shown) return;
    page.value = 0;
    cup.value = 0;
    ripple.value = 0;
    burst.value = 0;
    words.value = 0;

    page.value = withTiming(1, { duration: 180 });
    if (reduceMotion) {
      cup.value = withTiming(1, { duration: 180 });
      words.value = withTiming(1, { duration: 180 });
    } else {
      cup.value = withSpring(1, { damping: 10, stiffness: 160 });
      ripple.value = withDelay(120, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }));
      burst.value = withDelay(140, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
      words.value = withDelay(260, withSpring(1, { damping: 14, stiffness: 140 }));
    }
    const tick = setTimeout(tapFeedback, 160);
    const done = setTimeout(dismiss, HOLD);
    return () => {
      clearTimeout(tick);
      clearTimeout(done);
    };
    // `dismiss` only touches shared values and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, reduceMotion]);

  const pageStyle = useAnimatedStyle(() => ({ opacity: page.value }));
  const cupStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.3 + 0.7 * cup.value },
      { rotate: `${(1 - cup.value) * -20}deg` },
    ],
    opacity: Math.min(1, cup.value * 2),
  }));
  const wordsStyle = useAnimatedStyle(() => ({
    opacity: words.value,
    transform: [{ translateY: (1 - words.value) * 24 }],
  }));

  if (!shown) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, pageStyle]}>
      <Pressable accessibilityRole="button" accessibilityLabel={shown.title} onPress={dismiss} style={styles.fill}>
        <View style={styles.stage}>
          {Array.from({ length: RIPPLES }, (_, index) => (
            <Ripple key={index} index={index} ripple={ripple} />
          ))}
          <BeanBurst burst={burst} />
          <Animated.View style={cupStyle}>
            <CupMark drink={shown.drink} size={CUP} />
          </Animated.View>
        </View>
        <Animated.View style={[styles.words, wordsStyle]} accessibilityLiveRegion="polite">
          <Text variant="title" align="center">
            {shown.title}
          </Text>
          {shown.line ? (
            <Text variant="bodyStrong" color="textSecondary" align="center">
              {shown.line}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = themed(() => ({
  backdrop: {
    backgroundColor: withAlpha(colors.background, 0.9),
    zIndex: 1000,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  stage: {
    width: CUP,
    height: CUP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
  },
  ripple: {
    position: 'absolute',
    width: CUP,
    height: CUP,
    borderRadius: CUP / 2,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  words: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
}));
