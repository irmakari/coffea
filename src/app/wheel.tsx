import { useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { Button, Card, CupMark, PageHeader, Screen, Text } from '@/components/ui';
import { startLog } from '@/features/entries/logDraft';
import { coffeeTypes, type CoffeeType } from '@/features/entries/types';
import { t } from '@/i18n';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { colors, fonts, radii, spacing, themed, withAlpha } from '@/theme';

const WHEEL_SIZE = 312;
const RADIUS = WHEEL_SIZE / 2;
// The dark ring round the slices, and the slices inside it.
const RIM = 12;
const FACE = RADIUS - RIM;
const HUB = 56;
const NAME_SIZE = 12;
const drinks = coffeeTypes.filter((type): type is Exclude<CoffeeType, 'other'> => type !== 'other');
const SLICE = 360 / drinks.length;
// Three warm tones, so no two neighbours match, even where the last slice
// meets the first. The third is tan let through onto the dark rim drawn
// under the slices, which gives a deep roast brown.
const sliceColors = () => [colors.highlight, colors.surface, withAlpha(colors.highlight, 0.45)];
// That third slice is dark, so its name is light.
const DARK_SLICE = 2;

// A point `radius` out from the middle, `angle` degrees clockwise from the top.
function at(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: RADIUS + radius * Math.cos(radians), y: RADIUS + radius * Math.sin(radians) };
}

function slicePath(index: number) {
  const start = at(index * SLICE, FACE);
  const end = at((index + 1) * SLICE, FACE);
  return `M${RADIUS} ${RADIUS} L${start.x} ${start.y} A${FACE} ${FACE} 0 0 1 ${end.x} ${end.y} Z`;
}

// The turning part: slices on a dark rim with a bead where each slice
// meets the next, and each coffee's name running along the middle of its
// slice, ending at the rim so it stays clear of the hub.
function Wheel() {
  const fills = sliceColors();
  return (
    <View style={styles.face}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill={colors.accent} />
        {drinks.map((drink, index) => (
          <Path key={drink} d={slicePath(index)} fill={fills[index % fills.length]} />
        ))}
        {drinks.map((drink, index) => {
          const bead = at(index * SLICE, RADIUS - RIM / 2);
          return <Circle key={`bead-${drink}`} cx={bead.x} cy={bead.y} r={2.5} fill={colors.surface} />;
        })}
        {drinks.map((drink, index) => (
          <SvgText
            key={`name-${drink}`}
            x={RADIUS + FACE - 14}
            // Nudged down by a third of the size, so the line sits on the
            // slice's middle rather than on its edge.
            y={RADIUS + NAME_SIZE / 3}
            textAnchor="end"
            fontSize={NAME_SIZE}
            fontFamily={fonts.sansStrong}
            fill={index % 3 === DARK_SLICE ? colors.surface : colors.text}
            transform={`rotate(${(index + 0.5) * SLICE - 90} ${RADIUS} ${RADIUS})`}
          >
            {t(`coffeeTypes.${drink}`)}
          </SvgText>
        ))}
      </Svg>
    </View>
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
        <View style={styles.wheel}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Wheel />
          </Animated.View>
          {/* Stays still while the wheel turns under it. */}
          <View style={styles.hub}>
            <View style={styles.hubDot} />
          </View>
        </View>
        <View style={styles.pointer}>
          <View style={styles.pointerHead} />
          <View style={styles.pointerTip} />
        </View>
      </View>

      <Button label={t(picked ? 'wheel.again' : 'wheel.spin')} loading={spinning} onPress={spin} />

      {picked ? (
        <Card outline style={styles.result}>
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
  // Lifted off the page a little, like the friends board.
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: RADIUS,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  face: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  hub: {
    position: 'absolute',
    left: RADIUS - HUB / 2,
    top: RADIUS - HUB / 2,
    width: HUB,
    height: HUB,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  // A pin over the top of the wheel: a round head with a point below it.
  pointer: {
    position: 'absolute',
    top: -14,
    alignItems: 'center',
  },
  pointerHead: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  pointerTip: {
    marginTop: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
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
