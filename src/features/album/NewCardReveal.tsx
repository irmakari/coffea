import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  useAnimatedReaction,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Button, CupMark, Text } from '@/components/ui';
import { BeanBurst } from '@/features/celebrate/Celebration';
import { formatNumber, t } from '@/i18n';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { colors, palette, radii, spacing, themed, withAlpha } from '@/theme';

import { slotNumber } from './album';

export type NewCard = {
  drink: string;
  name: string;
  number: number;
  collected: number;
  total: number;
  // What saving it did to the streak, shown under the card.
  line?: string;
};

let present: ((card: NewCard) => void) | null = null;

// A coffee tried for the first time: its album card is handed over face
// down, to be turned over with a tap.
export function revealNewCard(card: NewCard) {
  present?.(card);
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 300;
// How far the card leans as the phone is tilted, in degrees.
const LEAN = 14;

function clamp(value: number, limit: number) {
  'worklet';
  return Math.max(-limit, Math.min(limit, value));
}

// The back of every album card: the cup on tan, and a question.
function Back() {
  return (
    <View style={[styles.face, styles.back]}>
      <Svg width={CARD_WIDTH} height={CARD_HEIGHT} style={StyleSheet.absoluteFill}>
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 4 }, (_, column) => (
            <Circle
              key={`${row}-${column}`}
              cx={30 + column * 54 + (row % 2) * 27}
              cy={28 + row * 50}
              r={9}
              fill={palette.espresso}
              opacity={0.06}
            />
          )),
        )}
      </Svg>
      <CupMark size={110} />
      <Text variant="display" color="heroText">
        ?
      </Text>
    </View>
  );
}

