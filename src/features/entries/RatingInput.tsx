import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui';
import { t } from '@/i18n';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { sizes } from '@/theme';

import { MAX_RATING } from './types';

type RatingInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
};

const steps = Array.from({ length: MAX_RATING }, (_, index) => index + 1);

// A star that hops when it lights, each a beat after the one before it.
function Star({ active, step, value }: { active: boolean; step: number; value: number | null }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || reduceMotion) return;
    // A full five gets a bigger hop.
    const peak = value === MAX_RATING ? 1.45 : 1.28;
    scale.value = withDelay(
      (step - 1) * 40,
      withSequence(withTiming(peak, { duration: 110 }), withSpring(1, { damping: 7, stiffness: 220 })),
    );
  }, [active, value, step, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Icon name="star" size={26} color={active ? 'text' : 'placeholder'} filled={active} strokeWidth={1.25} />
    </Animated.View>
  );
}

// Tapping the current rating again clears it, so a rating is never stuck on.
export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <View style={styles.row}>
      {steps.map((step) => {
        const active = value !== null && step <= value;
        return (
          <Pressable
            key={step}
            accessibilityRole="button"
            accessibilityLabel={t('entry.rating.value', { count: step })}
            accessibilityState={{ selected: value === step }}
            onPress={() => {
              if (step === MAX_RATING && value !== step) successFeedback();
              else tapFeedback();
              onChange(value === step ? null : step);
            }}
            style={styles.step}
          >
            <Star active={active} step={step} value={value} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    // Pull the first star back to the text edge; its touch target is wider.
    marginLeft: -(sizes.touch - 26) / 2,
  },
  step: {
    width: sizes.touch,
    height: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
