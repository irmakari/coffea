import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CoffeePhoto } from '@/components/ui';
import { tapFeedback } from '@/lib/haptics';
import { colors, photoRatio, radii, spacing, themed } from '@/theme';

// How thick the white die-cut edge round a sticker is drawn.
const EDGE = 3;
// The edge is the sticker drawn in white, nudged round a circle beneath it.
const EDGE_STEPS = 12;
const edgeOffsets = Array.from({ length: EDGE_STEPS }, (_, step) => {
  const angle = (step / EDGE_STEPS) * Math.PI * 2;
  return { x: Math.cos(angle) * EDGE, y: Math.sin(angle) * EDGE };
});

// A cut-out with a white edge, like a sticker peeled off a sheet. A
// `cacheKey` keeps one behind a changing link from being fetched again.
export function StickerImage({ uri, cacheKey, edge = true }: { uri: string; cacheKey?: string; edge?: boolean }) {
  const source = { uri, cacheKey };
  return (
    <View style={StyleSheet.absoluteFill}>
      {edge
        ? edgeOffsets.map((offset, index) => (
            <Image
              key={index}
              source={source}
              contentFit="contain"
              tintColor="#FFFFFF"
              style={[StyleSheet.absoluteFill, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
            />
          ))
        : null}
      <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} />
    </View>
  );
}

type StickerRevealProps = {
  photoUri: string;
  // Undefined while being cut out, null where none can be made.
  sticker: string | null | undefined;
  // Landscape fills the width of a form; round is the cup-sized disc on the
  // log screen, whose photo falls away once the sticker is cut.
  shape?: 'landscape' | 'round';
};

// A picked photo, and the coffee lifting out of it once its sticker is cut:
// a light sweeps the photo while it is being made, then the photo sinks away
// and the cut-out springs up off it with a tick.
export function StickerReveal({ photoUri, sticker, shape = 'landscape' }: StickerRevealProps) {
  const reduceMotion = useReducedMotion();
  // Only a sticker made while this was on screen is revealed; one already
  // made simply shows.
  const sawMaking = useRef(sticker === undefined);
  const [width, setWidth] = useState(0);

  const photo = useSharedValue(sticker ? 0 : 1);
  const lift = useSharedValue(sticker ? 1 : 0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (sticker === undefined) {
      sawMaking.current = true;
      photo.value = 1;
      lift.value = 0;
      sweep.value = 0;
      if (!reduceMotion) {
        sweep.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1);
      }
      return;
    }
    sweep.value = 0;
    if (sticker === null) {
      photo.value = 1;
      lift.value = 0;
      return;
    }
    if (!sawMaking.current || reduceMotion) {
      photo.value = withTiming(0, { duration: 200 });
      lift.value = withTiming(1, { duration: 200 });
      return;
    }
    photo.value = withDelay(120, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    lift.value = withSpring(1, { damping: 9, stiffness: 140, mass: 0.8 });
    const tick = setTimeout(tapFeedback, 140);
    return () => clearTimeout(tick);
  }, [sticker, reduceMotion, photo, lift, sweep]);

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photo.value,
    transform: [{ scale: 1 + (1 - photo.value) * 0.06 }],
  }));

  const stickerStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, lift.value * 3),
    transform: [
      { translateY: (1 - lift.value) * 26 },
      { scale: 0.82 + lift.value * 0.18 },
      { rotate: `${(1 - lift.value) * -7}deg` },
    ],
  }));

  // The shadow grows as the sticker comes off the page.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: lift.value * 0.22,
    transform: [{ scaleX: 0.5 + lift.value * 0.5 }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweep.value > 0 ? 1 : 0,
    transform: [{ translateX: -width + sweep.value * width * 2.2 }, { rotate: '18deg' }],
  }));

  return (
    <View
      style={shape === 'round' ? styles.roundFrame : styles.frame}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View style={[StyleSheet.absoluteFill, photoStyle, shape === 'round' && styles.print]}>
        <CoffeePhoto
          uri={photoUri}
          ratio={shape === 'round' ? 'square' : 'landscape'}
          style={shape === 'round' ? styles.printPhoto : undefined}
        />
        {sticker === undefined ? (
          <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]} />
        ) : null}
      </Animated.View>
      {sticker ? (
        <>
          <Animated.View pointerEvents="none" style={[styles.shadow, shadowStyle]} />
          <Animated.View
            pointerEvents="none"
            style={[shape === 'round' ? styles.roundSticker : styles.sticker, stickerStyle]}
          >
            <StickerImage uri={sticker} />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = themed(() => ({
  frame: {
    aspectRatio: photoRatio.landscape,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    overflow: 'hidden',
  },
  roundFrame: {
    width: '100%',
    aspectRatio: 1,
  },
  // The photo cut round with a white rim, like a saucer.
  print: {
    borderRadius: radii.pill,
    borderWidth: 5,
    borderColor: colors.surface,
    backgroundColor: colors.highlight,
    overflow: 'hidden',
  },
  printPhoto: {
    borderRadius: 0,
  },
  sweep: {
    position: 'absolute',
    top: '-40%',
    bottom: '-40%',
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  sticker: {
    position: 'absolute',
    top: spacing.lg,
    bottom: spacing.lg + 8,
    left: spacing.lg,
    right: spacing.lg,
  },
  roundSticker: {
    position: 'absolute',
    top: spacing.md,
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
  },
  shadow: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    width: '46%',
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.shadow,
  },
}));
