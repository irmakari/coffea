import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { palette } from '@/theme';

import type { FortuneSymbol, Reading } from './fortune';

const GROUNDS = '#4A2E1C';

// Each shape drawn in a 24-unit box, as the grounds leave it.
const glyphs: Record<FortuneSymbol, { d: string; stroke?: boolean }> = {
  bird: { d: 'M2 12 C 6 7, 9 8, 12 12 C 15 8, 18 7, 22 12 C 18 10.5, 15 11.5, 12 15 C 9 11.5, 6 10.5, 2 12 Z' },
  road: { d: 'M4 21 C 11 17, 4 11, 12 8 C 18 6, 15 3, 20 2', stroke: true },
  heart: { d: 'M12 21 C 5 15, 2 11, 5 7 C 8 4, 11 6, 12 8 C 13 6, 16 4, 19 7 C 22 11, 19 15, 12 21 Z' },
  fish: { d: 'M2 12 C 6 6, 13 6, 17 12 C 13 18, 6 18, 2 12 Z M16 12 L22 7 L21 12 L22 17 Z' },
  key: { d: 'M2 12 A4.5 4.5 0 1 1 11 12 A4.5 4.5 0 1 1 2 12 Z M10 10.6 H22 V13.4 H20 V16 H17.5 V13.4 H10 Z' },
  moon: { d: 'M15 3 A9 9 0 1 0 21 15 A7 7 0 1 1 15 3 Z' },
  star: { d: 'M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z' },
};

export function Glyph({ symbol, size, color = GROUNDS }: { symbol: FortuneSymbol; size: number; color?: string }) {
  const glyph = glyphs[symbol];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph.stroke ? (
        <Path d={glyph.d} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
      ) : (
        <Path d={glyph.d} fill={color} />
      )}
    </Svg>
  );
}

// The foot of the cup, seen from above once it is turned over on its saucer.
export function UpsideDown({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {/* The cup's wall, now a white dome over the coffee. */}
      <Circle cx={c} cy={c} r={size * 0.27} fill={palette.softWhite} />
      <Circle cx={c} cy={c} r={size * 0.27} fill="none" stroke={palette.subtleBorder} strokeWidth={2} />
      {/* Its foot ring. */}
      <Circle cx={c} cy={c} r={size * 0.14} fill="none" stroke={palette.oatTaupe} strokeWidth={2.5} />
      <Circle cx={c} cy={c} r={size * 0.12} fill={palette.warmCream} />
      {/* A drop of coffee that ran down the side as it was turned. */}
      <Path
        d={`M${c + size * 0.2} ${c - size * 0.16} q ${size * 0.03} ${size * 0.06} 0 ${size * 0.09} q -${size * 0.03} -${size * 0.03} 0 -${size * 0.09} Z`}
        fill={GROUNDS}
        opacity={0.7}
      />
    </Svg>
  );
}

// A wisp of steam that rises from the cup and thins out, over and over.
export function Steam({ index, size }: { index: number; size: number }) {
  const reduceMotion = useReducedMotion();
  const rise = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    rise.value = withDelay(index * 450, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
  }, [index, reduceMotion, rise]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(rise.value * Math.PI) * 0.6,
    transform: [{ translateY: -rise.value * size * 0.45 }, { scaleX: 1 + rise.value * 0.4 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: size * 0.42, left: size / 2 - 14 + (index - 1) * 22 }, style]}
    >
      <Svg width={28} height={60} viewBox="0 0 28 60">
        <Path
          d="M14 58 C 4 46, 24 36, 14 24 C 6 14, 20 8, 14 2"
          stroke={palette.oatTaupe}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

type Ground = { x: number; y: number; size: number; stretch: number; turn: number; opacity: number };

// One shape in the grounds: it surfaces from the scatter, and is ringed
// while its meaning is read out.
function Shape({ reading, size, order, active }: { reading: Reading; size: number; order: number; active: boolean }) {
  const reduceMotion = useReducedMotion();
  const show = useSharedValue(reduceMotion ? 1 : 0);
  const glow = useSharedValue(0);
  const glyph = size * 0.2;
  const radius = (size / 2) * 0.78;

  useEffect(() => {
    if (reduceMotion) return;
    show.value = withDelay(500 + order * 900, withSpring(1, { damping: 12, stiffness: 110 }));
  }, [order, reduceMotion, show]);

  useEffect(() => {
    glow.value = active
      ? withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true)
      : withTiming(0, { duration: 300 });
  }, [active, glow]);

  const style = useAnimatedStyle(() => ({
    opacity: show.value,
    transform: [{ scale: 0.4 + show.value * 0.6 }, { rotate: `${(1 - show.value) * -30}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: glow.value * show.value, transform: [{ scale: 0.9 + glow.value * 0.15 }] }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: size / 2 + reading.x * radius - glyph / 2,
          top: size / 2 + reading.y * radius - glyph / 2,
          width: glyph,
          height: glyph,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: glyph * 1.45,
            height: glyph * 1.45,
            borderRadius: glyph,
            borderWidth: 2,
            borderColor: palette.latte,
            backgroundColor: 'rgba(217,187,160,0.18)',
          },
          ringStyle,
        ]}
      />
      <Glyph symbol={reading.symbol} size={glyph} />
    </Animated.View>
  );
}

// The inside of the cup once lifted: white porcelain, grounds dried on the
// wall, and the shapes hidden in them.
export function Grounds({
  size,
  grounds,
  readings,
  active,
}: {
  size: number;
  grounds: Ground[];
  readings: Reading[];
  active: number;
}) {
  const c = size / 2;
  const wall = c * 0.96;
  const inner = c * 0.86;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="porcelain" cx="50%" cy="50%" r="50%">
            <Stop offset="0.7" stopColor={palette.softWhite} />
            <Stop offset="1" stopColor={palette.subtleBorder} />
          </RadialGradient>
          <RadialGradient id="bottom" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GROUNDS} stopOpacity={0.85} />
            <Stop offset="0.7" stopColor={GROUNDS} stopOpacity={0.45} />
            <Stop offset="1" stopColor={GROUNDS} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={wall} fill="url(#porcelain)" stroke={palette.oatTaupe} strokeWidth={2} />
        <Circle cx={c} cy={c} r={inner} fill="none" stroke={palette.subtleBorder} strokeWidth={1.5} />
        {/* The thick of it, settled at the bottom. */}
        <Ellipse cx={c} cy={c} rx={inner * 0.34} ry={inner * 0.3} fill="url(#bottom)" />
        <G>
          {grounds.map((ground, index) => (
            <Ellipse
              key={index}
              cx={c + ground.x * inner}
              cy={c + ground.y * inner}
              rx={ground.size * inner * ground.stretch}
              ry={ground.size * inner * 0.45}
              fill={GROUNDS}
              opacity={ground.opacity * 0.85}
              transform={`rotate(${ground.turn} ${c + ground.x * inner} ${c + ground.y * inner})`}
            />
          ))}
        </G>
      </Svg>
      {readings.map((reading, index) => (
        <Shape key={reading.symbol} reading={reading} size={size} order={index} active={active === index} />
      ))}
    </View>
  );
}
