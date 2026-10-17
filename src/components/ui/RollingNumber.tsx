import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { typography, type ColorName, type TextVariant } from '@/theme';

import { Text } from './Text';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

type RollingNumberProps = {
  // Already formatted: "1,240", "₺86.50", "5 days in a row". Each digit in it
  // rolls up to its place like a counter; everything else stands still.
  value: string;
  variant?: TextVariant;
  color?: ColorName;
  style?: StyleProp<TextStyle>;
};

function lineHeightOf(variant: TextVariant, style: StyleProp<TextStyle>) {
  const flat = StyleSheet.flatten([typography[variant], style]);
  return flat.lineHeight ?? Math.round((flat.fontSize ?? 16) * 1.25);
}

function Digit({
  digit,
  order,
  height,
  variant,
  color,
  style,
}: {
  digit: number;
  order: number;
  height: number;
  variant: TextVariant;
  color: ColorName;
  style: StyleProp<TextStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const place = useSharedValue(reduceMotion ? digit : 0);

  useEffect(() => {
    place.value = reduceMotion
      ? digit
      : withDelay(order * 45, withSpring(digit, { damping: 16, stiffness: 110, mass: 0.9 }));
  }, [digit, order, reduceMotion, place]);

  const columnStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -place.value * height }] }));

  return (
    <View style={{ height, overflow: 'hidden' }}>
      {/* Sizes the window to the digit it settles on. */}
      <Text variant={variant} style={[style, styles.tabular, styles.hidden]}>
        {DIGITS[digit]}
      </Text>
      <Animated.View style={[styles.column, columnStyle]}>
        {DIGITS.map((shown) => (
          <Text key={shown} variant={variant} color={color} style={[style, styles.tabular, { height }]}>
            {shown}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

// A figure that counts itself in. Read out whole to screen readers.
export function RollingNumber({ value, variant = 'body', color = 'text', style }: RollingNumberProps) {
  const height = lineHeightOf(variant, style);
  let order = 0;

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={value} style={styles.row}>
      {value.split(/(\d)/).map((char, index) => {
        if (char === '') return null;
        if (/^\d$/.test(char)) {
          return (
            <Digit
              key={index}
              digit={Number(char)}
              order={order++}
              height={height}
              variant={variant}
              color={color}
              style={style}
            />
          );
        }
        return (
          <Text key={index} variant={variant} color={color} style={[style, { height }]}>
            {char}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  hidden: {
    opacity: 0,
  },
  column: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
  },
});
