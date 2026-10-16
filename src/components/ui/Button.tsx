import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { type ColorName, colors, radii, sizes, spacing, themed } from '@/theme';

import { Text } from './Text';

// `hero` is the primary action on the home page's opening block.
type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'hero';

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
  hero: 'heroActionText',
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

const styles = themed(() => ({
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
  hero: {
    backgroundColor: colors.heroAction,
  },
  disabled: {
    opacity: 0.35,
  },
}));

const pressedStyles = themed(() => ({
  primary: {
    backgroundColor: colors.accentPressed,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  quiet: {
    opacity: 0.6,
  },
  hero: {
    opacity: 0.85,
  },
}));
