import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { t } from '@/i18n';
import { colors, radii, spacing, themed } from '@/theme';

// How far, or how fast, the sheet has to be pulled down to let go of it.
const CLOSE_DISTANCE = 120;
const CLOSE_SPEED = 800;
const OFF_SCREEN = 900;
// The sheet slides up and settles without overshooting: a bounce here reads
// as the sheet jumping.
const OPEN = { duration: 320, easing: Easing.out(Easing.cubic) };

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

// A sheet over the lower part of the screen, closed by pulling it down or
// tapping above it. Its content is mounted with it, so it opens afresh.
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    // The sheet animates itself; the modal only appears and goes.
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* A modal is a window of its own, so it needs its own gesture root. */}
      <GestureHandlerRootView style={styles.fill}>
        {visible ? <Sheet onClose={onClose}>{children}</Sheet> : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(OFF_SCREEN);

  useEffect(() => {
    offset.set(withTiming(0, OPEN));
  }, [offset]);

  const away = (duration: number) =>
    withTiming(OFF_SCREEN, { duration }, (finished) => {
      if (finished) scheduleOnRN(onClose);
    });

  const close = () => offset.set(away(220));

  const drag = Gesture.Pan()
    .onUpdate((event) => {
      offset.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_SPEED) {
        offset.set(
          withTiming(OFF_SCREEN, { duration: 200 }, (finished) => {
            if (finished) scheduleOnRN(onClose);
          }),
        );
      } else {
        offset.set(withTiming(0, OPEN));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - offset.value / OFF_SCREEN) }));

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={styles.fill} onPress={close} accessibilityRole="button" accessibilityLabel={t('common.close')} />
      </Animated.View>
      <GestureDetector gesture={drag}>
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }, sheetStyle]}>
          {/* Kept apart from the slide, so a change of height eases. */}
          <Animated.View layout={LinearTransition.duration(220)}>
            <View style={styles.grabber} />
            {children}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = themed(() => ({
  fill: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: colors.accent,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    paddingTop: spacing.md,
    borderTopLeftRadius: radii.frame + 6,
    borderTopRightRadius: radii.frame + 6,
    backgroundColor: colors.surface,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
  },
}));
