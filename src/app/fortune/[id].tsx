import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button, CupMark, EmptyState, PageHeader, Screen, Text } from '@/components/ui';
import { useEntries, useEntry } from '@/features/entries/EntriesProvider';
import { useFriends } from '@/features/friends/FriendsProvider';
import { groundsOf, readCup } from '@/features/fortune/fortune';
import { Glyph, Grounds, Steam, UpsideDown } from '@/features/fortune/FortuneCup';
import { t } from '@/i18n';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { colors, radii, spacing, themed } from '@/theme';

const CUP = 260;
const COOLING = 3500;
// How long after the lift each shape surfaces, and its meaning with it.
const FIRST_SHAPE = 500;
const NEXT_SHAPE = 900;

type Stage = 'intro' | 'turning' | 'cooling' | 'ready' | 'reading';

export default function FortuneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cup = useEntry(id);
  const { entries } = useEntries();
  const { friends } = useFriends();
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>('intro');
  const [active, setActive] = useState(-1);

  const readings = useMemo(() => (cup ? readCup(cup, entries, friends.length) : []), [cup, entries, friends.length]);
  const grounds = useMemo(() => (cup ? groundsOf(cup) : []), [cup]);

  const flip = useSharedValue(0);
  const cool = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (stage !== 'reading') return;
    const timers = readings.map((_, index) =>
      setTimeout(
        () => {
          setActive(index);
          tapFeedback();
        },
        reduceMotion ? 0 : FIRST_SHAPE + index * NEXT_SHAPE,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [stage, readings, reduceMotion]);

  const turnOver = () => {
    setStage('turning');
    flip.set(withSpring(1, { damping: 14, stiffness: 70 }));
    setTimeout(
      () => {
        successFeedback();
        setStage('cooling');
        cool.set(withTiming(1, { duration: reduceMotion ? 0 : COOLING, easing: Easing.linear }));
        setTimeout(() => {
          tapFeedback();
          setStage('ready');
        }, reduceMotion ? 0 : COOLING);
      },
      reduceMotion ? 0 : 650,
    );
  };

  const liftCup = () => {
    tapFeedback();
    lift.set(withTiming(1, { duration: reduceMotion ? 0 : 700, easing: Easing.inOut(Easing.cubic) }));
    setStage('reading');
  };

  const cupStyle = useAnimatedStyle(() => ({
    opacity: 1 - lift.value,
    transform: [
      { perspective: 800 },
      { translateY: -lift.value * 120 },
      { rotateX: `${flip.value * 180}deg` },
      { scale: 1 + lift.value * 0.15 },
    ],
  }));
  // Once past halfway, the cup shows its foot; the drawing beneath it is the
  // saucer it now rests on.
  const footStyle = useAnimatedStyle(() => ({ opacity: flip.value > 0.5 ? 1 : 0 }));
  const groundsStyle = useAnimatedStyle(() => ({
    opacity: lift.value,
    transform: [{ scale: 0.88 + lift.value * 0.12 }],
  }));
  const coolStyle = useAnimatedStyle(() => ({ width: `${cool.value * 100}%` }));

  if (!cup) {
    return (
      <Screen edges={['top', 'bottom']}>
        <PageHeader padded={false} title={t('fortune.title')} />
        <EmptyState title={t('common.loadError.title')} body={t('common.loadError.body')} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader padded={false} title={t('fortune.title')} />

      <View style={styles.stage}>
        {stage === 'reading' ? (
          <Animated.View style={[styles.layer, groundsStyle]}>
            <Grounds size={CUP} grounds={grounds} readings={readings} active={active} />
          </Animated.View>
        ) : null}
        <Animated.View pointerEvents="none" style={[styles.layer, cupStyle]}>
          <CupMark drink="turkish" size={CUP} />
          <Animated.View style={[{ position: 'absolute', width: CUP, height: CUP }, footStyle]}>
            <UpsideDown size={CUP} />
          </Animated.View>
        </Animated.View>
        {stage === 'cooling' ? [0, 1, 2].map((index) => <Steam key={index} index={index} size={CUP} />) : null}
      </View>

      {stage === 'intro' || stage === 'turning' ? (
        <View style={styles.words}>
          <Text variant="bodyStrong" color="textSecondary" align="center">
            {t('fortune.intro')}
          </Text>
          <Button label={t('fortune.turn')} onPress={turnOver} disabled={stage === 'turning'} />
        </View>
      ) : null}

      {stage === 'cooling' || stage === 'ready' ? (
        <View style={styles.words}>
          <Text variant="bodyStrong" color="textSecondary" align="center">
            {t('fortune.cooling')}
          </Text>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, coolStyle]} />
          </View>
          <Button label={t('fortune.lift')} onPress={liftCup} disabled={stage !== 'ready'} />
        </View>
      ) : null}

      {stage === 'reading' ? (
        <View style={styles.reading}>
          <Text variant="heading">{t('fortune.reading')}</Text>
          {readings.map((reading, index) =>
            index <= active ? (
              <Animated.View key={reading.symbol} entering={reduceMotion ? undefined : FadeInDown.springify().damping(16)}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActive(index)}
                  style={[styles.row, active === index && styles.rowActive]}
                >
                  <View style={styles.rowGlyph}>
                    <Glyph symbol={reading.symbol} size={26} color={colors.text} />
                  </View>
                  <View style={styles.rowText}>
                    <Text variant="label" color="textSecondary">
                      {t(`fortune.symbols.${reading.symbol}`)}
                    </Text>
                    <Text>{reading.text}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ) : null,
          )}
          {active >= readings.length - 1 ? (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.end}>
              <Text variant="caption" color="textMuted" align="center">
                {t('fortune.disclaimer')}
              </Text>
              <Button variant="secondary" label={t('fortune.again')} onPress={() => router.back()} />
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = themed(() => ({
  stage: {
    height: CUP + spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  layer: {
    position: 'absolute',
    width: CUP,
    height: CUP,
  },
  words: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  reading: {
    gap: spacing.md,
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.frame,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowActive: {
    borderColor: colors.highlight,
    backgroundColor: colors.surface,
  },
  rowGlyph: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  end: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
}));
