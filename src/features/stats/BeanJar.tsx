import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { tapFeedback } from '@/lib/haptics';
import { colors, palette, withAlpha } from '@/theme';

export const JAR_WIDTH = 112;
export const JAR_HEIGHT = 152;

const BEAN_WIDTH = 13;
const BEAN_HEIGHT = 17;
// The inside of the jar the beans may fill, bottom up.
const INSIDE = { left: 14, right: JAR_WIDTH - 14, top: 42, bottom: JAR_HEIGHT - 10 };
const COLUMN = 13.5;
const ROW = 10.5;
const columns = Math.floor((INSIDE.right - INSIDE.left - BEAN_WIDTH) / COLUMN) + 1;
const rows = Math.floor((INSIDE.bottom - INSIDE.top - BEAN_HEIGHT) / ROW) + 1;
export const JAR_CAPACITY = columns * rows;

// The same scatter every time, so a bean never jumps when the jar redraws.
function jitter(index: number, salt: number) {
  'worklet';
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

// Where each bean lies, bottom row first, every other row shifted half a
// bean so they settle into each other's gaps.
const places = Array.from({ length: JAR_CAPACITY }, (_, index) => {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const shift = row % 2 === 1 ? COLUMN / 2 - 2 : 0;
  return {
    x: INSIDE.left + column * COLUMN + shift + (jitter(index, 1) - 0.5) * 3,
    y: INSIDE.bottom - BEAN_HEIGHT - row * ROW + (jitter(index, 2) - 0.5) * 3,
    rotate: (jitter(index, 3) - 0.5) * 140,
  };
});

function BeanShape() {
  return (
    <Svg width={BEAN_WIDTH} height={BEAN_HEIGHT} viewBox="0 0 14 18">
      <Ellipse cx={7} cy={9} rx={6.2} ry={8.2} fill={palette.darkRoast} />
      <Ellipse cx={5} cy={6.5} rx={1.6} ry={3} fill={palette.mocha} opacity={0.55} />
      <Path d="M7 1.5 C 4.2 6, 9.8 12, 7 16.5" stroke={palette.espresso} strokeWidth={1.3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// One bean, dropped in from above the jar the first time it shows.
function Bean({
  index,
  order,
  drop,
  toss,
}: {
  index: number;
  order: number;
  drop: boolean;
  // Above 0 while the jar is being shaken: how high the beans are thrown.
  toss: SharedValue<number>;
}) {
  const place = places[index];
  const fall = useSharedValue(drop ? 1 : 0);

  useEffect(() => {
    if (!drop) return;
    fall.value = withDelay(order * 35, withSpring(0, { damping: 11, stiffness: 120, mass: 0.7 }));
  }, [drop, order, fall]);

  const style = useAnimatedStyle(() => ({
    opacity: fall.value > 0.98 ? 0 : 1,
    transform: [
      // Shaken, the higher beans fly furthest, each its own way.
      { translateX: toss.value * (jitter(index, 4) - 0.5) * 14 },
      { translateY: -fall.value * (place.y + BEAN_HEIGHT) - toss.value * (8 + jitter(index, 5) * 22) },
      { rotate: `${place.rotate + fall.value * 160 + toss.value * (jitter(index, 6) - 0.5) * 260}deg` },
    ],
  }));

  // The fade out on leaving is kept on a wrapper, apart from the fall.
  return (
    <Animated.View exiting={FadeOut.duration(600)} style={{ position: 'absolute', left: place.x, top: place.y }}>
      <Animated.View style={style}>
        <BeanShape />
      </Animated.View>
    </Animated.View>
  );
}

type BeanJarProps = {
  // How many beans the jar holds now.
  beans: number;
};

// A glass jar of coffee beans, one bean for each ten milligrams of caffeine
// in the body. Beans fall in when the jar first shows or a coffee is logged,
// and fade away one by one as it wears off.
export function BeanJar({ beans }: BeanJarProps) {
  const reduceMotion = useReducedMotion();
  const count = Math.max(0, Math.min(JAR_CAPACITY, Math.round(beans)));
  // `shown` is how many there were before the latest change: those beans
  // stay put, and only the ones past them fall in.
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState(0);
  if (count !== current) {
    setShown(current);
    setCurrent(count);
  }

  const sway = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion || count <= shown) return;
    // A small knock as the beans land.
    sway.value = withDelay(
      250,
      withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }, () => {
        sway.value = withSpring(0, { damping: 5, stiffness: 180 });
      }),
    );
  }, [count, shown, reduceMotion, sway]);

  // A tap shakes the jar: it rocks, the beans jump and tumble, and they
  // settle back into place with a rattle.
  const toss = useSharedValue(0);
  const rock = useSharedValue(0);
  const shake = () => {
    tapFeedback();
    if (reduceMotion || count === 0) return;
    rock.set(
      withSequence(
        withTiming(-1, { duration: 70 }),
        withTiming(1, { duration: 110 }),
        withTiming(-0.6, { duration: 100 }),
        withSpring(0, { damping: 6, stiffness: 200 }),
      ),
    );
    toss.set(
      withSequence(
        withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 7, stiffness: 170, mass: 0.6 }),
      ),
    );
    setTimeout(tapFeedback, 330);
    setTimeout(tapFeedback, 430);
  };

  const jarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 3 + rock.value * 7}deg` }, { translateY: -toss.value * 4 }],
  }));

  const glass = withAlpha(colors.surface, 0.55);
  const rim = colors.borderStrong;

  return (
    <Pressable onPress={shake} hitSlop={8}>
    <Animated.View style={[{ width: JAR_WIDTH, height: JAR_HEIGHT }, jarStyle]}>
      {/* The glass behind the beans. */}
      <Svg width={JAR_WIDTH} height={JAR_HEIGHT} style={{ position: 'absolute' }}>
        <Path
          d={`M28 26 H${JAR_WIDTH - 28} Q${JAR_WIDTH - 24} 26 ${JAR_WIDTH - 22} 32
              Q${JAR_WIDTH - 6} 36 ${JAR_WIDTH - 6} 54 V${JAR_HEIGHT - 20}
              Q${JAR_WIDTH - 6} ${JAR_HEIGHT - 4} ${JAR_WIDTH - 22} ${JAR_HEIGHT - 4} H22
              Q6 ${JAR_HEIGHT - 4} 6 ${JAR_HEIGHT - 20} V54 Q6 36 22 32 Q24 26 28 26 Z`}
          fill={glass}
          stroke={rim}
          strokeWidth={1.5}
        />
      </Svg>

      <View style={{ position: 'absolute', width: JAR_WIDTH, height: JAR_HEIGHT }}>
        {Array.from({ length: count }, (_, index) => (
          <Bean key={index} index={index} order={index - shown} drop={!reduceMotion && index >= shown} toss={toss} />
        ))}
      </View>

      {/* The glass in front: a shine down one side, and the lid. */}
      <Svg width={JAR_WIDTH} height={JAR_HEIGHT} style={{ position: 'absolute' }} pointerEvents="none">
        <Rect x={13} y={50} width={5} height={JAR_HEIGHT - 80} rx={2.5} fill="#FFFFFF" opacity={0.5} />
        <Rect x={JAR_WIDTH - 20} y={58} width={3} height={22} rx={1.5} fill="#FFFFFF" opacity={0.35} />
        <Rect x={24} y={6} width={JAR_WIDTH - 48} height={20} rx={5} fill={palette.mocha} />
        <Rect x={24} y={6} width={JAR_WIDTH - 48} height={6} rx={3} fill={palette.oatTaupe} opacity={0.6} />
        <Rect x={24} y={20} width={JAR_WIDTH - 48} height={2} fill={palette.darkRoast} opacity={0.35} />
      </Svg>
    </Animated.View>
    </Pressable>
  );
}
