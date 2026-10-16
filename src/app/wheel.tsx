import { useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { Button, Card, CupMark, PageHeader, Screen, Text } from '@/components/ui';
import { startLog } from '@/features/entries/logDraft';
import { coffeeTypes, type CoffeeType } from '@/features/entries/types';
import { t } from '@/i18n';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { colors, fonts, spacing, themed } from '@/theme';

const WHEEL_SIZE = 300;
const RADIUS = WHEEL_SIZE / 2;
const drinks = coffeeTypes.filter((type): type is Exclude<CoffeeType, 'other'> => type !== 'other');
const SLICE = 360 / drinks.length;
const sliceColors = () => [colors.highlight, colors.surface, colors.borderStrong, colors.background];

// A point on the rim, `angle` degrees clockwise from the top.
function rim(angle: number, radius = RADIUS) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: RADIUS + radius * Math.cos(radians), y: RADIUS + radius * Math.sin(radians) };
}

function slicePath(index: number) {
  const start = rim(index * SLICE);
  const end = rim((index + 1) * SLICE);
  return `M${RADIUS} ${RADIUS} L${start.x} ${start.y} A${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

function Wheel() {
  return (
    <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
      {drinks.map((drink, index) => {
        const middle = (index + 0.5) * SLICE;
        return (
          <G key={drink}>
            <Path
              d={slicePath(index)}
              fill={sliceColors()[index % 4]}
              stroke={colors.border}
              strokeWidth={1}
            />
            {/* Each name runs out from the hub along the middle of its slice. */}
            <SvgText
              x={RADIUS + 24}
              y={RADIUS + 4}
              fontSize={11}
              fontFamily={fonts.sansBold}
              fill={colors.text}
              transform={`rotate(${middle - 90} ${RADIUS} ${RADIUS})`}
            >
              {t(`coffeeTypes.${drink}`)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// "What should I drink?": spins to a random coffee and offers to log it.
export default function WheelScreen() {
  const [rotation] = useState(() => new Animated.Value(0));
  // Where the wheel has come to rest, in degrees, so each spin carries on.
  const turned = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<CoffeeType | null>(null);

  const spin = () => {
    const index = Math.floor(Math.random() * drinks.length);
    // The slice's middle is brought under the pointer at the top, after a
    // few whole turns so it feels like a spin.
    const restingAt = 360 - (index + 0.5) * SLICE;
    const current = turned.current % 360;
    const target = turned.current - current + 360 * 5 + restingAt;
    turned.current = target;

    tapFeedback();
    setPicked(null);
    setSpinning(true);
    Animated.timing(rotation, {
      toValue: target,
      duration: 3200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setPicked(drinks[index]);
      successFeedback();
    });
  };

  const [rotate] = useState(() => rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }));

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('wheel.title')} subtitle={t('wheel.body')} />

      <View style={styles.stage}>
        <View style={styles.pointer} />
        <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
          <Wheel />
        </Animated.View>
      </View>

      <Button label={t(picked ? 'wheel.again' : 'wheel.spin')} loading={spinning} onPress={spin} />

      {picked ? (
        <Card style={styles.result}>
          <CupMark drink={picked} size={72} />
          <View style={styles.resultText}>
            <Text variant="small" color="textSecondary">
              {t('wheel.result')}
            </Text>
            <Text variant="title">{t(`coffeeTypes.${picked}`)}</Text>
          </View>
          <Button variant="secondary" label={t('wheel.log')} onPress={() => startLog({ drink: picked })} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = themed(() => ({
  stage: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.accent,
  },
  // A small downward triangle over the top of the wheel.
  pointer: {
    zIndex: 1,
    marginBottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.accent,
  },
  result: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  resultText: {
    alignItems: 'center',
    gap: spacing.xs,
  },
}));
