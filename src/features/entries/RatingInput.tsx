import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { t } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';
import { sizes } from '@/theme';

import { MAX_RATING } from './types';

type RatingInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
};

const steps = Array.from({ length: MAX_RATING }, (_, index) => index + 1);

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
              tapFeedback();
              onChange(value === step ? null : step);
            }}
            style={styles.step}
          >
            <Icon name="star" size={26} color={active ? 'text' : 'placeholder'} filled={active} strokeWidth={1.25} />
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