// The face of the new card: its number, the drink, and a foil sheen that
// slides as the phone tilts.
function Front({ card, sheen }: { card: NewCard; sheen: SharedValue<number> }) {
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheen.value * CARD_WIDTH }, { rotate: '20deg' }],
  }));

  return (
    <View style={[styles.face, styles.front]}>
      <View style={styles.frontInner}>
        <Text variant="eyebrow" color="textSecondary">
          {slotNumber(card.number)}
        </Text>
        <CupMark drink={card.drink} size={128} />
        <Text variant="title" align="center" numberOfLines={2}>
          {card.name}
        </Text>
      </View>
      <Animated.View pointerEvents="none" style={[styles.sheen, sheenStyle]}>
        <Svg width={140} height={CARD_HEIGHT * 1.6}>
          <Defs>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.35" stopColor="#FFE9C7" stopOpacity={0.35} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.6} />
              <Stop offset="0.65" stopColor="#D8F0E6" stopOpacity={0.3} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={140} height={CARD_HEIGHT * 1.6} fill="url(#sheen)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// Mounted once at the root, beside the alert host.
export function NewCardHost() {
  const [card, setCard] = useState<NewCard | null>(null);

  useEffect(() => {
    present = setCard;
    return () => {
      present = null;
    };
  }, []);

  if (!card) return null;
  return <Reveal card={card} onDone={() => setCard(null)} />;
}

function Reveal({ card, onDone }: { card: NewCard; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const page = useSharedValue(0);
  const arrive = useSharedValue(0);
  const float = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const flip = useSharedValue(0);
  const burst = useSharedValue(0);
  const words = useSharedValue(0);
  const sweep = useSharedValue(-1);

  // The phone's tilt, taken from where it was held when the card arrived.
  const sensor = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });
  const base = useSharedValue<{ pitch: number; roll: number } | null>(null);

  useEffect(() => {
    page.value = withTiming(1, { duration: 200 });
    if (reduceMotion) {
      arrive.value = 1;
      return;
    }
    arrive.value = withSpring(1, { damping: 12, stiffness: 120 });
    float.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    wiggle.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 70 }),
          withTiming(-1, { duration: 70 }),
          withTiming(1, { duration: 70 }),
          withTiming(0, { duration: 70 }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
      ),
    );
  }, [reduceMotion, page, arrive, float, wiggle]);

  const turnOver = () => {
    if (open) return;
    setOpen(true);
    successFeedback();
    wiggle.set(withTiming(0, { duration: 80 }));
    if (reduceMotion) {
      flip.set(1);
      words.set(1);
      return;
    }
    flip.set(withSpring(1, { damping: 13, stiffness: 90 }));
    burst.set(withDelay(220, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
    words.set(withDelay(380, withSpring(1, { damping: 14 })));
    // Without a tilt to follow, the sheen still passes once on its own.
    sweep.set(withDelay(500, withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })));
    setTimeout(tapFeedback, 260);
  };

  const close = () => {
    page.set(
      withTiming(0, { duration: 220 }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }),
    );
  };

  useAnimatedReaction(
    () => sensor.sensor.value,
    (reading) => {
      if (base.value === null && (reading.pitch !== 0 || reading.roll !== 0)) {
        base.value = { pitch: reading.pitch, roll: reading.roll };
      }
    },
  );
  const tiltX = useDerivedValue(() =>
    base.value ? clamp(((sensor.sensor.value.pitch - base.value.pitch) * 180) / Math.PI, LEAN) : 0,
  );
  const tiltY = useDerivedValue(() =>
    base.value ? clamp(((sensor.sensor.value.roll - base.value.roll) * 180) / Math.PI, LEAN) : 0,
  );
  // Where the sheen sits: following the tilt, plus its one pass across.
  const sheen = useDerivedValue(() => sweep.value + tiltY.value / LEAN);

  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: arrive.value,
      transform: [
        { perspective: 900 },
        { translateY: (1 - arrive.value) * 260 + float.value * -8 },
        { rotateZ: `${wiggle.value * 4}deg` },
        { rotateX: `${reduceMotion ? 0 : -tiltX.value}deg` },
        { rotateY: `${flip.value * 180 + (reduceMotion ? 0 : tiltY.value)}deg` },
        { scale: 0.85 + arrive.value * 0.15 },
      ],
    };
  });

  // Each face hides when turned away; the front is drawn already turned.
  const backStyle = useAnimatedStyle(() => ({ opacity: flip.value < 0.5 ? 1 : 0 }));
  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 0 : 1,
    transform: [{ rotateY: '180deg' }],
  }));
  const wordsStyle = useAnimatedStyle(() => ({
    opacity: words.value,
    transform: [{ translateY: (1 - words.value) * 20 }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: (1 - flip.value) * arrive.value }));
  const pageStyle = useAnimatedStyle(() => ({ opacity: page.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, pageStyle]}>
      <Pressable style={styles.fill} onPress={open ? close : turnOver} accessibilityRole="button" accessibilityLabel={open ? t('common.close') : t('newCard.open')}>
        <Animated.Text style={[styles.eyebrow, hintStyle]}>{t('newCard.eyebrow')}</Animated.Text>
        <View style={styles.stage}>
          <BeanBurst burst={burst} />
          <Animated.View style={[styles.card, cardStyle]}>
            <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
              <Back />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
              <Front card={card} sheen={sheen} />
            </Animated.View>
          </Animated.View>
        </View>
        {open ? (
          <Animated.View style={[styles.words, wordsStyle]} accessibilityLiveRegion="polite">
            <Text variant="title" align="center">
              {t('newCard.title')}
            </Text>
            <Text variant="bodyStrong" color="textSecondary" align="center">
              {t('newCard.progress', { collected: formatNumber(card.collected), total: formatNumber(card.total) })}
            </Text>
            {card.line ? (
              <Text variant="small" color="textSecondary" align="center">
                {card.line}
              </Text>
            ) : null}
            <Button label={t('newCard.done')} onPress={close} style={styles.done} />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.words, hintStyle]}>
            <Text variant="bodyStrong" color="textSecondary" align="center">
              {t('newCard.tap')}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = themed(() => ({
  backdrop: {
    backgroundColor: withAlpha(colors.background, 0.94),
    zIndex: 1001,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  eyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  face: {
    flex: 1,
    borderRadius: radii.frame,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    backgroundColor: colors.hero,
    borderWidth: 6,
    borderColor: colors.surface,
    gap: spacing.sm,
  },
  front: {
    backgroundColor: colors.surface,
    borderWidth: 6,
    borderColor: colors.highlight,
  },
  frontInner: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sheen: {
    position: 'absolute',
    top: -CARD_HEIGHT * 0.3,
    left: -140,
  },
  words: {
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 120,
  },
  done: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
}));
