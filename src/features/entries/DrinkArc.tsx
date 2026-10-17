import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { CupMark, Text } from '@/components/ui';
import { colors, radii, spacing, themed, withAlpha } from '@/theme';


// How far out from the cup the drinks fan, and the arc they fan over:
// from a little below level on the left, over the top, to the right.
export const ARC_RADIUS = 128;
const FROM = 196;
const TO = 344;
const COIN = 54;
// How far the finger has to travel before it points at a drink.
const DEAD_ZONE = 48;

function angleOf(index: number, count: number) {
  'worklet';
  return count === 1 ? 270 : FROM + ((TO - FROM) * index) / (count - 1);
}

// The drink a drag from the cup points at, or -1 while it points at none.
export function pointedAt(dx: number, dy: number, count: number) {
  'worklet';
  if (Math.hypot(dx, dy) < DEAD_ZONE) return -1;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  const step = count > 1 ? (TO - FROM) / (count - 1) : 60;
  let best = -1;
  let nearest = step / 2 + 12;
  for (let index = 0; index < count; index++) {
    const off = Math.abs(angle - angleOf(index, count));
    if (off < nearest) {
      nearest = off;
      best = index;
    }
  }
  return best;
}

function Coin({
  drink,
  index,
  count,
  open,
  selected,
}: {
  drink: string;
  index: number;
  count: number;
  open: SharedValue<number>;
  selected: SharedValue<number>;
}) {
  const radians = (angleOf(index, count) * Math.PI) / 180;
  const x = Math.cos(radians) * ARC_RADIUS;
  const y = Math.sin(radians) * ARC_RADIUS;

  const style = useAnimatedStyle(() => {
    // Each coin leaves the cup a beat after the one before.
    const local = Math.max(0, Math.min(1, open.value * 1.4 - index * 0.06));
    const picked = selected.value === index;
    return {
      opacity: local,
      transform: [
        { translateX: x * local },
        { translateY: y * local },
        { scale: (0.4 + local * 0.6) * (picked ? 1.28 : 1) },
      ],
    };
  });
  const ringStyle = useAnimatedStyle(() => ({ opacity: selected.value === index ? 1 : 0 }));

  return (
    <Animated.View style={[styles.coin, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.ring, ringStyle]} />
      <CupMark drink={drink} size={COIN - 8} />
    </Animated.View>
  );
}

type DrinkArcProps = {
  drinks: string[];
  open: SharedValue<number>;
  selected: SharedValue<number>;
  // The name of the drink pointed at, shown above the arc.
  label: string | null;
};

// The drinks fanned out over the cup while it is held and dragged: the one
// the finger points at grows, and letting go there starts a log of it.
export function DrinkArc({ drinks, open, selected, label }: DrinkArcProps) {
  const veil = useAnimatedStyle(() => ({ opacity: open.value }));

  return (
    <View pointerEvents="none" style={styles.anchor}>
      <Animated.View style={[styles.veil, veil]} />
      <Animated.View style={[styles.label, veil]}>
        {label ? (
          <View style={styles.bubble}>
            <Text variant="bodyStrong" color="textOnAccent">
              {label}
            </Text>
          </View>
        ) : null}
      </Animated.View>
      {drinks.map((drink, index) => (
        <Coin key={drink} drink={drink} index={index} count={drinks.length} open={open} selected={selected} />
      ))}
    </View>
  );
}

const styles = themed(() => ({
  // A point at the middle of the cup; everything is laid out round it.
  anchor: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    zIndex: 10,
    overflow: 'visible',
  },
  veil: {
    position: 'absolute',
    left: -1000,
    width: 2000,
    bottom: -200,
    height: 2400,
    backgroundColor: withAlpha(colors.background, 0.82),
  },
  coin: {
    position: 'absolute',
    left: -COIN / 2,
    top: -COIN / 2,
    width: COIN,
    height: COIN,
    borderRadius: COIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ring: {
    borderRadius: radii.pill,
    borderWidth: 2.5,
    borderColor: colors.accent,
  },
  label: {
    position: 'absolute',
    left: -150,
    width: 300,
    top: -ARC_RADIUS - COIN - spacing.xl,
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
}));
