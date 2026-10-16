import { Pressable, View } from 'react-native';

import { colors, radii, themed } from '@/theme';

import { Text } from './Text';

type SegmentedControlProps<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// A few equal choices on one control, such as a period or a week: an
// outlined track with the chosen one filled in. Switching between whole
// views, as the diary does, is left to plain chips.
export function SegmentedControl<T extends string | number>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text variant="label" color={selected ? 'textOnAccent' : 'textSecondary'} style={styles.label}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() => ({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  selected: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 14,
  },
}));
