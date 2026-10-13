import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { colors, radii, sizes, spacing, type ColorName } from '@/theme';

import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'quiet';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle;
};

const labelColor: Record<ButtonVariant, ColorName> = {
  primary: 'textOnAccent',
  secondary: 'text',
  quiet: 'textSecondary',
};

// Buttons fill the width of their container. Wrap one in a row or give it
// `alignSelf` to size it to its label.
export function Button({ label, variant = 'primary', loading = false, disabled, style, ...rest }: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && pressedStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[labelColor[variant]]} />
      ) : (
        <Text variant="button" color={labelColor[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    borderWidth: sizes.hairline,
    borderColor: colors.borderStrong,
  },
  quiet: {
    minHeight: sizes.touch,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.35,
  },
});

const pressedStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accentPressed,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  quiet: {
    opacity: 0.6,
  },
});
